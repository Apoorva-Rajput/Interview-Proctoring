# app.py
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from db import get_events
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import pandas as pd

app = FastAPI(title="Proctoring API (Mongo)")

@app.get("/")
def root():
    return {"message": "Proctoring API (MongoDB) running"}

@app.get("/logs/{candidate_id}")
def logs(candidate_id: str, limit: int = 1000):
    events = get_events(candidate_id, limit=limit)
    return JSONResponse(content={"events": events})

@app.get("/report/{candidate_id}")
def report(candidate_id: str):
    events = get_events(candidate_id, limit=10000)
    if not events:
        return {"message": "No events found for candidate"}

    # Create CSV in-memory
    df = pd.DataFrame(events)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    # Create simple PDF
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    c.setFont("Helvetica", 12)
    c.drawString(40, 750, f"Proctoring Report - Candidate: {candidate_id}")
    c.drawString(40, 735, f"Total events: {len(events)}")
    y = 710
    for ev in reversed(events):  # oldest first in print
        text = f"{ev.get('timestamp','')} | {ev.get('type','')} | {ev.get('details','')}"
        c.drawString(40, y, text[:100])  # truncate if too long
        y -= 15
        if y < 60:
            c.showPage()
            c.setFont("Helvetica", 12)
            y = 750
    c.save()
    pdf_buffer.seek(0)

    # Return PDF streaming response
    return StreamingResponse(pdf_buffer, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={candidate_id}_proctor_report.pdf"})
