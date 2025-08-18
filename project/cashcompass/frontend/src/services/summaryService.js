export async function fetchSummary() {
  const res = await fetch('http://localhost:5000/api/entries/summary');
  if (!res.ok) throw new Error('Failed to fetch summary');
  return await res.json();
}


const API = "http://localhost:5000/api/entries/summary";
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
export async function fetchSummary() {
  const res = await fetch(API, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}
