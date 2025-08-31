import { useState } from "react";
import logo from './assets/1.png';
import bgImage from './assets/bg.jpg';

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    const API_BASE = "http://localhost:5000/api/auth"; // backend URL
    const url = mode === "login" ? `${API_BASE}/login` : `${API_BASE}/register`;

    const body =
      mode === "login"
        ? { email, password }
        : { username, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "Request failed");

      if (mode === "register") {
        setMsg("✅ Registered successfully! You can now log in.");
        setMode("login");
        setPassword("");
        return;
      }

      // ✅ login success: clear old data first
      localStorage.clear(); // Clear all stored data
      
      // Then save new token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMsg("");
      onLoggedIn(data.user); // inform parent
    } catch (err) {
      console.error("Auth error:", err);
      setMsg("⚠️ Server error, please try again.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          margin: "3rem auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <img src={logo} alt="CashCompass Logo" style={{ width: '120px', height: '120px', marginBottom: '0.5rem' }} />
        </div>
        <h2 style={{ marginBottom: "1rem", color: "#3498db", textAlign: 'center' }}>
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 10,
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
                color: "#222"
              }}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
              color: "#222"
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
              color: "#222"
            }}
            required
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(52,152,219,0.15)",
              cursor: "pointer",
            }}
          >
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        {msg && (
          <p
            style={{
              color: msg.startsWith("✅") ? "#1e8449" : "#b00",
              marginTop: 12,
            }}
          >
            {msg}
          </p>
        )}

        <p style={{ marginTop: 12 }}>
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
            style={{
              background: "none",
              border: "none",
              color: "#3498db",
              cursor: "pointer",
              padding: 0,
              fontWeight: "bold",
            }}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
