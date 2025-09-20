import os
from pymongo import MongoClient, ASCENDING
from datetime import datetime

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["proctoring_db"]

# Ensure collection exists and create an index on candidate_id
if "detections" not in db.list_collection_names():
    detections_collection = db.create_collection("detections")
    # Optional: create index on candidate_id + timestamp
    detections_collection.create_index([("candidate_id", ASCENDING), ("timestamp", ASCENDING)])
else:
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
    cursor = detections_collection.find(
        {"candidate_id": candidate_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    return list(cursor)


candidates_collection = db["candidates"]
interviewers_collection = db["interviewers"]

def create_candidate(username: str, password: str, name: str = "", email: str = ""):
    """Create a new candidate account (simple password storage for demo)."""
    existing = candidates_collection.find_one({"username": username})
    if existing:
        return None  # already exists

    candidate = {
        "username": username,
        "password": password,   # ⚠️ for production: hash this!
        "name": name,
        "email": email,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = candidates_collection.insert_one(candidate)
    return {"id": str(result.inserted_id), "name": name}

def authenticate_candidate(username: str, password: str):
    """Verify candidate login and return ID if success."""
    candidate = candidates_collection.find_one({"username": username, "password": password})
    if candidate:
        return {"id": str(candidate["_id"]), "name": candidate["name"]}
    return None

def create_interviewer(username: str, password: str, name: str = "", email: str = ""):
    """Create a new interviewer account."""
    existing = interviewers_collection.find_one({"username": username})
    if existing:
        return None
    interviewer = {
        "username": username,
        "password": password,
        "name": name,
        "email": email,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = interviewers_collection.insert_one(interviewer)
    return {"id": str(result.inserted_id), "name": name}

def authenticate_interviewer(username: str, password: str):
    """Verify interviewer login and return ID if success."""
    interviewer = interviewers_collection.find_one({"username": username, "password": password})
    if interviewer:
        return {"id": str(interviewer["_id"]), "name": interviewer["name"]}
    return None

