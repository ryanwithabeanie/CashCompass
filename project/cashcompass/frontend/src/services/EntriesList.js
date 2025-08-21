// frontend/src/components/EntriesList.js
import React, { useEffect, useState } from "react";

function EntriesList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingEntry, setEditingEntry] = useState(null); // ✅ track which entry is being edited
  const [editForm, setEditForm] = useState({
    type: "expense",
    category: "",
    amount: "",
    note: "",
    date: "",
  });

  const token = localStorage.getItem("token");

  // ✅ Fetch entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        if (!token) {
          setError("No token found. Please log in.");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/entries", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch entries");
        }

        const data = await res.json();
        setEntries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [token]);

  // ✅ Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete entry");
      }

      setEntries(entries.filter((e) => e._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Start editing
  const startEditing = (entry) => {
    setEditingEntry(entry._id);
    setEditForm({
      type: entry.type,
      category: entry.category,
      amount: entry.amount,
      note: entry.note || "",
      date: entry.date.split("T")[0], // format YYYY-MM-DD
    });
  };

  // ✅ Handle form change
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // ✅ Submit update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:5000/api/entries/${editingEntry}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update entry");
      }

      const updated = await res.json();
      setEntries(entries.map((e) => (e._id === updated._id ? updated : e)));
      setEditingEntry(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading entries...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Your Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet. Add one!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {entries.map((entry) => (
            <li
              key={entry._id}
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "6px",
                backgroundColor:
                  entry.type === "income" ? "#e8f5e9" : "#ffebee",
              }}
            >
              {editingEntry === entry._id ? (
                // ✅ Edit Form
                <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditChange}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
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
                  <div>
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingEntry(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // ✅ Normal View
                <>
                  <strong>{entry.type.toUpperCase()}</strong> - {entry.category}  
                  <br />
                  Amount: ${entry.amount}
                  <br />
                  {entry.note && <>Note: {entry.note}<br /></>}
                  Date: {new Date(entry.date).toLocaleDateString()}
                  <div style={{ marginTop: "5px" }}>
                    <button
                      onClick={() => startEditing(entry)}
                      style={{ marginRight: "8px" }}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(entry._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EntriesList;
