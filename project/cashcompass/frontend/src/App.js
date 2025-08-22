import React, { useEffect, useState } from 'react';
import AddEntryForm from './AddEntryForm';
import { fetchEntries } from './services/entryService';
import { fetchSummary } from './services/summaryService';
import { marked } from 'marked';
import Login from "./Login";
import { Pie, Line } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import FriendRequestsCard from './FriendRequestsCard';
import ChatCard from './ChatCard';

Chart.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function App() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    type: '',
    category: '',
    amount: '',
    note: '',
    date: ''
  });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState(""); // Add at top with other useState
  const [friends, setFriends] = useState([]);

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
        await reloadData();
      } else {
        console.error("Failed to delete");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const startEditing = (entry) => {
    setEditingEntry(entry._id);
    setEditForm({ ...entry, date: entry.date.split('T')[0] }); // Trim timestamp
  };

  const cancelEditing = () => {
    setEditingEntry(null);
    setEditForm({ type: '', category: '', amount: '', note: '', date: '' });
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
        await reloadData();
      } else {
        console.error("Failed to update entry");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const reloadData = async () => {
    setEntriesLoading(true);
    setSummaryLoading(true);
    setEntriesError('');
    setSummaryError('');
    try {
      const entriesData = await fetchEntries();
      setEntries(entriesData);
    } catch (err) {
      setEntriesError('Failed to load entries.');
    } finally {
      setEntriesLoading(false);
    }
    try {
      const summaryData = await fetchSummary();
      setSummary(summaryData);
    } catch (err) {
      setSummaryError('Failed to Generate Summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setEntriesLoading(true);
        setEntriesError('');
        const data = await fetchEntries();
        setEntries(data);
      } catch (err) {
        console.error("Entries error:", err);
        setEntriesError('Failed to load entries.');
      } finally {
        setEntriesLoading(false);
      }
    };
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError('');
        const data = await fetchSummary();  
        setSummary(data);
      } catch (err) {
        console.error("Summary error:", err);
        setSummaryError('Failed to Generate Summary. Please try again.');
      } finally {
        setSummaryLoading(false);
      }
    };

    loadEntries();
    loadSummary();
  }, []);
const [user, setUser] = useState(null);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) setUser({}); // optionally fetch /me later
}, []);

useEffect(() => {
  if (!user) return;
  const token = localStorage.getItem("token");
  fetch("http://localhost:5000/api/chat/friends", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setFriends(data.friends || []));
}, [user]);



  console.log("Summary in frontend:", summary);

  if (!user) {
    return (
      <Login
        onLoggedIn={(userObj) => {
          setUser(userObj);
          reloadData(); // <-- refresh data after login
        }}
      />
    );
  }

  // Pie chart data
const pieData = summary ? {
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

// Line chart data (example: last 2 weeks)
const lineData = summary ? {
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

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f2f5',
        minHeight: '100vh'
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>💰 CashCompass 🧭</h1>

      {/* Summary Loading/Error/Content */}
      {summaryLoading ? (
        <div style={{
          backgroundColor: '#fff',
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontStyle: 'italic'
        }}>
          Generating Summary...
        </div>
      ) : summaryError ? (
        <div style={{
          backgroundColor: '#fff3f3',
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          border: '1px solid #ffcccc',
          color: '#cc0000',
          fontStyle: 'italic'
        }}>
          {summaryError}
        </div>
      ) : summary && (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '1rem',
            marginBottom: '2rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >

          <button
            onClick={() => { localStorage.removeItem("token"); setUser(null); }}
            style={{
              position: "absolute",
              right: 20,
              top: 20,
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              padding: "0.7rem 1.5rem",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              boxShadow: "0 2px 8px rgba(52,152,219,0.15)",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            Logout
          </button>

          <h2>Weekly Summary</h2>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
              <h3>This Week</h3>
              <p><strong>Income:</strong> ${summary.currentWeek.income}</p>
              <p><strong>Expense:</strong> ${summary.currentWeek.expense}</p>
              <p><strong>Savings:</strong> ${summary.currentWeek.savings}</p>
            </div>
            <div style={{ flex: 1 }}>
              <h3>Last Week</h3>
              <p><strong>Income:</strong> ${summary.previousWeek.income}</p>
              <p><strong>Expense:</strong> ${summary.previousWeek.expense}</p>
              <p><strong>Savings:</strong> ${summary.previousWeek.savings}</p>
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
                __html: marked.parse(summary.aiComment),
              }}
            />
          )}
          {/* REMOVE PIE AND LINE CHARTS FROM HERE */}
        </div>
      )}

      {summary && (
  <div style={{
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  }}>
    {/* Pie Chart Card */}
    <div style={{
      flex: '1 1 320px',
      minWidth: 320,
      maxWidth: 400,
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
    {/* Line Chart Card */}
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

      <div
        style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        {/* Left Column: Add Entry + Friend Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 260px', minWidth: 260, maxWidth: 300 }}>
          {/* Add Entry Card (smaller) */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              marginBottom: '1rem'
            }}
          >
            <AddEntryForm onEntryAdded={reloadData} />
          </div>
          {/* Friend Requests Card (styled like other cards) */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <FriendRequestsCard user={user} />
          </div>
        </div>

        {/* Entries Card */}
        <div
          style={{
            flex: '2 1 500px',
            padding: '1.5rem',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Entries</h2>

          {entriesLoading && <p style={{ fontStyle: 'italic' }}>Loading entries...</p>}
          {entriesError && <p style={{ color: 'red' }}>{entriesError}</p>}

          <label>
            Filter Entries:
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "6px",
              border: "1px solid #ccc"
            }}
          />

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {entries
              .filter(entry =>
                (filter === 'all' || entry.type === filter) &&
                (
                  entry.category.toLowerCase().includes(search.toLowerCase()) ||
                  entry.note.toLowerCase().includes(search.toLowerCase())
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
                    <>
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
                    </>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Chat Section - Conditionally Rendered */}
      {friends.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Friends</h2>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {friends.map(friend => (
              <ChatCard key={friend._id} user={user} friend={friend} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
