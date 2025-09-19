import React, { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleAuth(action) {
    const url = action === "login"
      ? "http://127.0.0.1:8000/login"
      : "http://127.0.0.1:8000/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.candidate_id) {
        localStorage.setItem("candidate_id", data.candidate_id);
        setMessage(`${action} successful!`);
        if (onLogin) onLogin(data.candidate_id); // notify parent
      } else {
        setMessage(data.error || "Something went wrong");
      }
    } catch (err) {
      setMessage("Server error");
      console.error(err);
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "auto", textAlign: "center", marginTop: "50px" }}>
      <h2>Candidate Login/Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px", width: "100%" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "8px", width: "100%" }}
      />
      <button onClick={() => handleAuth("login")} style={{ margin: "5px", padding: "10px 20px" }}>
        Login
      </button>
      <button onClick={() => handleAuth("register")} style={{ margin: "5px", padding: "10px 20px" }}>
        Register
      </button>
      <p>{message}</p>
    </div>
  );
}
