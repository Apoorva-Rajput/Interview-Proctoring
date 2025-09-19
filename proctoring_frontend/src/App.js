import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import Candidate from "./components/Candidate";
// import Candidate from "./Candidate";

function App() {
  const [candidateId, setCandidateId] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem("candidate_id");
    if (storedId) setCandidateId(storedId);
  }, []);

  if (!candidateId) {
    return <LoginPage onLogin={setCandidateId} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("candidate_id");
    setCandidateId(null);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
        <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", background: "#d32f2f", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </div>
      <Candidate candidateId={candidateId} />
      <Dashboard candidateId={candidateId} />
    </>
  );
}

export default App;
