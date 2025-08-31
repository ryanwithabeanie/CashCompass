import React, { useEffect, useState } from 'react';
import AddEntryForm from './AddEntryForm';
import { fetchEntries } from './services/entryService';
import bgImage from './assets/bg.jpg';
import { fetchSummary } from './services/summaryService';
import CalendarCard from './CalendarCard';
import { validateToken, clearAuth } from './services/authService';
import { marked } from 'marked';
import Login from "./Login";
import { Pie, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import FriendRequestsCard from './FriendRequestsCard';
import ChatCard from './ChatCard';
import BudgetCard from './BudgetCard';
import WeeklyPlannerCard from './WeeklyPlannerCard';

Chart.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function App() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [editForm, setEditForm] = useState({
    type: '',
    category: '',
    amount: '',
    note: '',
    date: ''
  });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // -------------------- Effects (always at top level) --------------------
  // Initialize auth state from localStorage and validate token
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          clearAuth(); // Use the imported clearAuth
          setUser(null);
          return;
        }

        const isValid = await validateToken(); // Use the imported validateToken
        if (!isValid) {
          clearAuth();
          setUser(null);
          // Clear all cached data
          setSummary(null);
          localStorage.removeItem("lastSummary");
          localStorage.removeItem("lastSummaryUserId");
          localStorage.removeItem("lastSummaryTime");
        } else {
          // Get user info from the token
          const token = localStorage.getItem("token");
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const decoded = JSON.parse(jsonPayload);
          
          setUser(decoded);
          // Clear any previous summary data
          setSummary(null);
          localStorage.removeItem("lastSummary");
          localStorage.removeItem("lastSummaryUserId");
          localStorage.removeItem("lastSummaryTime");
        }
      } catch (err) {
        console.error('Auth check error:', err);
        clearAuth();
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Reset expanded chat when user changes
  useEffect(() => {
    setExpandedChatId(null);
  }, [user]);

  // Load initial data and friends when user is validated
  useEffect(() => {
    // Clear all data when user is null
    if (!user) {
      setFriends([]);
      setEntries([]);
      setSummary(null);
      setFilter('all');
      setEntriesLoading(false);
      setEntriesError('');
      setSummaryLoading(false);
      setSummaryError('');
      return;
    }

    // Debug logging
    console.log('Current User:', user);

    // Load data only once when user is first set
    const loadInitialData = async () => {
      const token = localStorage.getItem("token");
      
      // Load entries first
      try {
        console.log('Fetching entries for user:', user.id);
        const entriesData = await fetchEntries();
        console.log('Received entries:', entriesData);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
      } catch (err) {
        console.error('Error fetching entries:', err);
        setEntriesError('Failed to load entries.');
      }

      // Load friends
      try {
        const res = await fetch("http://localhost:5000/api/chat/friends", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFriends(data.friends || []);
      } catch {
        setFriends([]);
      }

      // Try to load cached summary for this user
      const cachedSummary = localStorage.getItem("lastSummary");
      const cachedUserId = localStorage.getItem("lastSummaryUserId");
      const currentUserId = localStorage.getItem("user");
      
      // Only load cached summary if it belongs to the current user
      if (cachedSummary && cachedUserId === currentUserId) {
        try {
          setSummary(JSON.parse(cachedSummary));
        } catch (e) {
          console.error("Failed to parse cached summary");
          localStorage.removeItem("lastSummary");
          localStorage.removeItem("lastSummaryUserId");
        }
      } else {
        // Clear summary if it belongs to a different user
        setSummary(null);
        localStorage.removeItem("lastSummary");
        localStorage.removeItem("lastSummaryUserId");
      }
    };

    loadInitialData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------- Functions --------------------
  const generateNewSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryLoading(true);
    setSummaryError('');
    
    try {
      const summaryData = await fetchSummary();
      if (summaryData) {
        // Check if the API returned an error about daily limit
        if (summaryData.error && summaryData.error.toLowerCase().includes('daily limit')) {
          setSummaryError('OpenRouter API daily limit reached. Please try again tomorrow.');
          setSummary(null);
          return;
        }
        
        setSummary(summaryData);
        
        // Save summary with user ID
        if (user?.id) {
          localStorage.setItem("lastSummary", JSON.stringify(summaryData));
          localStorage.setItem("lastSummaryUserId", user.id);
          localStorage.setItem("lastSummaryTime", Date.now().toString());
        }
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
      setSummaryError(err.message === 'Summary request timed out' 
        ? 'Request timed out. Please try again.'
        : 'Failed to generate summary. Backend might be disconnected.');
    } finally {
      setSummaryLoading(false);
      setIsGeneratingSummary(false);
    }
  };

  const reloadData = async (forceSummary = false) => {
    setEntriesLoading(true);
    setEntriesError('');
    
    const hasToken = !!localStorage.getItem("token");
    if (!hasToken) {
      setSummary(null);
      return;
    }

    // Always reload entries
    try {
      const entriesData = await fetchEntries();
      setEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (err) {
      setEntriesError('Failed to load entries.');
    } finally {
      setEntriesLoading(false);
    }

    // If forcing summary update, use generateNewSummary
    if (forceSummary) {
      await generateNewSummary();
    }
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setEditForm({ type: '', category: '', amount: '', note: '', date: '' });
  };

  const startEditing = (entry) => {
    setEditingEntry(entry._id);
    setEditForm({ ...entry, date: entry.date?.split('T')[0] || '' }); // Trim timestamp
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/entries/${id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      if (res.ok) {
        // Only reload entries
        await reloadData(false);
      } else {
        console.error("Failed to delete");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/entries/${editingEntry}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        cancelEditing();
        // Only reload entries
        reloadData(false);
      } else {
        console.error("Failed to update entry");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  // -------------------- Derived/UI data --------------------
  const pieData = summary?.currentWeek ? {
    labels: ['Income', 'Expense', 'Savings'],
    datasets: [{
      data: [
        summary.currentWeek.income,
        summary.currentWeek.expense,
        summary.currentWeek.savings
      ],
      backgroundColor: ['#3498db', '#e74c3c', '#2ecc71']
    }]
  } : null;

  const lineData = (summary?.currentWeek && summary?.previousWeek) ? {
    labels: ['Last Week', 'This Week'],
    datasets: [
      {
        label: 'Income',
        data: [summary.previousWeek.income, summary.currentWeek.income],
        borderColor: '#3498db',
        fill: false
      },
      {
        label: 'Expense',
        data: [summary.previousWeek.expense, summary.currentWeek.expense],
        borderColor: '#e74c3c',
        fill: false
      },
      {
        label: 'Savings',
        data: [summary.previousWeek.savings, summary.currentWeek.savings],
        borderColor: '#2ecc71',
        fill: false
      }
    ]
  } : null;

  // -------------------- Early return for login (AFTER hooks) --------------------
  if (authChecking) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      Checking authentication...
    </div>;
  }

  if (!user) {
    return <Login onLoggedIn={async (userData) => {
      console.log('New user logging in:', userData);
      // Clear any existing data first
      setEntries([]);
      setFriends([]);
      setSummary(null);
      // Set the new user, which will trigger the useEffect to load their data
      setUser(userData);
      // Force a new fetch of entries
      try {
        const entriesData = await fetchEntries();
        console.log('Initial entries load:', entriesData);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
      } catch (err) {
        console.error('Error loading initial entries:', err);
      }
    }} />;
  }

  // -------------------- JSX --------------------
  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
      {/* App Header */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo and Title Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <img 
            src={require('./assets/2.png')} 
            alt="CashCompass Logo" 
            style={{
              height: '60px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem'
          }}>
            <h1 style={{
              margin: 0,
              color: '#ffffff',
              fontSize: '2.5rem',
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontWeight: '600',
              letterSpacing: '1px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              CashCompass
            </h1>
            <span style={{
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: '400',
              opacity: '0.9',
              fontStyle: 'italic',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              Your ultimate finance tracker
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => { 
            clearAuth(); 
            setUser(null);
            setEntries([]);
            setFriends([]);
            setSummary(null);
          }}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            color: "#fff",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            padding: "0.7rem 1.5rem",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s",
            backdropFilter: "blur(5px)",
            textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
            hover: {
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              borderColor: "rgba(255, 255, 255, 0.4)"
            }
          }}
        >
          Logout
        </button>
      </div>

      {/* Summary Section with Generate Button */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1rem',
        marginBottom: '2rem',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Weekly Summary</h2>
          <button
            onClick={generateNewSummary}
            disabled={summaryLoading || isGeneratingSummary}
            style={{
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              padding: "0.7rem 1.5rem",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: summaryLoading || isGeneratingSummary ? "not-allowed" : "pointer",
              opacity: summaryLoading || isGeneratingSummary ? 0.7 : 1,
              transition: "all 0.2s"
            }}
          >
            {summaryLoading ? "Generating..." : summary ? "Generate Another Summary" : "Generate Summary"}
          </button>
        </div>

        {summaryLoading && (
          <div style={{
            padding: '1rem',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            Generating Summary...
          </div>
        )}
        
        {summaryError && (
          <div style={{
            backgroundColor: '#fff3f3',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #ffcccc',
            color: '#cc0000',
            fontStyle: 'italic',
            marginBottom: '1rem'
          }}>
            {summaryError}
          </div>
        )}
        
        {summary && !summaryLoading && (
          <div style={{
            backgroundColor: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h3>This Week</h3>
                <p><strong>Income:</strong> ${summary.currentWeek?.income ?? 0}</p>
                <p><strong>Expense:</strong> ${summary.currentWeek?.expense ?? 0}</p>
                <p><strong>Savings:</strong> ${summary.currentWeek?.savings ?? 0}</p>
              </div>
              <div style={{ flex: 1 }}>
                <h3>Last Week</h3>
                <p><strong>Income:</strong> ${summary.previousWeek?.income ?? 0}</p>
                <p><strong>Expense:</strong> ${summary.previousWeek?.expense ?? 0}</p>
                <p><strong>Savings:</strong> ${summary.previousWeek?.savings ?? 0}</p>
              </div>
            </div>
            {/* AI Insight */}
            {summary.aiComment && (
              <div
                style={{
                  marginTop: '1.5rem',
                  backgroundColor: '#f6f8fa',
                  padding: '1rem',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  color: '#333',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                }}
                dangerouslySetInnerHTML={{
                  __html: marked(summary.aiComment),
                }}
              />
            )}
          </div>
        )}
      </div>

      {summary && !summaryLoading && (
        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {/* Pie Chart */}
          <div style={{
            flex: '1 1 320px',
            minWidth: 320,
            maxWidth: 400,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ color: '#3498db', marginBottom: '1rem' }}>Pie Chart</h3>
            <div style={{ width: 300, height: 300 }}>
              <Pie
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>
          {/* Line Chart */}
          <div style={{
            flex: '1 1 420px',
            minWidth: 320,
            maxWidth: 500,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ color: '#3498db', marginBottom: '1rem' }}>Linear Graph</h3>
            <div style={{ width: 400, height: 300 }}>
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                  },
                  scales: {
                    x: { title: { display: true, text: 'Week' } },
                    y: { title: { display: true, text: 'Amount ($)' }, beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Budget Card */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <BudgetCard user={user} />
      </div>

      {/* Weekly Planner Card */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <WeeklyPlannerCard />
      </div>

      {/* Calendar Card */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <CalendarCard entries={entries} />
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 260px', minWidth: 260, maxWidth: 300 }}>
          {/* Add Entry */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            marginBottom: '1rem'
          }}>
            <AddEntryForm onEntryAdded={() => reloadData(false)} />
          </div>
          {/* Friend Requests */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <FriendRequestsCard user={user} />
          </div>
        </div>

        {/* Entries List */}
        <div style={{
          flex: '2 1 500px',
          padding: '1.5rem',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Entries</h2>

          {entriesLoading && <p style={{ fontStyle: 'italic' }}>Loading entries...</p>}
          {entriesError && <p style={{ color: 'red' }}>{entriesError}</p>}

          <label>
            Filter Entries:
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginLeft: '0.9rem' }}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <input
            type="text"
            placeholder="🔍︎ Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {entries
              .slice() // Create a copy to avoid mutating original array
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
              .filter(entry =>
                (filter === 'all' || entry.type === filter) &&
                (
                  (entry.category || '').toLowerCase().includes(search.toLowerCase()) ||
                  (entry.note || '').toLowerCase().includes(search.toLowerCase())
                )
              )
              .map((entry) => (
                <li
                  key={entry._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  {editingEntry === entry._id ? (
                    <form onSubmit={handleEditSubmit} style={{ flex: 1 }}>
                      <input
                        type="text"
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        required
                      />
                      <input
                        type="number"
                        name="amount"
                        value={editForm.amount}
                        onChange={handleEditChange}
                        required
                      />
                      <input
                        type="text"
                        name="note"
                        value={editForm.note}
                        onChange={handleEditChange}
                      />
                      <input
                        type="date"
                        name="date"
                        value={editForm.date}
                        onChange={handleEditChange}
                        required
                      />
                      <select
                        name="type"
                        value={editForm.type}
                        onChange={handleEditChange}
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                      <button type="submit" style={{ marginLeft: '0.5rem' }}>
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{entry.category}</strong>: ${entry.amount} ({entry.type})
                        <br />
                        <small>{entry.note}</small>
                      </div>
                      <div>
                        <button
                          onClick={() => startEditing(entry)}
                          style={{
                            marginRight: '0.5rem',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '5px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEntry(entry._id)}
                          style={{
                            backgroundColor: '#ff3b3b',
                            color: '#fff',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '5px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Chat Section */}
      {friends.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
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
        </div>
      )}
    </div>
  );
}

export default App;
