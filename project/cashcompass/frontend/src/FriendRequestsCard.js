import React, { useEffect, useState } from "react";
import { getCompactButtonStyle, getCompactButtonHoverHandlers, buttonColors } from './utils/buttonStyles';

function FriendRequestsCard({ user, refreshFriends }) {
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
    if (data.success) {
      setMsg("Friend added!");
      // Refresh the friends list in the parent component
      if (refreshFriends) {
        refreshFriends();
      }
    } else {
      setMsg(data.error || "Failed to accept");
    }
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
      background: "transparent",
      border: "none",
      borderRadius: "0",
      boxShadow: "none",
      backdropFilter: "none",
      padding: "0",
      maxWidth: "none",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <h2 style={{
        color: "#222",
        fontSize: "1.5rem",
        fontWeight: "600",
        marginBottom: "1rem",
        textAlign: "left",
        userSelect: "none"
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
            padding: "0.4rem 0.5rem", 
            borderRadius: "8px", 
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            color: '#222',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={sendRequest}
          style={{
            ...getCompactButtonStyle(buttonColors.primary),
            width: "100%",
            marginTop: "0.5rem",
            padding: "0.75rem 1.5rem",
            boxSizing: 'border-box'
          }}
          {...getCompactButtonHoverHandlers('rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 1)')}
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
                  ...getCompactButtonStyle(buttonColors.success),
                  minWidth: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                {...getCompactButtonHoverHandlers('rgba(46, 204, 113, 0.8)', 'rgba(46, 204, 113, 1)')}
              >
                Accept
              </button>
              <button
                onClick={() => declineRequest(r._id)}
                style={{
                  ...getCompactButtonStyle(buttonColors.danger),
                  minWidth: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                {...getCompactButtonHoverHandlers('rgba(231, 76, 60, 0.8)', 'rgba(231, 76, 60, 1)')}
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