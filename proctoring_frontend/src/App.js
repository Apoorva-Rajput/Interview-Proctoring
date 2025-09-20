import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import Candidate from "./components/Candidate";
// import Candidate from "./Candidate";

function App() {
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const candidateId = sessionStorage.getItem("candidate_id");
    const interviewerId = sessionStorage.getItem("interviewer_id");
    const name = sessionStorage.getItem("candidate_name") || sessionStorage.getItem("interviewer_name");
    
    if (candidateId) {
      setUserId(candidateId);
      setName(name);
      setRole("candidate");
    } else if (interviewerId) {
      setUserId(interviewerId);
      setName(name);
      setRole("interviewer");
    }
  }, []);

  if (!userId || !role) {
    return <LoginPage onLogin={(id, name, r) => { setUserId(id); setName(name); setRole(r); }} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem("candidate_id");
    sessionStorage.removeItem("interviewer_id");
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
          <Candidate candidateId={userId} candidateName={name} />
        </div>
      ) : (
        <div className="main-content-row">
          <Candidate candidateId={userId} candidateName={name} />
          <Dashboard candidateId={userId} candidateName={name} />
        </div>
      )}
    </>
  );
}

export default App;
