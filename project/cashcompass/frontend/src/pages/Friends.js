import React from 'react';
import FriendRequestsCard from '../FriendRequestsCard';
import ChatCard from '../ChatCard';

function Friends({ user, friends, expandedChatId, setExpandedChatId }) {
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
          <FriendRequestsCard user={user} />
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
            fontSize: '1.2rem',
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
                      backgroundColor: expandedChatId === friend._id ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                      border: expandedChatId === friend._id ? '2px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                      fontSize: '1rem',
                      userSelect: 'none'
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
