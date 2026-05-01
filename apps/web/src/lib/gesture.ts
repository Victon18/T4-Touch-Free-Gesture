import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

let gestureRecognizer: GestureRecognizer | null = null;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

export async function initGestureRecognizer() {
  if (gestureRecognizer) return gestureRecognizer;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
    numHands: 2,
  });
  return gestureRecognizer;
}

export function getGestureRecognizer() {
  return gestureRecognizer;
}

export interface DualHandGestures {
  leftGesture: string | null;
  rightGesture: string | null;
  leftConfidence: number;
  rightConfidence: number;
  bothHandsDetected: boolean;
}

export function detectBothHandsPresent(
  results: any
): { hasLeftHand: boolean; hasRightHand: boolean } {
  if (!results || !results.landmarks || results.landmarks.length === 0) {
    return { hasLeftHand: false, hasRightHand: false };
  }

  const handCount = results.landmarks.length;
  if (handCount < 2) {
    return { hasLeftHand: handCount >= 1, hasRightHand: false };
  }

  return { hasLeftHand: true, hasRightHand: true };
}

export function getHandedness(results: any): {
  leftHandIndex: number | null;
  rightHandIndex: number | null;
} {
  if (!results || !results.handedness || results.handedness.length === 0) {
    return { leftHandIndex: null, rightHandIndex: null };
  }

  let leftHandIndex = null;
  let rightHandIndex = null;

  for (let i = 0; i < results.handedness.length; i++) {
    const handedness = results.handedness[i];
    if (handedness && handedness.length > 0) {
      const label = handedness[0].categoryName;
      if (label === "Left") leftHandIndex = i;
      else if (label === "Right") rightHandIndex = i;
    }
  }

  return { leftHandIndex, rightHandIndex };
}

export function validateHandSeparation(landmarks: any[]): boolean {
  if (landmarks.length < 2) return false;
  
  const left = landmarks[0];
  const right = landmarks[1];
  
  if (!left || !right || left.length < 21 || right.length < 21) return false;
  
  const leftPalm = left[0];
  const rightPalm = right[0];
  
  const distance = Math.hypot(
    leftPalm.x - rightPalm.x,
    leftPalm.y - rightPalm.y
  );
  
  return distance > 0.15;
}

export function detectDualHandGestures(results: any): DualHandGestures {
  const { hasLeftHand, hasRightHand } = detectBothHandsPresent(results);
  const { leftHandIndex, rightHandIndex } = getHandedness(results);

  if (!hasLeftHand || !hasRightHand) {
    return {
      leftGesture: null,
      rightGesture: null,
      leftConfidence: 0,
      rightConfidence: 0,
      bothHandsDetected: false,
    };
  }

  if (!validateHandSeparation(results.landmarks)) {
    return {
      leftGesture: null,
      rightGesture: null,
      leftConfidence: 0,
      rightConfidence: 0,
      bothHandsDetected: false,
    };
  }

  let leftGesture = null;
  let rightGesture = null;
  let leftConfidence = 0;
  let rightConfidence = 0;

  if (leftHandIndex !== null && results.landmarks[leftHandIndex]) {
    leftGesture = detectCustomGestures(results.landmarks[leftHandIndex]);
    if (results.gestures && results.gestures[leftHandIndex]) {
      const gestures = results.gestures[leftHandIndex];
      if (gestures.length > 0) {
        leftConfidence = gestures[0].score;
      }
    }
  }

  if (rightHandIndex !== null && results.landmarks[rightHandIndex]) {
    rightGesture = detectCustomGestures(results.landmarks[rightHandIndex]);
    if (results.gestures && results.gestures[rightHandIndex]) {
      const gestures = results.gestures[rightHandIndex];
      if (gestures.length > 0) {
        rightConfidence = gestures[0].score;
      }
    }
  }

  return {
    leftGesture,
    rightGesture,
    leftConfidence,
    rightConfidence,
    bothHandsDetected: hasLeftHand && hasRightHand,
  };
}

export function detectCustomGestures(landmarks: any[]): string | null {
  if (!landmarks || landmarks.length < 21) return null;
  
  // Finger tips
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Finger PIP joints (middle bone)
  const thumbPIP = landmarks[3];
  const indexPIP = landmarks[6];
  const middlePIP = landmarks[10];
  const ringPIP = landmarks[14];
  const pinkyPIP = landmarks[18];
  
  // Palm base
  const palmBase = landmarks[0];

  // Calculate distances with improved accuracy
  const distPinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  
  // Check finger extension more accurately (compare tip to PIP joint)
  const isIndexUp = indexTip.y < indexPIP.y - 0.03;
  const isMiddleUp = middleTip.y < middlePIP.y - 0.03;
  const isRingUp = ringTip.y < ringPIP.y - 0.03;
  const isPinkyUp = pinkyTip.y < pinkyPIP.y - 0.03;
  const isThumbUp = thumbTip.y < thumbPIP.y - 0.02;
  
  // Thumb spread check - is thumb to the side
  const isThumbOut = Math.abs(thumbTip.x - indexTip.x) > 0.08;
  
  // Distance checks with tighter tolerances
  const isPinchTight = distPinch < 0.05; // Tighter pinch threshold
  const isPinchLoose = distPinch < 0.08;
  
  const fingersUpCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

  // OK gesture: thumb-index close, other fingers up
  if (isPinchLoose && isMiddleUp && isRingUp && isPinkyUp) return "OK";
  
  // PINCH gesture: thumb-index close, other fingers down
  if (isPinchTight && !isMiddleUp && !isRingUp && !isPinkyUp) return "PINCH";

  // THREE: index, middle, ring up; pinky down
  if (isIndexUp && isMiddleUp && isRingUp && !isPinkyUp && !isThumbUp) return "THREE";
  
  // FOUR: all four fingers up
  if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp && !isThumbUp) return "FOUR";
  
  // CALL_ME: thumb and pinky out, other fingers down
  if (isThumbOut && isPinkyUp && !isIndexUp && !isMiddleUp && !isRingUp) return "CALL_ME";
  
  // THUMBS_UP: thumb clearly up, other fingers closed
  if (isThumbUp && !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return "THUMBS_UP";
  
  // PEACE: index and middle up, ring and pinky down, thumb can be either
  if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) return "PEACE";
  
  // ROCK: index and pinky up, middle and ring down
  if (isIndexUp && isPinkyUp && !isMiddleUp && !isRingUp) return "ROCK";
  
  // OPEN_PALM: all fingers up and spread apart
  const spreadCheck = Math.hypot(indexTip.x - pinkyTip.x, indexTip.y - pinkyTip.y) > 0.15;
  if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp && isThumbUp && spreadCheck) return "OPEN_PALM";
  
  // FIST: all fingers closed
  if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp && !isThumbUp) return "FIST";

  return null;
}
