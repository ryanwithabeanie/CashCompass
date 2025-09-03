import React, { useEffect, useRef, useState } from "react";
import { getCompactButtonStyle, getCompactButtonHoverHandlers, buttonColors } from './utils/buttonStyles';

export default function ChatCard({ user, friend, isExpanded, onToggleExpand }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Helper function to get ID from user/friend object
  const getUserId = (userObj) => {
    if (!userObj) return null;
    if (typeof userObj === "string") return userObj;
    return userObj._id || userObj.id || null;
  };

  const currentUserId = getUserId(user);
  const friendId = getUserId(friend);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear messages when chat is collapsed
  useEffect(() => {
    if (!isExpanded) {
      setMessages([]);
      setError(null);
    }
  }, [isExpanded]);

  // Fetch chat history when expanded
  useEffect(() => {
    if (!isExpanded || !friend || !friendId) return;

    const loadChatHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/chat/history/${friendId}`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load chat history");
        }

        const data = await response.json();
        const chatMessages = Array.isArray(data) ? data : data.messages || [];
        setMessages(chatMessages);
      } catch (err) {
        console.error("Error loading chat:", err);
        setError("Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [isExpanded, friendId, friend]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !friend || !friendId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Add optimistic message
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      message: messageText,
      from: currentUserId,
      to: friendId,
      timestamp: new Date().toISOString(),
      isTemporary: true
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          to: friendId,
          message: messageText
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      const serverMessage = data.chat || data.message || data;

      // Replace temporary message with server response
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempMessage._id ? serverMessage : msg
        )
      );

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if message was sent by current user
  const isMessageFromMe = (message) => {
    const fromId = getUserId(message.from || message.sender);
    return fromId === currentUserId;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  // Get friend display name
  const getFriendDisplayName = () => {
    if (!friend) return "Unknown";
    return friend.username || friend.email || "Friend";
  };

  return (
    <div 
      style={{
        backgroundColor: 'transparent',
        background: 'none',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        maxWidth: '400px',
        width: '100%',
        marginBottom: '1.5rem',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        height: isExpanded ? '450px' : '72px',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Chat Header */}
      <div 
        onClick={() => onToggleExpand(!isExpanded)}
        style={{
          padding: '1rem',
          background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottomColor: isExpanded ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          userSelect: 'none',
          height: '72px',
          minHeight: '72px',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}
      >
        {/* Friend Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          fontWeight: '600',
          color: 'white'
        }}>
          {getFriendDisplayName().charAt(0).toUpperCase()}
        </div>

        {/* Friend Name */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: 'white',
            marginBottom: '0.25rem'
          }}>
            {getFriendDisplayName()}
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            color: 'rgba(255, 255, 255, 0.8)',
            opacity: 0.8
          }}>
            {isExpanded ? 'Click to close' : 'Click to open chat'}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <div style={{
          fontSize: '1.5rem',
          color: '#222',
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
        }}>
          +
        </div>
      </div>

      {/* Chat Content - Only show when expanded */}
      {isExpanded && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            backgroundColor: 'transparent',
            background: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                padding: '2rem'
              }}>
                Loading messages...
              </div>
            ) : error ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#e74c3c',
                padding: '2rem'
              }}>
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666',
                padding: '2rem'
              }}>
                No messages yet. Start the conversation! 👋
              </div>
            ) : (
              messages.map((message, index) => {
                const isFromMe = isMessageFromMe(message);
                return (
                  <div
                    key={message._id || index}
                    style={{
                      display: 'flex',
                      justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{
                      maxWidth: '75%',
                      padding: '0.75rem 1rem',
                      borderRadius: '18px',
                      backgroundColor: isFromMe 
                        ? 'rgba(52, 152, 219, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: isFromMe 
                        ? '1px solid rgba(52, 152, 219, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(8px)',
                      color: '#222',
                      fontSize: '0.95rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      opacity: message.isTemporary ? 0.7 : 1
                    }}>
                      <div>{message.message}</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        marginTop: '0.25rem',
                        textAlign: 'right'
                      }}>
                        {formatTimestamp(message.timestamp || message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={!friend}
                rows={1}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  color: '#222',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => {
                  // Simulate Enter key press
                  if (newMessage.trim() && friend) {
                    handleSendMessage();
                  }
                }}
                disabled={!friend || !newMessage.trim()}
                style={{
                  ...getCompactButtonStyle(buttonColors.primary),
                  padding: '0.75rem 1.25rem',
                  borderRadius: '20px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  border: (!friend || !newMessage.trim()) ? '2px solid rgba(52, 152, 219, 0.3)' : '2px solid rgba(52, 152, 219, 0.8)',
                  cursor: (!friend || !newMessage.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!friend || !newMessage.trim()) ? 0.5 : 1,
                  boxShadow: (!friend || !newMessage.trim()) ? 'none' : '0 0 10px rgba(52, 152, 219, 0.3), 0 4px 8px rgba(0,0,0,0.2)',
                  textShadow: (!friend || !newMessage.trim()) ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
                }}
                {...(friend && newMessage.trim() ? getCompactButtonHoverHandlers('rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 1)') : {})}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
