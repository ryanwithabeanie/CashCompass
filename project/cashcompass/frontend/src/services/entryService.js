import axios from 'axios';

const API_URL = 'http://localhost:5000/api/entries';

export const fetchEntries = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch entries", err);
    throw err;
  }
};


const API = "http://localhost:5000/api/entries";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchEntries() {
  const res = await fetch(API, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}

export async function addEntry(data) {
  const res = await fetch(`${API}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add entry");
  return res.json();
}

export async function updateEntry(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update entry");
  return res.json();
}

export async function deleteEntry(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to delete entry");
  return res.json();
}
