import React, { useState } from 'react';

function AddEntryForm({ onEntryAdded }) {  // 🔹 allow parent to refresh list
  const [entry, setEntry] = useState({
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split("T")[0], // ✅ default to today
    isRecurring: false,
    recurringPeriod: 'monthly'
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    let { name, value } = e.target;

    // ✅ convert amount to number
    if (name === "amount") {
      value = Number(value);
    }

    setEntry({ ...entry, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting...');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Error: No token found. Please log in again.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/entries/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (res.ok) {
        setMessage("Entry added successfully!");
        setEntry({
          type: "expense",
          category: "",
          amount: "",
          note: "",
          date: new Date().toISOString().split("T")[0], // reset to today
          isRecurring: false,
          recurringPeriod: 'monthly'
        });

        if (onEntryAdded) onEntryAdded(); // 🔹 refresh entries in parent
      } else {
        const err = await res.json();
        setMessage("Error: " + (err.error || "Failed to add entry"));
      }
    } catch (err) {
      setMessage("Failed to connect to server");
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Add Entry</h2>
      <form 
        onSubmit={handleSubmit} 
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {/* Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Type:</label>
          <select 
            name="type" 
            value={entry.type} 
            onChange={handleChange} 
            style={{ flex: 1 }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Category:</label>
          <input 
            type="text" 
            name="category" 
            value={entry.category} 
            onChange={handleChange} 
            required 
            style={{ flex: 1 }} 
          />
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Amount:</label>
          <input 
            type="number" 
            name="amount" 
            value={entry.amount} 
            onChange={handleChange} 
            required 
            style={{ flex: 1 }} 
          />
        </div>

        {/* Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Note:</label>
          <input 
            type="text" 
            name="note" 
            value={entry.note} 
            onChange={handleChange} 
            style={{ flex: 1 }} 
          />
        </div>

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ width: '80px' }}>Date:</label>
          <input 
            type="date" 
            name="date" 
            value={entry.date} 
            onChange={handleChange} 
            required 
            style={{ flex: 1 }} 
          />
        </div>

        {/* Recurring Options (only show for expenses) */}
        {entry.type === 'expense' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ width: '80px' }}>Recurring:</label>
              <input
                type="checkbox"
                name="isRecurring"
                checked={entry.isRecurring}
                onChange={(e) => setEntry({ ...entry, isRecurring: e.target.checked })}
                style={{ margin: '0' }}
              />
            </div>

            {entry.isRecurring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ width: '80px' }}>Period:</label>
                <select
                  name="recurringPeriod"
                  value={entry.recurringPeriod}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button 
          type="submit" 
          style={{
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
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
