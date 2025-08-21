import React, { useState } from 'react';

function AddEntryForm() {
  const [entry, setEntry] = useState({
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    date: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting...');

    try {
      const token = localStorage.getItem("token");  // 🔑 get saved token
      if (!token) {
        setMessage("Error: No token found. Please log in again.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/entries/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // ✅ attach token
        },
        body: JSON.stringify(entry),
      });

      if (res.ok) {
        setMessage("Entry added successfully!");
        setEntry({ type: "expense", category: "", amount: "", note: "", date: "" });
      } else {
        const err = await res.json();
        setMessage("Error: " + err.error);
      }
    } catch (err) {
      setMessage("Failed to connect to server");
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Add Entry</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Input Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Type:</label>
          <select name="type" value={entry.type} onChange={handleChange} style={{ flex: 1 }}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Category:</label>
          <input type="text" name="category" value={entry.category} onChange={handleChange} required style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Amount:</label>
          <input type="number" name="amount" value={entry.amount} onChange={handleChange} required style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Note:</label>
          <input type="text" name="note" value={entry.note} onChange={handleChange} style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Date:</label>
          <input type="date" name="date" value={entry.date} onChange={handleChange} required style={{ flex: 1 }} />
        </div>

        <button type="submit" style={{
          padding: '0.75rem',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          Add Entry
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: '1rem',
          color: message.includes('Error') ? 'red' : 'green'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default AddEntryForm;
