import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import math
from collections import deque

# ── Shared state ────────────────────────────────────────────────────────────
latest_gesture    = "None"
latest_confidence = 0.0          # 0.0 – 1.0
latest_frame      = None         # annotated BGR frame as bytes (JPEG)

# ── Temporal smoothing ───────────────────────────────────────────────────────
_HISTORY_LEN = 7                 # number of recent frames to vote over
_gesture_history: deque = deque(maxlen=_HISTORY_LEN)

# ── MediaPipe 21-landmark indices ────────────────────────────────────────────
FINGER_TIPS = [4, 8, 12, 16, 20]   # thumb, index, middle, ring, pinky
FINGER_PIPS = [3, 6, 10, 14, 18]   # one joint below tip
FINGER_MCPS = [2, 5, 9, 13, 17]    # knuckle (MCP)

# ── Geometry helpers ─────────────────────────────────────────────────────────
def _dist(a, b) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)

def _dist3(a, b) -> float:
    """3-D Euclidean distance between two landmarks."""
    return math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2)

def _hand_scale(lm) -> float:
    """Approximate hand size = wrist-to-middle-MCP distance (normalises for camera depth)."""
    return max(_dist(lm[0], lm[9]), 1e-6)

def _fingers_up(lm) -> list[bool]:
    """
    Return [thumb, index, middle, ring, pinky] booleans.
    Uses 3-D z-depth for thumb to reduce left/right confusion.
    """
    scale = _hand_scale(lm)
    up = []

    # Thumb: tip must be farther from wrist than IP joint (lateral extension)
    thumb_extended = _dist(lm[4], lm[0]) > _dist(lm[3], lm[0])
    up.append(thumb_extended)

    # Other four fingers: tip y < pip y (tip above pip = extended)
    for tip, pip in zip(FINGER_TIPS[1:], FINGER_PIPS[1:]):
        up.append(lm[tip].y < lm[pip].y)

    return up

def _all_curled(lm) -> bool:
    """True when all four fingers AND thumb are clearly folded."""
    scale = _hand_scale(lm)
    # Each fingertip must be close to its MCP knuckle
    for tip, mcp in zip(FINGER_TIPS, FINGER_MCPS):
        if _dist(lm[tip], lm[mcp]) > 0.25 * scale:
            return False
    return True

# ── Gesture classifier ───────────────────────────────────────────────────────
def _raw_gesture(lm) -> tuple[str, float]:
    """
    Returns (gesture_name, confidence) for a single frame.
    Confidence is a rough heuristic in [0, 1].
    """
    up = _fingers_up(lm)
    thumb, index, middle, ring, pinky = up
    scale = _hand_scale(lm)

    n_up = sum(up)

    # ── Open Palm (all 5 extended) ──────────────────────────────────────────
    if all(up):
        return "Open Palm 🖐", 0.95

    # ── Fist (all fingers clearly curled) ──────────────────────────────────
    if _all_curled(lm):
        return "Fist ✊", 0.95

    # ── Pinch (thumb tip & index tip very close) ────────────────────────────
    pinch_dist = _dist(lm[4], lm[8]) / scale
    if pinch_dist < 0.18:
        conf = max(0.5, 1.0 - pinch_dist / 0.18)
        return "Pinch 🤌", round(conf, 2)

    # ── OK (thumb + index close loop, remaining three extended) ─────────────
    ok_dist = _dist(lm[4], lm[8]) / scale
    if ok_dist < 0.22 and middle and ring and pinky:
        conf = max(0.5, 1.0 - ok_dist / 0.22)
        return "OK 👌", round(conf, 2)

    # ── Thumbs Up (thumb extended, others curled) ───────────────────────────
    if thumb and not index and not middle and not ring and not pinky:
        # Extra check: thumb tip must be above wrist
        if lm[4].y < lm[0].y:
            return "Thumbs Up 👍", 0.92

    # ── Thumbs Down (thumb tip clearly below wrist) ─────────────────────────
    if not index and not middle and not ring and not pinky:
        if lm[4].y > lm[0].y + 0.05:
            return "Thumbs Down 👎", 0.90

    # ── Pointing (only index up) ────────────────────────────────────────────
    if index and not middle and not ring and not pinky and not thumb:
        return "Pointing ☝️", 0.88

    # ── Peace / V Sign (index + middle up) ─────────────────────────────────
    if index and middle and not ring and not pinky:
        return "Peace ✌️", 0.90

    # ── Three Fingers (index + middle + ring up) ────────────────────────────
    if index and middle and ring and not pinky and not thumb:
        return "Three Fingers 🤟", 0.88

    # ── Rock 🤘 (index + pinky, middle + ring down) ─────────────────────────
    if index and pinky and not middle and not ring:
        return "Rock 🤘", 0.87

    # ── Call Me 🤙 (thumb + pinky extended, others curled) ──────────────────
    if thumb and pinky and not index and not middle and not ring:
        return "Call Me 🤙", 0.88

    # ── Four Fingers (all except thumb) ────────────────────────────────────
    if index and middle and ring and pinky and not thumb:
        return "Four Fingers 🖖", 0.85

    return "Unknown", 0.30

# ── Temporal smoother (majority vote) ────────────────────────────────────────
def _smooth_gesture(raw: str, raw_conf: float) -> tuple[str, float]:
    """
    Push the latest raw detection into the history deque and return the
    majority-voted gesture along with an adjusted confidence.
    """
    _gesture_history.append((raw, raw_conf))
    counts: dict[str, list[float]] = {}
    for g, c in _gesture_history:
        counts.setdefault(g, []).append(c)

    best_gesture = max(counts, key=lambda g: len(counts[g]))
    votes = len(counts[best_gesture])
    avg_conf = sum(counts[best_gesture]) / votes
    # Boost confidence based on vote ratio
    vote_ratio = votes / _HISTORY_LEN
    final_conf = round(min(1.0, avg_conf * (0.6 + 0.4 * vote_ratio)), 2)
    return best_gesture, final_conf

# ── Filter: only publish gesture if confidence above threshold ──────────────
_CONF_THRESHOLD = 0.55

def recognize_gesture(lm) -> tuple[str, float]:
    raw, raw_conf = _raw_gesture(lm)
    gesture, conf = _smooth_gesture(raw, raw_conf)
    if conf < _CONF_THRESHOLD:
        return "Unknown", conf
    return gesture, conf

# ── Drawing helper ───────────────────────────────────────────────────────────
HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),          # thumb
    (0,5),(5,6),(6,7),(7,8),          # index
    (5,9),(9,10),(10,11),(11,12),     # middle
    (9,13),(13,14),(14,15),(15,16),   # ring
    (13,17),(17,18),(18,19),(19,20),  # pinky
    (0,17),(0,5),                     # palm base
]

# Colour gradient per finger
_FINGER_COLORS = [
    (0,  140, 255),   # thumb  – orange
    (0,  220, 255),   # index  – cyan
    (60, 255, 120),   # middle – green
    (180,100, 255),   # ring   – purple
    (255,180,  80),   # pinky  – gold
]
_FINGER_RANGES = [
    range(0, 4),   # thumb: connections 0-3
    range(4, 8),   # index: connections 4-7
    range(8, 12),  # middle
    range(12,16),  # ring
    range(16,20),  # pinky
]

def _draw_landmarks(frame, hand_landmarks_list, gesture_label: str, confidence: float):
    h, w, _ = frame.shape
    for hand_lm in hand_landmarks_list:
        pts = [(int(lm.x * w), int(lm.y * h)) for lm in hand_lm]

        # Draw connections with per-finger colouring
        for fi, frange in enumerate(_FINGER_RANGES):
            col = _FINGER_COLORS[fi]
            for ci in frange:
                if ci < len(HAND_CONNECTIONS):
                    s, e = HAND_CONNECTIONS[ci]
                    cv2.line(frame, pts[s], pts[e], col, 2, cv2.LINE_AA)

        # Palm connections
        for s, e in HAND_CONNECTIONS[20:]:
            cv2.line(frame, pts[s], pts[e], (80, 80, 200), 2, cv2.LINE_AA)

        # Keypoints
        for i, (x, y) in enumerate(pts):
            cv2.circle(frame, (x, y), 5, (255, 255, 255), -1)
            cv2.circle(frame, (x, y), 5, (0, 180, 255),  1)

    # ── Gesture label + confidence bar ──────────────────────────────────────
    label = f"{gesture_label}  {int(confidence*100)}%"
    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
    box_w = tw + 20
    box_h = th + 20

    # Background pill
    cv2.rectangle(frame, (8, 8), (8 + box_w, 8 + box_h), (10, 5, 20), -1)
    cv2.rectangle(frame, (8, 8), (8 + box_w, 8 + box_h), (60, 40, 120), 1)

    # Confidence fill (green→yellow→red)
    bar_max = box_w - 4
    bar_fill = int(bar_max * confidence)
    bar_color = (
        int(255 * (1 - confidence)),
        int(255 * confidence),
        80,
    )
    cv2.rectangle(frame, (10, 8 + box_h + 4), (10 + bar_fill, 8 + box_h + 10), bar_color, -1)
    cv2.rectangle(frame, (10, 8 + box_h + 4), (10 + bar_max, 8 + box_h + 10), (40, 40, 60), 1)

    # Text
    cv2.putText(frame, label, (18, 8 + th + 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 160), 2, cv2.LINE_AA)

    return frame

# ── Main CV loop ─────────────────────────────────────────────────────────────
def run_cv():
    global latest_gesture, latest_confidence, latest_frame

    base_options = python.BaseOptions(model_asset_path="hand_landmarker.task")
    options      = vision.HandLandmarkerOptions(base_options=base_options, num_hands=2)
    landmarker   = vision.HandLandmarker.create_from_options(options)

    cap = cv2.VideoCapture(0)
    # Request higher resolution for better landmark accuracy
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT,  720)

    while True:
        success, frame = cap.read()
        if not success:
            continue

        frame = cv2.flip(frame, 1)   # mirror so left↔right feel natural

        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = landmarker.detect(mp_image)

        if result.hand_landmarks:
            gesture, conf = recognize_gesture(result.hand_landmarks[0])
            latest_gesture    = gesture
            latest_confidence = conf
            frame = _draw_landmarks(frame, result.hand_landmarks, gesture, conf)
        else:
            _gesture_history.clear()
            latest_gesture    = "None"
            latest_confidence = 0.0
            cv2.putText(frame, "No hand detected", (18, 44),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (80, 80, 80), 2, cv2.LINE_AA)

        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
        latest_frame = buf.tobytes()
