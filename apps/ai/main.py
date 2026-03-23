from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal, Optional
import threading
import time
import cv as cv_module

app = FastAPI(title="GestureControl API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Device registry ───────────────────────────────────────────────────────────
# Each entry has a "type" that drives which controls are available
devices: dict = {
    "light": {
        "type": "light",
        "label": "Ceiling Light",
        "icon": "💡",
        "status": "OFF",
        "brightness": 50,
    },
    "fan": {
        "type": "fan",
        "label": "Ceiling Fan",
        "icon": "🌀",
        "status": "OFF",
        "speed": 1,
    },
    "tv": {
        "type": "tv",
        "label": "Smart TV",
        "icon": "📺",
        "status": "OFF",
        "channel": 1,
        "volume": 30,
    },
    "ac": {
        "type": "ac",
        "label": "Air Conditioner",
        "icon": "❄️",
        "status": "OFF",
        "temperature": 24,   # °C  (16 – 30)
        "mode": "cool",      # cool | heat | auto | dry | fan
    },
    "speaker": {
        "type": "speaker",
        "label": "Music Player",
        "icon": "🔊",
        "status": "OFF",
        "volume": 50,
        "track": 1,
    },
}

DeviceKey = Literal["light", "fan", "tv", "ac", "speaker"]

# ── Request models ────────────────────────────────────────────────────────────
class ControlRequest(BaseModel):
    device: str
    action: str          # toggle | set_brightness | set_speed | set_volume |
                         # set_channel | set_temperature | set_mode |
                         # next_track | prev_track | set_track
    value:  Optional[int]   = None
    svalue: Optional[str]   = None  # string-valued actions (e.g. mode)

# ── Gesture endpoints ─────────────────────────────────────────────────────────
@app.get("/gesture")
async def get_gesture():
    return {
        "gesture":    cv_module.latest_gesture,
        "confidence": cv_module.latest_confidence,
    }

# ── Device endpoints ──────────────────────────────────────────────────────────
@app.get("/devices")
async def get_devices():
    return devices

@app.post("/control")
async def control_device(req: ControlRequest):
    if req.device not in devices:
        raise HTTPException(status_code=404, detail=f"Unknown device: {req.device}")

    dev  = devices[req.device]
    kind = dev["type"]

    # ── Universal: toggle ────────────────────────────────────────────────────
    if req.action == "toggle":
        dev["status"] = "ON" if dev["status"] == "OFF" else "OFF"

    # ── Light ────────────────────────────────────────────────────────────────
    elif req.action == "set_brightness":
        if kind != "light":
            raise HTTPException(422, "set_brightness only for light")
        dev["brightness"] = max(1, min(100, req.value or dev["brightness"]))

    # ── Fan ──────────────────────────────────────────────────────────────────
    elif req.action == "set_speed":
        if kind != "fan":
            raise HTTPException(422, "set_speed only for fan")
        dev["speed"] = max(1, min(5, req.value or dev["speed"]))

    # ── TV ───────────────────────────────────────────────────────────────────
    elif req.action == "set_channel":
        if kind != "tv":
            raise HTTPException(422, "set_channel only for tv")
        dev["channel"] = max(1, min(999, req.value or dev["channel"]))

    elif req.action == "set_volume":
        if kind not in ("tv", "speaker"):
            raise HTTPException(422, "set_volume only for tv / speaker")
        dev["volume"] = max(0, min(100, req.value or dev["volume"]))

    # ── AC ───────────────────────────────────────────────────────────────────
    elif req.action == "set_temperature":
        if kind != "ac":
            raise HTTPException(422, "set_temperature only for ac")
        dev["temperature"] = max(16, min(30, req.value or dev["temperature"]))

    elif req.action == "set_mode":
        if kind != "ac":
            raise HTTPException(422, "set_mode only for ac")
        allowed = {"cool", "heat", "auto", "dry", "fan"}
        mode = req.svalue or "cool"
        if mode not in allowed:
            raise HTTPException(422, f"Unknown AC mode: {mode}")
        dev["mode"] = mode

    # ── Speaker / Music ──────────────────────────────────────────────────────
    elif req.action == "next_track":
        if kind != "speaker":
            raise HTTPException(422, "next_track only for speaker")
        dev["track"] = dev["track"] % 99 + 1

    elif req.action == "prev_track":
        if kind != "speaker":
            raise HTTPException(422, "prev_track only for speaker")
        dev["track"] = max(1, dev["track"] - 1)

    elif req.action == "set_track":
        if kind != "speaker":
            raise HTTPException(422, "set_track only for speaker")
        dev["track"] = max(1, min(99, req.value or dev["track"]))

    else:
        raise HTTPException(422, f"Unknown action: {req.action}")

    return {"ok": True, "device": req.device, "state": dev}

# ── All-off shortcut ──────────────────────────────────────────────────────────
@app.post("/all_off")
async def all_off():
    for dev in devices.values():
        dev["status"] = "OFF"
    return {"ok": True, "devices": devices}

# ── Gesture-action log (last 20) ──────────────────────────────────────────────
_action_log: list[dict] = []

@app.get("/action_log")
async def action_log():
    return {"log": list(_action_log[-20:])}


def push_log(entry: dict):
    _action_log.append(entry)
    if len(_action_log) > 200:
        _action_log.pop(0)

# ── MJPEG video feed ──────────────────────────────────────────────────────────
def _mjpeg_generator():
    while True:
        frame = cv_module.latest_frame
        if frame is None:
            time.sleep(0.05)
            continue
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )
        time.sleep(1 / 30)

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        _mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )

# ── Background CV thread ──────────────────────────────────────────────────────
threading.Thread(target=cv_module.run_cv, daemon=True).start()
