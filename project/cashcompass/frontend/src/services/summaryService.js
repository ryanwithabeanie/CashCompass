const API = "http://localhost:5000/api/entries/summary";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSummary() {
  // Create an AbortController to handle timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(API, { 
      headers: { ...authHeaders() },
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Summary fetch failed:", res.status, text);
      throw new Error("Failed to fetch summary");
    }

    const data = await res.json();
    clearTimeout(timeoutId);
    
    if (!data) {
      throw new Error("No summary data received");
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("Summary request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
