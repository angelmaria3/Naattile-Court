const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fileCase({ complainantName, defendantName, caseTitle }) {
  const res = await fetch(`${BASE_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complainantName, defendantName, caseTitle }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export async function getCaseByCode(code) {
  const res = await fetch(`${BASE_URL}/cases/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Case not found.');
  return data;
}

export async function joinCase({ code, defendantJoinedName }) {
  const res = await fetch(`${BASE_URL}/cases/${code}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ defendantJoinedName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
