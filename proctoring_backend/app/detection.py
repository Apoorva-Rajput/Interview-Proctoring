import cv2
import mediapipe as mp
from ultralytics import YOLO
import time
import math

# Load models
mp_face_detection = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.6)
mp_face_mesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
yolo = YOLO("yolov8n.pt")  # small & fast

# State
last_face_detected = time.time()
focus_away_start = None

def get_head_orientation(landmarks, frame_w, frame_h):
    """ Rough head orientation check: returns left, right, or forward """
    # Nose tip landmark
    nose = landmarks[1]
    nose_x = nose.x * frame_w

    center_x = frame_w // 2
    offset = nose_x - center_x

    if abs(offset) < frame_w * 0.15:  # within 15% of center
        return "forward"
    elif offset < 0:
        return "left"
    else:
        return "right"

def analyze_frame(frame):
    global last_face_detected, focus_away_start

    events = []
    timestamp = time.strftime("%H:%M:%S")
    frame_h, frame_w = frame.shape[:2]

    # ---------- FACE DETECTION ----------
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = mp_face_detection.process(rgb_frame)

    if not results.detections:
        if time.time() - last_face_detected > 10:
            events.append({"time": timestamp, "type": "NO_FACE", "details": "No face >10s"})
        return events
    else:
        # Update last face seen
        last_face_detected = time.time()

        if len(results.detections) > 1:
            events.append({"time": timestamp, "type": "MULTIPLE_FACES", "details": "More than 1 face"})

    # ---------- HEAD ORIENTATION ----------
    mesh_results = mp_face_mesh.process(rgb_frame)
    if mesh_results.multi_face_landmarks:
        orientation = get_head_orientation(mesh_results.multi_face_landmarks[0].landmark, frame_w, frame_h)

        if orientation == "forward":
            focus_away_start = None
        else:
            if not focus_away_start:
                focus_away_start = time.time()
            elif time.time() - focus_away_start > 5:
                events.append({"time": timestamp, "type": "FOCUS_LOST", "details": f"Looking {orientation} >5s"})
                focus_away_start = None

    # ---------- OBJECT DETECTION ----------
    yolo_results = yolo(frame, verbose=False)
    for r in yolo_results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = yolo.names[cls_id]
            if label in ["cell phone", "book", "laptop"]:
                events.append({"time": timestamp, "type": "OBJECT_DETECTED", "details": f"{label} detected"})

    return events
