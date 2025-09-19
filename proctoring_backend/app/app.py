from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import base64, io, cv2, numpy as np
from detection import analyze_frame
from db import insert_event, get_events
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

app = FastAPI(title="Proctoring API (Browser Upload)")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Proctoring API running"}

@app.post("/analyze")
async def analyze(req: Request):
    """
    Candidate sends webcam frame (base64) + candidate_id.
    We run YOLO+MediaPipe and log suspicious events.
    """
    data = await req.json()
    candidate_id = data["candidate_id"]
    frame_data = data["frame"]

    # Decode base64 -> numpy image
    img_bytes = base64.b64decode(frame_data.split(",")[1])
    np_arr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Run detection
    events = analyze_frame(frame)
    for ev in events:
        insert_event(candidate_id, ev)

    return {"events_detected": len(events)}

@app.get("/logs/{candidate_id}")
def logs(candidate_id: str, limit: int = 100):
    events = get_events(candidate_id, limit)
    return JSONResponse(content={"events": events})

@app.get("/report/{candidate_id}")
def report(candidate_id: str):
    events = get_events(candidate_id, limit=10000)
    if not events:
        return {"message": "No events found"}

    # Export CSV
    df = pd.DataFrame(events)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)

    # Generate PDF
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    c.setFont("Helvetica", 12)
    c.drawString(40, 750, f"Proctoring Report - Candidate: {candidate_id}")
    c.drawString(40, 735, f"Total events: {len(events)}")
    y = 710
    for ev in reversed(events):
        text = f"{ev.get('timestamp','')} | {ev.get('type','')} | {ev.get('details','')}"
        c.drawString(40, y, text[:100])
        y -= 15
        if y < 60:
            c.showPage()
            c.setFont("Helvetica", 12)
            y = 750
    c.save()
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={candidate_id}_report.pdf"}
    )
from fastapi import Request
from db import create_candidate, authenticate_candidate

@app.post("/register")
async def register(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return JSONResponse(status_code=400, content={"error": "username & password required"})

    candidate_id = create_candidate(username, password)
    if not candidate_id:
        return JSONResponse(status_code=400, content={"error": "User already exists"})

    return {"message": "Registration successful", "candidate_id": candidate_id}

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")

    candidate_id = authenticate_candidate(username, password)
    if not candidate_id:
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})

    return {"message": "Login successful", "candidate_id": candidate_id}
