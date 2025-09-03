import React, { useState } from 'react';
import { getBaseButtonStyle, getButtonHoverHandlers, buttonColors } from './utils/buttonStyles';

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
        const response = await res.json();
        const isRecurring = entry.isRecurring;
        const count = response.count || 1;
        
        if (isRecurring && count > 1) {
          setMessage(`${count} recurring entries added successfully!`);
        } else {
          setMessage("Entry added successfully!");
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
        
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
      <h2 style={{ marginBottom: '1rem', color: '#222', textAlign: 'left', fontSize: '1.5rem', fontWeight: '600', userSelect: 'none' }}>Add Entry</h2>
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
            style={{ 
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }}
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
            style={{ 
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }} 
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
            style={{ 
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }} 
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
            style={{ 
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }} 
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
            style={{ 
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }} 
          />
        </div>

        {/* Recurring Options */}
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
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ width: '80px' }}>Period:</label>
              <select
                name="recurringPeriod"
                value={entry.recurringPeriod}
                onChange={handleChange}
                style={{ 
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  color: '#222',
                  outline: 'none'
                }}
              >
                <option value="monthly">Monthly (rest of year)</option>
                <option value="yearly">Yearly (this year + next year)</option>
              </select>
            </div>
            
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              border: '1px solid rgba(52, 152, 219, 0.2)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#222'
            }}>
              <strong>Info:</strong> {entry.recurringPeriod === 'monthly' 
                ? `This will create entries for each remaining month of ${new Date().getFullYear()} starting from the selected date.`
                : `This will create an entry for the selected date this year and the same date next year.`
              }
            </div>
          </>
        )}

        {/* Submit */}
        <button 
          type="submit" 
          style={{
            ...getBaseButtonStyle(buttonColors.primary),
            padding: '0.85rem 1.8rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 'bold',
            width: '100%',
            boxShadow: '0 0 15px rgba(52, 152, 219, 0.4), 0 8px 15px rgba(0,0,0,0.3)',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)'
          }}
          {...getButtonHoverHandlers('rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 1)', '0 0 20px rgba(52, 152, 219, 0.6), 0 12px 20px rgba(0,0,0,0.4)', 'scale(1.05) translateY(-3px)')}
        >
          Add Entry
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: '1rem',
          color: message.includes('Error') ? 'red' : '#1e8449'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default AddEntryForm;
