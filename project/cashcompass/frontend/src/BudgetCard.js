import React, { useState, useEffect, useCallback } from 'react';
import { setBudget, getBudget } from './services/budgetService';

export default function BudgetCard({ user }) {
  const [budget, setBudgetAmount] = useState('');
  const [currentWeekExpense, setCurrentWeekExpense] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // Function to calculate current week's expenses
  const fetchCurrentWeekExpenses = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/entries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch entries');
      
      const entries = await res.json();
      
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Calculate total expenses for current week
      const weeklyExpense = entries
        .filter(entry => {
          const entryDate = new Date(entry.date);
          return entry.type === 'expense' && entryDate >= startOfWeek;
        })
        .reduce((total, entry) => total + entry.amount, 0);
      
      setCurrentWeekExpense(weeklyExpense);
    } catch (err) {
      console.error('Error fetching weekly expenses:', err);
      setError('Failed to load weekly expenses');
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const loadBudgetAndExpenses = async () => {
      try {
        setLoading(true);
        // Load budget
        const budgetData = await getBudget(token);
        setBudgetAmount(budgetData.amount || '');
        
        // Load current week's expenses
        await fetchCurrentWeekExpenses();
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load budget data');
        setLoading(false);
      }
    };

    loadBudgetAndExpenses();
  }, [token, fetchCurrentWeekExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await setBudget(Number(budget), token);
      await fetchCurrentWeekExpenses(); // Refresh expenses after setting new budget
    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate progress percentage
  const progress = budget ? currentWeekExpense / Number(budget) : 0;

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(12px)',
      marginBottom: '2rem'
    }}>
      <h2 style={{ marginBottom: '1rem', color: '#222', textAlign: 'left', fontSize: '1.5rem', fontWeight: '600', userSelect: 'none' }}>Weekly Budget Monitor</h2>
      
      <form onSubmit={handleSubmit} style={{ 
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <label style={{ marginRight: '0.5rem' }}>Set Weekly Budget: $</label>
          <input
            type="number"
            value={budget}
            onChange={e => setBudgetAmount(e.target.value)}
            required
            min="0"
            style={{
              width: 120,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              color: '#222',
              outline: 'none'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '0.5rem 1.5rem',
            background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.9) 0%, rgba(109, 213, 250, 0.9) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background 0.3s',
            hover: { background: '#2980b9' }
          }}
        >
          Set Budget
        </button>
      </form>

      {error && (
        <div style={{ 
          color: '#e74c3c',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: 'rgba(231, 76, 60, 0.1)',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ 
            marginBottom: '1rem',
            fontSize: '1.1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}>
            <span>
              <strong>Current Week's Expenses:</strong> ${currentWeekExpense.toFixed(2)}
            </span>
            <span>
              <strong>Budget:</strong> ${budget || '0'}
            </span>
          </div>

          <div style={{ 
            height: '24px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{
              width: `${Math.min(progress * 100, 100)}%`,
              height: '100%',
              background: progress < 0.8 
                ? '#2ecc71' // Green for safe
                : progress < 1 
                  ? '#f1c40f' // Yellow for warning
                  : '#e74c3c', // Red for exceeded
              transition: 'all 0.5s'
            }} />
          </div>

          <div style={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: progress < 0.8 
              ? '#27ae60' 
              : progress < 1 
                ? '#d35400'
                : '#c0392b'
          }}>
            {progress >= 1 
              ? '⚠️ Budget Exceeded!' 
              : progress >= 0.8 
                ? '⚠️ Warning: Near Budget Limit!' 
                : '✅ Within Budget'}
          </div>

          {budget && (
            <div style={{ 
              marginTop: '1rem',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '0.9rem'
            }}>
              ${Math.abs(Number(budget) - currentWeekExpense).toFixed(2)} {progress >= 1 ? 'over budget' : 'remaining'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
