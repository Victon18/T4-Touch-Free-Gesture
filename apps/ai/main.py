import os
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, field_validator, model_validator
from typing import Literal, Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import threading
import time
import cv as cv_module

# ── Allowed origins (configurable via env) ────────────────────────────────────
ALLOWED_ORIGINS: list[str] = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="GestureControl API", version="2.0")

# Register rate-limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS (restricted to trusted frontend origins) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Requested-With"],
)

# ── Security headers middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    return response

# ── CSRF-like origin guard for state-mutating routes ─────────────────────────
def _check_origin(request: Request) -> None:
    """Reject POST requests whose Origin/Referer is not in ALLOWED_ORIGINS."""
    origin  = request.headers.get("origin")  or ""
    referer = request.headers.get("referer") or ""
    trusted = any(o in origin or o in referer for o in ALLOWED_ORIGINS)
    # Allow requests with no origin header (server-to-server, curl during dev)
    if origin and not trusted:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: untrusted origin",
        )

# ── Device registry ───────────────────────────────────────────────────────────
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
        "temperature": 24,
        "mode": "cool",
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

_ALLOWED_ACTIONS = frozenset({
    "toggle",
    "set_brightness",
    "set_speed",
    "set_channel",
    "set_volume",
    "set_temperature",
    "set_mode",
    "next_track",
    "prev_track",
    "set_track",
})

_ALLOWED_AC_MODES = frozenset({"cool", "heat", "auto", "dry", "fan"})

# ── Request models (with validation) ─────────────────────────────────────────
class ControlRequest(BaseModel):
    device:  str
    action:  str
    value:   Optional[int] = None
    svalue:  Optional[str] = None

    @field_validator("device")
    @classmethod
    def validate_device(cls, v: str) -> str:
        allowed = {"light", "fan", "tv", "ac", "speaker"}
        if v not in allowed:
            raise ValueError(f"device must be one of {sorted(allowed)}")
        return v

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in _ALLOWED_ACTIONS:
            raise ValueError(f"action must be one of {sorted(_ALLOWED_ACTIONS)}")
        return v

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (-1 <= v <= 1000):
            raise ValueError("value must be between -1 and 1000")
        return v

    @field_validator("svalue")
    @classmethod
    def validate_svalue(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) > 20:
                raise ValueError("svalue too long")
            if v not in _ALLOWED_AC_MODES:
                raise ValueError(f"svalue must be one of {sorted(_ALLOWED_AC_MODES)}")
        return v

# ── Gesture endpoints ─────────────────────────────────────────────────────────
@app.get("/gesture")
@limiter.limit("60/minute")
async def get_gesture(request: Request):
    return {
        "gesture":    cv_module.latest_gesture,
        "confidence": cv_module.latest_confidence,
    }

# ── Device endpoints ──────────────────────────────────────────────────────────
@app.get("/devices")
@limiter.limit("60/minute")
async def get_devices(request: Request):
    return devices

@app.post("/control")
@limiter.limit("30/minute")
async def control_device(request: Request, req: ControlRequest):
    _check_origin(request)

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
        mode = req.svalue or "cool"
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
@limiter.limit("10/minute")
async def all_off(request: Request):
    _check_origin(request)
    for dev in devices.values():
        dev["status"] = "OFF"
    return {"ok": True, "devices": devices}

# ── Gesture-action log (last 20) ──────────────────────────────────────────────
_action_log: list[dict] = []

@app.get("/action_log")
@limiter.limit("30/minute")
async def action_log(request: Request):
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
@limiter.limit("10/minute")
def video_feed(request: Request):
    return StreamingResponse(
        _mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )

# ── Background CV thread ──────────────────────────────────────────────────────
threading.Thread(target=cv_module.run_cv, daemon=True).start()
