import { useState } from "react";

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

      // ✅ login success: save token + user in localStorage
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
        background: "linear-gradient(135deg, #3498db 0%, #6dd5fa 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          margin: "3rem auto",
          padding: "2rem",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(52,152,219,0.15)",
        }}
      >
        <h2 style={{ marginBottom: "1rem", color: "#3498db" }}>
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
                border: "1px solid #ccc",
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
              border: "1px solid #ccc",
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
              border: "1px solid #ccc",
            }}
            required
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              background: "#3498db",
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
              color: msg.startsWith("✅") ? "green" : "#b00",
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
