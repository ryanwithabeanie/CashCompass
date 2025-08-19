const API = "http://localhost:5000/api/entries";

// ✅ Always return proper headers
function authHeaders(contentType = false) {
  const token = localStorage.getItem("token");
  const headers = {};

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ✅ Get all entries (protected)
export async function fetchEntries() {
  const res = await fetch(API, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

// ✅ Add new entry (protected)
export async function addEntry(data) {
  const res = await fetch(`${API}/add`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to add entry");
  }
  return res.json();
}

// ✅ Update entry (protected)
export async function updateEntry(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update entry");
  }
  return res.json();
}

// ✅ Delete entry (protected)
export async function deleteEntry(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete entry");
  }
  return res.json();
}
