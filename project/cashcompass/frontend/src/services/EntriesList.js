import React, { useEffect, useState } from "react";
import AddEntryForm from "./AddEntryForm"; // ✅ import form

function EntriesList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 🔹 summary state
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  // 🔹 fetch entries
  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/entries", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch entries");
      let data = await res.json();

      // ✅ sort entries by date (newest first)
      data = data.sort((a, b) => new Date(b.date) - new Date(a.date));

      setEntries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 fetch summary
  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/entries/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch summary");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  // 🔹 delete entry
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete entry");
      setEntries(entries.filter((entry) => entry._id !== id)); // ✅ update list
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  useEffect(() => {
    fetchEntries();
    
  }, []);

  return (
    <div>
      {/* ✅ AddEntryForm with callback */}
      <AddEntryForm onEntryAdded={fetchEntries} />

      <h2>Your Entries</h2>
      {loading ? (
        <p>Loading entries...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry._id}>
              {entry.date?.substring(0, 10)} – {entry.type}: ${entry.amount} ({entry.category})
              <button 
                onClick={() => handleDelete(entry._id)} 
                style={{ marginLeft: "10px", color: "red" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>Weekly Summary</h2>
      {summaryLoading ? (
        <p>Generating summary...</p>
      ) : summaryError ? (
        <p style={{ color: "red" }}>{summaryError}</p>
      ) : (
        summary && (
          <div>
            <p>
              <strong>This Week</strong> – Income: ${summary.currentWeek.income}, 
              Expense: ${summary.currentWeek.expense}, 
              Savings: ${summary.currentWeek.savings}
            </p>
            <p>
              <strong>Last Week</strong> – Income: ${summary.previousWeek.income}, 
              Expense: ${summary.previousWeek.expense}, 
              Savings: ${summary.previousWeek.savings}
            </p>
            <p><strong>AI Insight:</strong> {summary.aiComment}</p>
          </div>
        )
      )}
    </div>
  );
}

export default EntriesList;
