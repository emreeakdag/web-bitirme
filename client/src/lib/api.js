const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }
  
  return data;
}

export async function apiPost(endpoint, body) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiGet(endpoint) {
  return apiFetch(endpoint, { method: 'GET' });
}

export async function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}

export async function apiPut(endpoint, body) {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
