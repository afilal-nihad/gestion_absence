const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = 'Erreur serveur';
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (path, token) => request(path, { method: 'GET' }, token),
  post: (path, body, token) =>
    request(
      path,
      {
        method: 'POST',
        body: JSON.stringify(body)
      },
      token
    ),
  put: (path, body, token) =>
    request(
      path,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      },
      token
    ),
  del: (path, token) => request(path, { method: 'DELETE' }, token)
};

