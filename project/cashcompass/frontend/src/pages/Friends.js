import React from 'react';
import FriendRequestsCard from '../FriendRequestsCard';
import ChatCard from '../ChatCard';

function Friends({ user, friends, expandedChatId, setExpandedChatId, refreshFriends }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Friend Requests Section */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        {/* Friend Requests Card */}
        <div style={{
          flex: '1 1 300px',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)'
        }}>
          <FriendRequestsCard user={user} refreshFriends={refreshFriends} />
        </div>

        {/* Your Friends Card */}
        <div style={{
          flex: '1 1 300px',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)',
          userSelect: 'none'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            color: '#222',
            fontSize: '1.5rem',
            fontWeight: '600',
            textAlign: 'left',
            userSelect: 'none'
          }}>
            Your Friends
          </h3>
          
          {friends.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {friends.map(friend => (
                <div 
                  key={friend._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <span 
                    onClick={() => setExpandedChatId(expandedChatId === friend._id ? null : friend._id)}
                    style={{ 
                      color: '#222',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      userSelect: 'none',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    {friend.username || friend.email || 'Friend'}
                  </span>
                  <button
                    onClick={() => setExpandedChatId(expandedChatId === friend._id ? null : friend._id)}
                    style={{
                      padding: '0.5rem',
                      background: expandedChatId === friend._id 
                        ? 'linear-gradient(90deg, rgba(52, 152, 219, 0.4) 0%, rgba(30, 144, 255, 0.4) 100%)' 
                        : 'linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(240, 240, 240, 0.3) 100%)',
                      border: expandedChatId === friend._id 
                        ? '2px solid rgba(52, 152, 219, 0.8)' 
                        : '2px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                      fontSize: '1rem',
                      userSelect: 'none',
                      boxShadow: expandedChatId === friend._id 
                        ? '0 0 10px rgba(52, 152, 219, 0.3), 0 4px 8px rgba(0,0,0,0.2)'
                        : '0 0 10px rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: 'scale(1) translateY(0px)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.boxShadow = expandedChatId === friend._id 
                        ? '0 0 12px rgba(52, 152, 219, 0.5), 0 6px 12px rgba(0,0,0,0.3)'
                        : '0 0 12px rgba(255, 255, 255, 0.4), 0 6px 12px rgba(0,0,0,0.2)';
                      e.target.style.transform = 'scale(1.05) translateY(-2px)';
                      e.target.style.borderColor = expandedChatId === friend._id 
                        ? 'rgba(52, 152, 219, 1)'
                        : 'rgba(255, 255, 255, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.boxShadow = expandedChatId === friend._id 
                        ? '0 0 10px rgba(52, 152, 219, 0.3), 0 4px 8px rgba(0,0,0,0.2)'
                        : '0 0 10px rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0,0,0,0.1)';
                      e.target.style.transform = 'scale(1) translateY(0px)';
                      e.target.style.borderColor = expandedChatId === friend._id 
                        ? 'rgba(52, 152, 219, 0.8)'
                        : 'rgba(255, 255, 255, 0.5)';
                    }}
                    title={expandedChatId === friend._id ? "Close chat" : "Open chat"}
                  >
                    💬
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ 
              color: '#666',
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '2rem 0',
              userSelect: 'none'
            }}>
              No friends yet. Send friend requests to start building your network!
            </p>
          )}
        </div>
      </div>

      {/* Chat Section */}
      {friends.length > 0 && (
        <div style={{
          display: "flex", 
          gap: "2rem", 
          flexWrap: "wrap"
        }}>
          {friends.map(friend => (
            <ChatCard 
              key={friend._id} 
              user={user} 
              friend={friend}
              isExpanded={friend._id === expandedChatId}
              onToggleExpand={(expanded) => setExpandedChatId(expanded ? friend._id : null)}
            />
          ))}
        </div>
      )}

      {friends.length === 0 && (
        <div style={{
          padding: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)',
          textAlign: 'center',
          color: '#666'
        }}>
          <p>No friends yet. Send friend requests to start chatting!</p>
        </div>
      )}
    </div>
  );
}

export default Friends;
