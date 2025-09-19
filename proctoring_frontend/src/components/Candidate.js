import React, { useEffect, useRef } from "react";

const Candidate = ({ candidateId }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });

    // Send frame every 2s
    const interval = setInterval(captureAndSend, 2000);

    return () => clearInterval(interval);
  }, []);

  const captureAndSend = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, frame: dataURL }),
      });
      if (!res.ok) {
        throw new Error("Server error: " + res.status);
      }
    } catch (err) {
      alert("Error sending frame: " + err.message);
    }
  };

  return (
    <div>
      <h2>Candidate Screen - {candidateId}</h2>
      <video ref={videoRef} autoPlay playsInline style={{ width: "500px" }} />
    </div>
  );
};

export default Candidate;
