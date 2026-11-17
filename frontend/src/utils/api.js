// frontend/src/utils/api.js
/* unused */
const _getAuthHeaders = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem('dhow_session'));
    if (session && session.token) {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` };
    }
  } catch (err) { console.warn("Failed to read session token"); }
  return { 'Content-Type': 'application/json' };
};

export async function apiFetch(endpoint, method = 'GET', body = null) {
  let token = null;
  try { token = JSON.parse(sessionStorage.getItem('dhow_session') || 'null')?.token || null; } catch { token = null; }
  const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/${endpoint}`, { method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : null });
  } catch (networkError) {
    throw new Error('Cannot reach server');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }
  return res.json();
}