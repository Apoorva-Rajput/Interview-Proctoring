import React, { useEffect, useState } from "react";

const Dashboard = ({ candidateId }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(fetchLogs, 3000); // poll every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`http://localhost:8000/logs/${candidateId}`);
      if (!res.ok) {
        throw new Error("Server error: " + res.status);
      }
      const data = await res.json();
      setLogs(data.events || []);
    } catch (err) {
      alert("Error fetching logs: " + err.message);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch(`http://localhost:8000/report/${candidateId}`);
      if (!res.ok) throw new Error("Failed to download report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidateId}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading report: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="dashboard-title">Dashboard - {candidateId}</h2>
        <button className="download-report-btn" onClick={handleDownloadReport}>Download Report</button>
      </div>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td>{log.timestamp}</td>
              <td>{log.type}</td>
              <td>{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
