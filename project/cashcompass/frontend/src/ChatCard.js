import React, { useEffect, useRef, useState } from "react";

export default function ChatCard({ user, friend, isExpanded, onToggleExpand }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Normalize id: string, object {_id}, number
  const getId = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") return val._id || val.id || null;
    return String(val);
  };

  const currentUserId = getId(user?._id || user?.id || user);
  const friendId = getId(friend?._id || friend?.id || friend);

  // Clear messages when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setMessages([]);
    }
  }, [isExpanded]);

  // Fetch chat history
  useEffect(() => {
    if (!friend || !isExpanded) return;
    const abort = new AbortController();
    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/chat/history/${friendId}`, {
      signal: abort.signal,
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        const msgs = Array.isArray(data) ? data : data.messages || [];
        setMessages(msgs);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error(err);
        setError("Failed to load chat history.");
      })
      .finally(() => setLoading(false));

    return () => abort.abort();
  }, [friendId, isExpanded, friend]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!text.trim() || !friend) return;

    const token = localStorage.getItem("token");
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimisticMsg = {
      _id: tempId,
      message: text,
      from: currentUserId,
      to: friendId,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to: friendId, message: optimisticMsg.message }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const serverMsg = data.chat || data.message;
      if (serverMsg) {
        setMessages((prev) => prev.map((m) => (m._id === tempId ? serverMsg : m)));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Try again.");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Decide if message is sent or received
  const isSentByMe = (msg) => {
    const fromId = getId(msg.from || msg.sender);
    const toId = getId(msg.to || msg.receiver);
    if (fromId === currentUserId) return true;
    if (toId === friendId) return true;
    return false; // else it's received
  };

  const formatTime = (msg) => {
    const t = msg.timestamp || msg.createdAt || Date.now();
    try {
      return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
      style={{
        background: "transparent",
        maxWidth: 400,
        width: "100%",
        marginBottom: "2rem",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 16,
        height: isExpanded ? 420 : 'auto',
        transition: "height 0.3s ease"
      }}>
      {/* Header */}
      <div 
        onClick={(e) => {
          e.stopPropagation();  // Prevent event bubbling
          onToggleExpand(!isExpanded);
        }}
        style={{
          background: "linear-gradient(90deg, #3498db 0%, #6dd5fa 100%)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: isExpanded ? 0 : 16,
          borderBottomRightRadius: isExpanded ? 0 : 16,
          padding: "1rem",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "1.15rem",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#fff",
          color: "#3498db",
          fontWeight: "bold",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "0.8rem",
          border: "2px solid #6dd5fa"
        }}>
          {friend ? ((friend.username || friend.email || "?")[0]).toUpperCase() : "?"}
        </div>
        <div style={{ flex: 1 }}>
          {friend ? `Chat with ${friend.username || friend.email}` : "Select a friend to chat"}
        </div>
        <button 
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "1.5rem",
            cursor: "pointer",
            padding: "0 0.5rem",
            transition: "transform 0.3s ease"
          }}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 12px rgba(0,0,0,0.07)"
          }}>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div style={{ color: "#c00" }}>{error}</div>
            ) : messages.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No messages yet. Say hello 👋</div>
            ) : messages.map((msg, idx) => {
              const isMe = isSentByMe(msg);
              const key = msg._id || `msg-${idx}`;
              return (
                <div key={key} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{
                    background: isMe ? "linear-gradient(90deg, #3498db 0%, #6dd5fa 100%)" : "#fff",
                    color: isMe ? "#fff" : "#000",
                    borderRadius: 18,
                    padding: "0.6rem 1rem",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                    fontSize: "1rem",
                    boxShadow: isMe ? "0 2px 8px rgba(52,152,219,0.10)" : "none",
                    marginLeft: isMe ? "auto" : 0,
                    marginRight: isMe ? 0 : "auto",
                    border: "none"
                  }}>
                    {msg.message}
                    <div style={{ fontSize: "0.75rem", color: isMe ? "#e3f2fd" : "#555", marginTop: "0.3rem", textAlign: "right" }}>
                      {formatTime(msg)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ 
            padding: "1rem", 
            borderTop: "1px solid #eee", 
            background: "#fff",
            borderBottomLeftRadius: 16, 
            borderBottomRightRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.07)"
          }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{ flex: 1, padding: "0.7rem 1rem", borderRadius: 18, border: "1px solid #ccc", fontSize: "1rem", outline: "none", resize: "none" }}
                disabled={!friend}
                placeholder="Type your message..."
              />
              <button onClick={sendMessage} disabled={!friend || !text.trim()} style={{
                background: "linear-gradient(90deg, #3498db 0%, #6dd5fa 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 18,
                fontWeight: "bold",
                fontSize: "1rem",
                padding: "0 1.2rem",
                cursor: (!friend || !text.trim()) ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(52,152,219,0.10)"
              }}>Send</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
