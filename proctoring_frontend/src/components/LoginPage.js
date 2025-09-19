import React, { useState } from "react";
import "../App.css";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("candidate");
  const [message, setMessage] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async () => {
    const url = "http://localhost:8000/login";
    const payload = { username, password, role };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (role === "candidate" && data.candidate_id) {
        localStorage.setItem("candidate_id", data.candidate_id);
        setMessage(`Login successful!`);
        if (onLogin) onLogin(data.candidate_id, "candidate");
      } else if (role === "interviewer" && data.interviewer_id) {
        localStorage.setItem("interviewer_id", data.interviewer_id);
        setMessage(`Login successful!`);
        if (onLogin) onLogin(data.interviewer_id, "interviewer");
      } else {
        setMessage(data.error || "Invalid credentials");
      }
    } catch (err) {
      setMessage("Server error");
      console.error(err);
    }
  };

  const handleRegister = async () => {
    const url = "http://localhost:8000/register";
    const payload = { username, password, name, email, role };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (role === "candidate" && data.candidate_id) {
        localStorage.setItem("candidate_id", data.candidate_id);
        setMessage(`Registration successful!`);
        if (onLogin) onLogin(data.candidate_id, "candidate");
      } else if (role === "interviewer" && data.interviewer_id) {
        localStorage.setItem("interviewer_id", data.interviewer_id);
        setMessage(`Registration successful!`);
        if (onLogin) onLogin(data.interviewer_id, "interviewer");
      } else {
        setMessage(data.error || "Registration failed");
      }
    } catch (err) {
      setMessage("Server error");
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <h2>{showRegister ? "Register" : "Login"}</h2>
      <div className="role-radio-row">
        <label className="role-radio-label">
          <input
            type="radio"
            name="role"
            value="candidate"
            checked={role === "candidate"}
            onChange={() => setRole("candidate")}
          />
          Candidate
        </label>
        <label className="role-radio-label">
          <input
            type="radio"
            name="role"
            value="interviewer"
            checked={role === "interviewer"}
            onChange={() => setRole("interviewer")}
          />
          Interviewer
        </label>
      </div>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {showRegister && (
        <>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </>
      )}
      <div className="auth-actions">
        {showRegister ? (
          <>
            <button onClick={handleRegister}>Register</button>
            <button onClick={() => setShowRegister(false)}>Go to Login</button>
          </>
        ) : (
          <>
            <button onClick={handleLogin}>Login</button>
            <button onClick={() => setShowRegister(true)}>Go to Register</button>
          </>
        )}
      </div>
      <div className="error-message">{message}</div>
    </div>
  );
}
