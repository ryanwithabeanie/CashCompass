import React, { useEffect, useState } from "react";

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
            background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
            color: "#fff",
            border: "2px solid rgba(52, 152, 219, 0.8)",
            padding: "0.75rem 1.5rem",
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "1rem",
            width: "100%",
            marginTop: "0.5rem",
            height: "auto",
            boxSizing: 'border-box',
            boxShadow: '0 0 15px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: 'scale(1) translateY(0px)',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer'
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
                  background: 'linear-gradient(90deg, rgba(46, 204, 113, 0.9) 0%, rgba(26, 188, 156, 0.9) 100%)',
                  color: "#fff",
                  border: "2px solid rgba(46, 204, 113, 0.8)",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  height: "auto",
                  minWidth: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(46, 204, 113, 0.3), 0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: 'scale(1) translateY(0px)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.5), 0 6px 12px rgba(0,0,0,0.3)';
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  e.target.style.borderColor = 'rgba(46, 204, 113, 1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.3), 0 4px 8px rgba(0,0,0,0.2)';
                  e.target.style.transform = 'scale(1) translateY(0px)';
                  e.target.style.borderColor = 'rgba(46, 204, 113, 0.8)';
                }}
              >
                Accept
              </button>
              <button
                onClick={() => declineRequest(r._id)}
                style={{
                  background: 'linear-gradient(90deg, rgba(231, 76, 60, 0.9) 0%, rgba(192, 57, 43, 0.9) 100%)',
                  color: "#fff",
                  border: "2px solid rgba(231, 76, 60, 0.8)",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  height: "auto",
                  minWidth: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(231, 76, 60, 0.3), 0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: 'scale(1) translateY(0px)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 0 12px rgba(231, 76, 60, 0.5), 0 6px 12px rgba(0,0,0,0.3)';
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  e.target.style.borderColor = 'rgba(231, 76, 60, 1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.3), 0 4px 8px rgba(0,0,0,0.2)';
                  e.target.style.transform = 'scale(1) translateY(0px)';
                  e.target.style.borderColor = 'rgba(231, 76, 60, 0.8)';
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