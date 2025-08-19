const API = "http://localhost:5000/api/entries";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Get all entries (protected)
export async function fetchEntries() {
  const res = await fetch(API, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

// ✅ Add new entry (protected)
export async function addEntry(data) {
  const res = await fetch(`${API}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add entry");
  return res.json();
}

// ✅ Update entry (protected)
export async function updateEntry(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update entry");
  return res.json();
}

// ✅ Delete entry (protected)
export async function deleteEntry(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to delete entry");
  return res.json();
}
