const API = "http://localhost:5000/api/entries/summary";

// Rate limiting to prevent too many requests
let lastRequestTime = 0;
const RATE_LIMIT_MS = 5000; // 5 seconds between requests

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSummary() {
  // Check rate limiting
  const now = Date.now();
  if (now - lastRequestTime < RATE_LIMIT_MS) {
    const remainingTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequestTime)) / 1000);
    throw new Error(`Please wait ${remainingTime} seconds before requesting another summary`);
  }
  
  lastRequestTime = now;

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
