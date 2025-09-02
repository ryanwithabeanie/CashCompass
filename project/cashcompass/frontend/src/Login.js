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
          userSelect: "none"
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.5rem', userSelect: 'none' }}>
          <img src={logo} alt="CashCompass Logo" style={{ 
            width: '120px', 
            height: '120px', 
            marginBottom: '0.5rem',
            userSelect: 'none',
            pointerEvents: 'none'
          }} />
        </div>
        <h2 style={{ marginBottom: "1rem", color: "#3498db", textAlign: 'center', userSelect: 'none' }}>
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <form onSubmit={submit} style={{ userSelect: "none" }}>
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
                color: "#222",
                userSelect: "text",
                boxSizing: "border-box"
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
              color: "#222",
              userSelect: "text",
              boxSizing: "border-box"
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
              color: "#222",
              userSelect: "text",
              boxSizing: "border-box"
            }}
            required
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: '0.85rem 1.8rem',
              background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
              color: "#fff",
              border: "2px solid rgba(52, 152, 219, 0.8)",
              borderRadius: '12px',
              fontWeight: "bold",
              fontSize: "1rem",
              boxShadow: '0 0 15px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)',
              cursor: "pointer",
              userSelect: "none",
              boxSizing: "border-box",
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: 'scale(1) translateY(0px)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(12px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.6), 0 12px 20px rgba(0,0,0,0.4)';
              e.target.style.transform = 'scale(1.05) translateY(-3px)';
              e.target.style.borderColor = 'rgba(52, 152, 219, 1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)';
              e.target.style.transform = 'scale(1) translateY(0px)';
              e.target.style.borderColor = 'rgba(52, 152, 219, 0.8)';
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
              userSelect: 'none'
            }}
          >
            {msg}
          </p>
        )}

        <p style={{ marginTop: 12, userSelect: 'none' }}>
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
            style={{
              background: 'rgba(52, 152, 219, 0.1)',
              border: '2px solid rgba(52, 152, 219, 0.8)',
              borderRadius: '8px',
              color: "#3498db",
              cursor: "pointer",
              padding: '0.5rem 1rem',
              fontWeight: "bold",
              fontSize: '0.9rem',
              boxShadow: '0 0 10px rgba(52, 152, 219, 0.3), 0 4px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: 'scale(1) translateY(0px)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 0 12px rgba(52, 152, 219, 0.4), 0 6px 12px rgba(0,0,0,0.25)';
              e.target.style.transform = 'scale(1.05) translateY(-2px)';
              e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.15)';
              e.target.style.borderColor = 'rgba(52, 152, 219, 1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.3), 0 4px 8px rgba(0,0,0,0.2)';
              e.target.style.transform = 'scale(1) translateY(0px)';
              e.target.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
              e.target.style.borderColor = 'rgba(52, 152, 219, 0.8)';
            }}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
