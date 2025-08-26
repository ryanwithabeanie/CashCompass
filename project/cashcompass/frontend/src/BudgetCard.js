import React, { useState, useEffect } from 'react';
import { setBudget, getBudget } from './services/budgetService';

export default function BudgetCard({ user }) {
  const [amount, setAmount] = useState('');
  const [salary, setSalary] = useState('');
  const [expense, setExpense] = useState(0);
  const [progress, setProgress] = useState(0);
  const [notify, setNotify] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    getBudget(token)
      .then(data => {
        setAmount(data.amount || '');
        setSalary(data.salary || '');
        setExpense(data.expense || 0);
        setProgress(data.progress || 0);
        setNotify(data.notify || false);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load budget');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await setBudget(Number(amount), Number(salary), token);
      setLoading(true);
      const data = await getBudget(token);
      setAmount(data.amount || '');
      setSalary(data.salary || '');
      setExpense(data.expense || 0);
      setProgress(data.progress || 0);
      setNotify(data.notify || false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
      <h2>Budget Monitor</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <label>Salary: </label>
          <input type="number" value={salary} onChange={e => setSalary(e.target.value)} required min="0" style={{ width: 80 }} />
        </div>
        <div>
          <label>Budget: </label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" max={salary || undefined} style={{ width: 80 }} />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px' }}>Set Budget</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {loading ? <p>Loading...</p> : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Expense:</strong> ${expense} / <strong>Budget:</strong> ${amount}
          </div>
          <div style={{ height: '24px', background: '#eee', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{
              width: `${Math.min(progress * 100, 100)}%`,
              height: '100%',
              background: progress < 0.9 ? '#2ecc71' : '#e74c3c',
              transition: 'width 0.5s'
            }} />
          </div>
          <div style={{ fontWeight: 'bold', color: progress >= 0.9 ? '#e74c3c' : '#333' }}>
            {progress >= 1 ? 'Budget Exceeded!' : progress >= 0.9 ? 'Warning: Near Budget Limit!' : 'Within Budget'}
          </div>
          {notify && <div style={{ color: '#e67e22', marginTop: '1rem' }}>Notification: You are close to exceeding your budget!</div>}
        </>
      )}
    </div>
  );
}
