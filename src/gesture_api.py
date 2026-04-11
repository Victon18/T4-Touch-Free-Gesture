from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
from gesture_controller import GestureController

app = FastAPI(title="T4 Gesture Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

gc_thread = None
gc_instance = None

class StatusResponse(BaseModel):
    status: str
    gc_mode: bool

@app.post("/gesture/start", response_model=StatusResponse)
def start_gesture():
    global gc_thread, gc_instance
    if GestureController.gc_mode:
        return {"status": "already running", "gc_mode": True}
    gc_instance = GestureController()
    gc_thread = threading.Thread(target=gc_instance.run, daemon=True)
    gc_thread.start()
    return {"status": "started", "gc_mode": True}

@app.post("/gesture/stop", response_model=StatusResponse)
def stop_gesture():
    GestureController.gc_mode = False
    return {"status": "stopped", "gc_mode": False}

@app.get("/gesture/status", response_model=StatusResponse)
def get_status():
    return {"status": "running" if GestureController.gc_mode else "stopped",
            "gc_mode": GestureController.gc_mode}