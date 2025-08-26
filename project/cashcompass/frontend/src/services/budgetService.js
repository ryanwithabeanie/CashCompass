// Budget service for frontend API calls
export async function setBudget(amount, salary, token) {
  const res = await fetch('http://localhost:5000/api/budget/set', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ amount, salary })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getBudget(token) {
  const res = await fetch('http://localhost:5000/api/budget', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
