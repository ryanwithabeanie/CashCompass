import React, { useEffect, useState } from "react";

function FriendRequestsCard({ user }) {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  // Fetch requests
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/friends/requests", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSent(data.sent || []);
        setReceived(data.received || []);
      });
  }, [msg]);

  // Send friend request
  const sendRequest = async () => {
    setMsg("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/friends/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      setMsg("Request sent!");
      setEmail("");
    } else {
      setMsg(data.error || "Failed to send request");
    }
  };

  // Accept friend request
  const acceptRequest = async (id) => {
    setMsg("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requestId: id })
    });
    const data = await res.json();
    if (data.success) setMsg("Friend added!");
    else setMsg(data.error || "Failed to accept");
  };

  // Decline friend request
  const declineRequest = async (id) => {
    setMsg("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/friends/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requestId: id })
    });
    const data = await res.json();
    if (data.success) setMsg("Request declined");
    else setMsg(data.error || "Failed to decline");
  };

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      backdropFilter: "blur(12px)",
      padding: "1.5rem",
      maxWidth: 400,
      width: "100%", // Make the card fill its container
      boxSizing: "border-box"
    }}>
      <h2 style={{
        color: "#222",
        fontSize: "1.25rem",
        fontWeight: "bold",
        marginBottom: "1rem"
      }}>
        Friend Requests
      </h2>
      <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          type="email"
          placeholder="Send request to email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "0.5rem", 
            borderRadius: "8px", 
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            color: '#222',
            outline: 'none'
          }}
        />
        <button
          onClick={sendRequest}
          style={{
            background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
            color: "#fff",
            border: "none",
            padding: "0.4rem 0.7rem",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "1rem",
            width: "100%",
            marginTop: "0.5rem",
            height: "40px"
          }}
        >
          Send
        </button>
      </div>
      {msg && <div style={{ color: msg.includes("!") ? "#1e8449" : "red", marginBottom: "1rem" }}>{msg}</div>}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Sent Requests:</strong>
        <ul style={{ margin: 0, listStyle: "none", padding: 0 }}>
          {sent.map(r => (
            <li key={r._id} style={{ marginBottom: "0.5rem" }}>
              {r.to.username || r.to.email} ({r.status})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Received Requests:</strong>
        <ul style={{ margin: 0, listStyle: "none", padding: 0 }}>
          {received.map(r => (
            <li key={r._id} style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ flex: 1 }}>{r.from.username || r.from.email}</span>
              <button
                onClick={() => acceptRequest(r._id)}
                style={{
                  background: "#2ecc71",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.3rem 0.7rem",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  height: "32px",
                  minWidth: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                Accept
              </button>
              <button
                onClick={() => declineRequest(r._id)}
                style={{
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.3rem 0.7rem",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  height: "32px",
                  minWidth: "70px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                Decline
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FriendRequestsCard;