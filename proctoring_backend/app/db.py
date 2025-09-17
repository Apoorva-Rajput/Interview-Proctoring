# db.py
import os
from pymongo import MongoClient
from datetime import datetime

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["proctoring_db"]
detections_collection = db["detections"]

def insert_event(candidate_id: str, event: dict):
    """
    event should be a dict with keys like:
      { "type": "OBJECT_DETECTED", "details": "...", "timestamp": "ISO...", "frame_id": 12, ... }
    """
    doc = {
        "candidate_id": candidate_id,
        "timestamp": event.get("timestamp", datetime.utcnow().isoformat()),
        **event
    }
    detections_collection.insert_one(doc)

def get_events(candidate_id: str, limit: int = 1000):
    """Return events for a candidate (most recent first)."""
    cursor = detections_collection.find({"candidate_id": candidate_id}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    return list(cursor)
