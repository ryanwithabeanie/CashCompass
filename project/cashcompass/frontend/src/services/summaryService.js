export async function fetchSummary() {
  const res = await fetch('http://localhost:5000/api/entries/summary');
  if (!res.ok) throw new Error('Failed to fetch summary');
  return await res.json();
}
