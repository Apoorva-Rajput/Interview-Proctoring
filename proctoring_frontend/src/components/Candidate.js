import React, { useEffect, useRef, useState } from "react";

const Candidate = ({ candidateId , candidateName }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      stream = s;
      videoRef.current.srcObject = stream;
    });

    // Send frame every 2s
    const interval = setInterval(captureAndSend, 2000);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
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
      // Optionally handle error
    }
  };

  const startRecording = () => {
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new window.MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  useEffect(() => {
    if (!recording && recordedChunks.length > 0) {
      // Upload video to backend
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("video", blob, `${candidateId}_video.webm`);
      formData.append("candidate_id", candidateId);
      fetch("http://localhost:8000/upload_video", {
        method: "POST",
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to upload video");
        })
        .catch((err) => {
          alert("Error uploading video: " + err.message);
        });
    }
    // eslint-disable-next-line
  }, [recording]);

  return (
    <div className="candidate-container">
      <h2 className="candidate-title">Candidate Screen - {candidateName}</h2>
      <video ref={videoRef} autoPlay playsInline className="candidate-video" />
      <div style={{ marginTop: "1.5rem" }}>
        {!recording ? (
          <button className="download-report-btn" onClick={startRecording}>Start Recording</button>
        ) : (
          <button className="download-report-btn" onClick={stopRecording}>Stop & Upload Video</button>
        )}
      </div>
    </div>
  );
};

export default Candidate;
