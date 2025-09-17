# detect_and_store.py
import time
import argparse
from ultralytics import YOLO
import cv2
import mediapipe as mp
from db import insert_event
from datetime import datetime

# -------------------------
# Config / thresholds
# -------------------------
NO_FACE_SECONDS = 10        # if no face for this many seconds -> NO_FACE event
FOCUS_AWAY_SECONDS = 5      # if looking away for this many seconds -> FOCUS_LOST
FACE_CENTER_THRESHOLD = 0.15  # fraction of frame width (15%) considered centered
OBJECT_COOLDOWN = 5         # seconds cooldown between logs for same object label

# Suspicious keywords in YOLO label
SUSPICIOUS_KEYWORDS = ["phone", "cell", "book", "notebook", "paper", "laptop", "tablet"]

# -------------------------
# Init models
# -------------------------
print("Loading YOLO model...")
yolo = YOLO("yolov8n.pt")   # small & fast - change to yolov8s/m if you want more accuracy

print("Initializing MediaPipe face detector...")
mp_face = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.5)

# -------------------------
# State variables
# -------------------------
last_face_seen = time.time()
focus_away_start = None
last_no_face_logged = 0
last_multiple_faces_logged = 0
last_object_logged_time = {}  # dict[label] = last_logged_timestamp

# -------------------------
# Helpers
# -------------------------
def now_iso():
    return datetime.utcnow().isoformat()

def is_suspicious_label(label: str):
    ll = label.lower()
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in ll:
            return True
    return False

def log_event(candidate_id, event_type, details, extra=None):
    """
    Inserts event into MongoDB via db.insert_event
    `extra` can hold bounding box, confidence, frame_id, etc.
    """
    event = {
        "type": event_type,
        "details": details,
        "timestamp": now_iso()
    }
    if extra:
        event.update(extra)
    insert_event(candidate_id, event)
    print(f"[{event['timestamp']}] {event_type} - {details}")

# -------------------------
# Main webcam loop
# -------------------------
def process_webcam(candidate_id: str, cam_index=0):
    global last_face_seen, focus_away_start, last_no_face_logged, last_multiple_faces_logged

    cap = cv2.VideoCapture(cam_index)
    if not cap.isOpened():
        raise RuntimeError("Unable to open webcam. Check cam_index or permissions.")

    frame_id = 0
    print("Starting webcam. Press 'q' to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Frame read failed, exiting.")
            break

        frame_h, frame_w = frame.shape[:2]
        timestamp = time.time()

        # ---- MediaPipe face detection (for presence/multiple/focus) ----
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_results = mp_face.process(rgb)

        face_count = 0
        face_center_x_norm = None

        if face_results.detections:
            face_count = len(face_results.detections)

            # Use first face bbox to estimate center (we assume candidate is primary face)
            # location_data gives relative bounding box (xmin, ymin, width, height)
            bb = face_results.detections[0].location_data.relative_bounding_box
            cx = bb.xmin + bb.width / 2.0  # relative 0..1
            face_center_x_norm = cx  # normalized center x
            last_face_seen = timestamp
        else:
            # no face detected in this frame
            pass

        # ---- NO FACE logic (> NO_FACE_SECONDS) ----
        if (time.time() - last_face_seen) > NO_FACE_SECONDS:
            # avoid logging repeatedly: allow log once per NO_FACE_SECONDS
            if time.time() - last_no_face_logged > NO_FACE_SECONDS:
                log_event(candidate_id, "NO_FACE", f"No face detected for >{NO_FACE_SECONDS} seconds", extra={"frame_id": frame_id})
                last_no_face_logged = time.time()

        # ---- MULTIPLE FACES logic ----
        if face_count > 1:
            # cooldown to avoid spamming
            if time.time() - last_multiple_faces_logged > 10:
                log_event(candidate_id, "MULTIPLE_FACES", f"{face_count} faces detected in frame", extra={"frame_id": frame_id})
                last_multiple_faces_logged = time.time()

        # ---- FOCUS / LOOKING AWAY logic ----
        # If we have a face center, compare its normalized x with 0.5 (center)
        if face_center_x_norm is not None:
            offset = face_center_x_norm - 0.5  # negative => left, positive => right
            if abs(offset) <= FACE_CENTER_THRESHOLD:
                # considered looking forward
                focus_away_start = None
            else:
                # looking away (left/right)
                if focus_away_start is None:
                    focus_away_start = time.time()
                else:
                    # if sustained longer than threshold -> log
                    if time.time() - focus_away_start > FOCUS_AWAY_SECONDS:
                        direction = "left" if offset < 0 else "right"
                        log_event(candidate_id, "FOCUS_LOST", f"Looking {direction} for >{FOCUS_AWAY_SECONDS}s", extra={"frame_id": frame_id})
                        focus_away_start = None  # reset after logging

        # ---- YOLO object detection ----
        # Run inference (this returns results with boxes)
        yolo_results = yolo(frame, verbose=False)

        # annotate_frame from YOLO (use first result)
        annotated = frame
        if len(yolo_results) > 0:
            annotated = yolo_results[0].plot()  # draws boxes/labels on the frame

            # iterate boxes and conditionally log suspicious objects
            for box in yolo_results[0].boxes:
                cls_id = int(box.cls[0])
                label = yolo.names[cls_id]
                conf = float(box.conf[0]) if hasattr(box.conf, "__len__") else float(box.conf)
                label_lower = label.lower()

                if is_suspicious_label(label):
                    # use a cooldown so we don't insert duplicate events every frame
                    now_t = time.time()
                    last_t = last_object_logged_time.get(label_lower, 0)
                    if now_t - last_t > OBJECT_COOLDOWN:
                        details = f"{label} detected (conf={conf:.2f})"
                        bbox = None
                        try:
                            xyxy = list(map(float, box.xyxy[0]))
                            bbox = { "x_min": xyxy[0], "y_min": xyxy[1], "x_max": xyxy[2], "y_max": xyxy[3] }
                        except Exception:
                            bbox = None
                        extra = {"frame_id": frame_id, "confidence": conf, "bbox": bbox}
                        log_event(candidate_id, "OBJECT_DETECTED", details, extra=extra)
                        last_object_logged_time[label_lower] = now_t

        # ---- Display info on screen (simple overlay) ----
        overlay = annotated.copy()
        status_text = f"Frame: {frame_id}  Faces: {face_count}"
        if face_center_x_norm is not None:
            offset_pct = (face_center_x_norm - 0.5) * 200  # percent left or right
            status_text += f"  FaceOffset: {offset_pct:.1f}%"
        cv2.putText(overlay, status_text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

        cv2.imshow("Proctoring - Webcam (press q to quit)", overlay)

        frame_id += 1

        # quit key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

# -------------------------
# CLI
# -------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run webcam YOLO+MediaPipe proctoring")
    parser.add_argument("--candidate-id", type=str, default="candidate_1", help="Candidate/session id to tag events")
    parser.add_argument("--cam-index", type=int, default=0, help="Webcam index (default 0)")
    args = parser.parse_args()

    process_webcam(candidate_id=args.candidate_id, cam_index=args.cam_index)
