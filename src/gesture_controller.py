import cv2
import mediapipe as mp
import pyautogui
import numpy as np
import time

# MediaPipe hands setup
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

class GestureController:
    gc_mode = False
    cap = None
    CAM_HEIGHT = 480
    CAM_WIDTH = 640

    def __init__(self):
        GestureController.gc_mode = True
        GestureController.cap = cv2.VideoCapture(0)
        GestureController.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.CAM_WIDTH)
        GestureController.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.CAM_HEIGHT)

    @staticmethod
    def get_finger_states(hand_landmarks):
        """Returns list of booleans: True if finger is extended"""
        tips = [8, 12, 16, 20]   # index, middle, ring, pinky tip IDs
        states = []
        for tip in tips:
            # Compare tip y with pip (two joints below tip)
            states.append(
                hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y
            )
        return states

    @staticmethod
    def get_distance(p1, p2, frame_shape):
        """Euclidean distance between two landmarks in pixel space"""
        h, w = frame_shape[:2]
        x1, y1 = int(p1.x * w), int(p1.y * h)
        x2, y2 = int(p2.x * w), int(p2.y * h)
        return np.hypot(x2 - x1, y2 - y1)

    def classify_gesture(self, hand_landmarks, frame):
        fingers = self.get_finger_states(hand_landmarks)
        index_tip = hand_landmarks.landmark[8]
        thumb_tip = hand_landmarks.landmark[4]
        pinch_dist = self.get_distance(index_tip, thumb_tip, frame.shape)

        # --- Gesture rules ---
        if all(not f for f in fingers):
            return "FIST"           # neutral / pause
        if fingers[0] and not any(fingers[1:]):
            return "MOVE"           # cursor movement
        if fingers[0] and fingers[1] and not any(fingers[2:]):
            return "SCROLL"         # two fingers up = scroll
        if pinch_dist < 30:
            return "CLICK"          # pinch = left click
        if all(fingers):
            return "RIGHT_CLICK"    # open palm = right click
        return "NONE"

    def run(self):
        screen_w, screen_h = pyautogui.size()
        prev_x, prev_y = 0, 0
        smooth = 5  # smoothing factor

        with mp_hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.75,
            min_tracking_confidence=0.75,
        ) as hands:
            while GestureController.cap.isOpened() and GestureController.gc_mode:
                success, frame = GestureController.cap.read()
                if not success:
                    continue

                frame = cv2.flip(frame, 1)
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(rgb)

                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(
                            frame, hand_landmarks, mp_hands.HAND_CONNECTIONS
                        )
                        gesture = self.classify_gesture(hand_landmarks, frame)
                        index = hand_landmarks.landmark[8]

                        if gesture == "MOVE":
                            # Map landmark coords to screen coords
                            x = int(np.interp(index.x, [0.1, 0.9], [0, screen_w]))
                            y = int(np.interp(index.y, [0.1, 0.9], [0, screen_h]))
                            # Smoothing
                            curr_x = prev_x + (x - prev_x) / smooth
                            curr_y = prev_y + (y - prev_y) / smooth
                            pyautogui.moveTo(curr_x, curr_y)
                            prev_x, prev_y = curr_x, curr_y

                        elif gesture == "CLICK":
                            pyautogui.click()
                            time.sleep(0.3)

                        elif gesture == "RIGHT_CLICK":
                            pyautogui.rightClick()
                            time.sleep(0.3)

                        elif gesture == "SCROLL":
                            pyautogui.scroll(3)
                            time.sleep(0.1)

                        cv2.putText(frame, gesture, (10, 40),
                                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 2)

                cv2.imshow("T4 Gesture Control", frame)
                if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit
                    break

        GestureController.cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    gc = GestureController()
    gc.run()