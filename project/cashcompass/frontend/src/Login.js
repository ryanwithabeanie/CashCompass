import { useState } from "react";

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { username, email, password };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Request failed");

    if (mode === "register") {
      setMsg("Registered. You can now log in.");
      setMode("login");
      return;
    }

    // login success
    localStorage.setItem("token", data.token);
    onLoggedIn(data.user);
  }

  return (
    <div style={{ maxWidth: 380, margin: "3rem auto", padding: "1.5rem", background: "#fff", border: "1px solid #ddd", borderRadius: 12 }}>
      <h2 style={{ marginBottom: "1rem" }}>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={submit}>
        {mode === "register" && (
          <input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          required
        />

        <button type="submit" style={{ width: "100%", padding: 12 }}>
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>

      {msg && <p style={{ color: "#b00", marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 12 }}>
        {mode === "login" ? "No account?" : "Already have an account?"}{" "}
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "#06c", cursor: "pointer", padding: 0 }}>
          {mode === "login" ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
}
