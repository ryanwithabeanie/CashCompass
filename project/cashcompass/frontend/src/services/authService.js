const API = "http://localhost:5000/api/auth";

export async function validateToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  try {
    const res = await fetch(`${API}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Invalid token');
    }

    const data = await res.json();
    return data.valid === true;
  } catch (err) {
    console.error('Token validation failed:', err);
    return false;
  }
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
