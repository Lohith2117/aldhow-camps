// frontend/src/utils/api.js
const getAuthHeaders = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem('dhow_session'));
    if (session && session.token) {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` };
    }
  } catch (err) { console.warn("Failed to read session token"); }
  return { 'Content-Type': 'application/json' };
};

export const apiFetch = async (endpoint, method = 'GET', body = null) => {
  const options = { method, headers: getAuthHeaders() };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`/api/${endpoint}`, options);
  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem('dhow_session');
    window.location.reload(); // Force logout on invalid token
  }
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'API Error');
  }
  return res.json();
};