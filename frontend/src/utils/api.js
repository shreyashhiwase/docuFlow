const BASE = import.meta.env.VITE_API_URL || '/api';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('docuflow_user') || 'null');
  } catch {
    return null;
  }
}

async function request(method, path, body, extraHeaders = {}) {
  const user = getUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(user ? { 'x-user-id': user.id } : {}),
    ...extraHeaders,
  };

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function uploadFile(file) {
  const user = getUser();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE}/upload/import`, {
    method: 'POST',
    headers: user ? { 'x-user-id': user.id } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  getUsers: () => request('GET', '/auth/users'),

  // Documents
  getDocuments: () => request('GET', '/documents'),
  getDocument: (id) => request('GET', `/documents/${id}`),
  createDocument: (title, content) => request('POST', '/documents', { title, content }),
  updateDocument: (id, updates) => request('PUT', `/documents/${id}`, updates),
  deleteDocument: (id) => request('DELETE', `/documents/${id}`),

  // Shares
  getShares: (docId) => request('GET', `/share/${docId}`),
  shareDocument: (documentId, sharedWithEmail, permission) =>
    request('POST', '/share', { documentId, sharedWithEmail, permission }),
  updateShare: (docId, userId, permission) =>
    request('PUT', `/share/${docId}/${userId}`, { permission }),
  removeShare: (docId, userId) => request('DELETE', `/share/${docId}/${userId}`),

  // Upload
  importFile: uploadFile,
};
