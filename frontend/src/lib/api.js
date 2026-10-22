/**
 * Single API client for the whole frontend.
 *
 * - one place for the base URL; local dev defaults to localhost:5000, a
 *   production build defaults to the same origin (served by the backend)
 * - attaches the JWT automatically so chat history / bookmarks actually persist
 * - normalises error messages so pages never render "[object Object]"
 */

const configuredBase = import.meta.env.VITE_API_BASE;
const resolvedBase =
  configuredBase === undefined
    ? import.meta.env.DEV
      ? 'http://localhost:5000'
      : ''
    : String(configuredBase);
const API_BASE = resolvedBase.replace(/\/+$/, '');
const TOKEN_KEY = 'schemesaathi_token';
const SESSION_KEY = 'schemesaathi_session';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function newSessionId() {
  const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) id = newSessionId();
  return id;
}

async function request(path, { method = 'GET', body, auth = 'auto', signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token && auth !== 'none') headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the SchemeSaathi server. Is the backend running?', 0, null);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status, data);
  }
  return data;
}

/** SSE reader for POST /api/query/stream. */
async function streamQuery(payload, { onMeta, onToken, onDone, signal } = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/api/query/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    let message = `Request failed (${response.status})`;
    try {
      message = JSON.parse(text)?.error || message;
    } catch {
      /* keep default */
    }
    throw new ApiError(message, response.status, null);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;

  const dispatch = (raw) => {
    let event = 'message';
    const dataLines = [];
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    let data;
    try {
      data = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }
    if (event === 'meta') onMeta?.(data);
    else if (event === 'token') onToken?.(data.t || '');
    else if (event === 'done') {
      finished = true;
      onDone?.(data);
    } else if (event === 'error') throw new ApiError(data.error || 'Streaming failed', 500, data);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index = buffer.indexOf('\n\n');
    while (index !== -1) {
      dispatch(buffer.slice(0, index));
      buffer = buffer.slice(index + 2);
      index = buffer.indexOf('\n\n');
    }
  }
  if (buffer.trim()) dispatch(buffer);

  return { finished };
}

const withQuery = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const api = {
  baseUrl: API_BASE,

  // --- conversation ---
  query: (query, { profile, topK, filters, sessionId } = {}) =>
    request('/api/query', {
      method: 'POST',
      body: { query, profile, topK, filters, sessionId: sessionId ?? getSessionId() },
    }),

  streamQuery: (query, { profile, topK, filters, sessionId } = {}, handlers) =>
    streamQuery(
      { query, profile, topK, filters, sessionId: sessionId ?? getSessionId() },
      handlers,
    ),

  // --- eligibility ---
  checkEligibility: ({ schemeId, schemeName, profile }) =>
    request('/api/eligibility/check', { method: 'POST', body: { schemeId, schemeName, profile } }),

  matchEligibility: ({ profile, need, limit } = {}) =>
    request('/api/eligibility/match', { method: 'POST', body: { profile, need, limit } }),

  eligibilityRules: (schemeId) => request(`/api/eligibility/rules/${schemeId}`),

  // --- schemes ---
  schemes: (filters = {}) => request(`/api/schemes${withQuery(filters)}`),
  scheme: (id) => request(`/api/schemes/${id}`),
  schemeFilters: () => request('/api/schemes/filters'),

  // --- auth ---
  register: ({ name, email, password }) =>
    request('/api/register', { method: 'POST', body: { name, email, password }, auth: 'none' }),
  login: ({ email, password }) =>
    request('/api/login', { method: 'POST', body: { email, password }, auth: 'none' }),
  me: () => request('/api/me'),
  getProfile: () => request('/api/profile'),
  saveProfile: (profile) => request('/api/profile', { method: 'PUT', body: { profile } }),

  // --- history & bookmarks ---
  history: (limit = 50) => request(`/api/history${withQuery({ limit })}`),
  deleteHistory: (id) => request(`/api/history/${id}`, { method: 'DELETE' }),
  clearHistory: () => request('/api/history', { method: 'DELETE' }),

  bookmarks: () => request('/api/bookmarks'),
  addBookmark: (schemeId) => request('/api/bookmarks', { method: 'POST', body: { schemeId } }),
  removeBookmark: (schemeId) => request(`/api/bookmarks/${schemeId}`, { method: 'DELETE' }),

  // --- feedback ---
  feedback: ({ rating, comment, answer, meta }) =>
    request('/api/feedback', { method: 'POST', body: { rating, comment, answer, meta }, auth: 'auto' }),

  health: () => request('/api/health', { auth: 'none' }),
};

export default api;
