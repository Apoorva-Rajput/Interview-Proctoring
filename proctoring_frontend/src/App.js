import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import Candidate from "./components/Candidate";
// import Candidate from "./Candidate";

function App() {
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const candidateId = localStorage.getItem("candidate_id");
    const interviewerId = localStorage.getItem("interviewer_id");
    if (candidateId) {
      setUserId(candidateId);
      setRole("candidate");
    } else if (interviewerId) {
      setUserId(interviewerId);
      setRole("interviewer");
    }
  }, []);

  if (!userId || !role) {
    return <LoginPage onLogin={(id, r) => { setUserId(id); setRole(r); }} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("candidate_id");
    localStorage.removeItem("interviewer_id");
    setUserId(null);
    setRole(null);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", background: "#d32f2f", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </div>
      {role === "candidate" ? (
        <div className="main-content-row">
          <Candidate candidateId={userId} />
        </div>
      ) : (
        <div className="main-content-row">
          <Candidate candidateId={userId} />
          <Dashboard candidateId={userId} />
        </div>
      )}
    </>
  );
}

export default App;
