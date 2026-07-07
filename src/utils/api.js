const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default async function apiFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const token = localStorage.getItem('token');
  const headers = opts.headers ? { ...opts.headers } : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && opts.body && typeof opts.body === 'object') headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...opts, headers, body: opts.body && typeof opts.body === 'object' ? JSON.stringify(opts.body) : opts.body });
  // try to parse json, otherwise return raw response
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}
