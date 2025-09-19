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

  return (
    <>
      <Candidate candidateId={candidateId} />
      <Dashboard candidateId={candidateId} />
    </>
  );
}

export default App;
