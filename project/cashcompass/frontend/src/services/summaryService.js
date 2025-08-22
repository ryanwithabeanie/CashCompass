const API = "http://localhost:5000/api/entries/summary";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSummary() {
  const res = await fetch(API, { headers: { ...authHeaders() } });

  if (!res.ok) {
    const text = await res.text();   // 👀 show what backend sent
    console.error("Summary fetch failed:", res.status, text);
    throw new Error("Failed to fetch summary");
  }

  return res.json();
}
