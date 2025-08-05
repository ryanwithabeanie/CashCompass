import React, { useEffect, useState } from 'react';
import AddEntryForm from './AddEntryForm';
import { fetchEntries } from './services/entryService';
import { fetchSummary } from './services/summaryService';
import { marked } from 'marked';

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

  const deleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/entries/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEntries(entries.filter(entry => entry._id !== id));
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
      const res = await fetch(`http://localhost:5000/api/entries/${editingEntry}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const updated = await res.json();
        setEntries(entries.map(entry => entry._id === updated._id ? updated : entry));
        cancelEditing();
      } else {
        console.error("Failed to update entry");
      }
    } catch (err) {
      console.error("Update error:", err);
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
        const data = await fetchSummary();  // this hits your DeepSeek backend
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

  console.log("Summary in frontend:", summary);

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
        {/* Add Entry Card */}
        <div
          style={{
            flex: '1 1 300px',
            padding: '1.5rem',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <AddEntryForm />
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

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {entries
              .filter((entry) => filter === 'all' || entry.type === filter)
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
    </div>
  );
}

export default App;
