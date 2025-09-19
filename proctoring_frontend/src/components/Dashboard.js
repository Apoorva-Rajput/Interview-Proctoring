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

  return (
    <div>
      <h2>Dashboard - {candidateId}</h2>
      <table border="1" cellPadding="5">
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
