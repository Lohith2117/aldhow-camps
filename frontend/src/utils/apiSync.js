const API_BASE = '/api';

// Helper to grab the token from the saved session
const getAuthHeaders = () => {
  try {
    const session = JSON.parse(localStorage.getItem('dhow_session_v14'));
    if (session && session.token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
    }
  } catch (err) {
    console.warn("Failed to read session token");
  }
  return { 'Content-Type': 'application/json' };
};

export async function fetchCloudData(endpoint) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn("Unauthorized API call. Session might be expired.");
      }
      throw new Error(`Failed to fetch ${endpoint}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Offline or API error on ${endpoint}, falling back to localStorage.`);
    return null;
  }
}

export async function saveCloudData(endpoint, payload) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to save to ${endpoint}`);
    return await res.json();
  } catch (err) {
    console.warn(`Cloud save failed for ${endpoint}, saved locally.`);
    return null;
  }
}