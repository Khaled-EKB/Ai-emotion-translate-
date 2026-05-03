// src/services/api.js
// ─── Central API Service ─────────────────────────────────────────────────────
// All backend calls go through here. The Java Spring Boot backend runs on :3000.

const BASE_URL = 'http://localhost:3000';

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Generic request wrapper ───────────────────────────────────────────────────
async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Authentication ─────────────────────────────────────────────────────────────
export const authApi = {
  /**
   * Register a new user. (All new users are standard USERs)
   * @param {string} email
   * @param {string} password
   */
  register: (email, password) =>
    request('POST', '/auth/register', { email, password }),

  /**
   * Login and receive a JWT token.
   * Automatically saves the token to localStorage.
   */
  login: async (email, password) => {
    const data = await request('POST', '/auth/login', { email, password });
    if (data?.token) {
      localStorage.setItem('token', data.token);
      if (data.role) {
        localStorage.setItem('userRole', data.role);
      } else {
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          localStorage.setItem('userRole', payload.role || 'USER');
        } catch (e) {
          localStorage.setItem('userRole', 'USER');
        }
      }
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  },

  isLoggedIn: () => !!getToken(),
  getRole: () => localStorage.getItem('userRole'),
};

// ── AI Processing ─────────────────────────────────────────────────────────────
export const aiApi = {
  /**
   * Analyze text: detects language (Lingua), extracts emotions (Anthropic),
   * then translates (DeepL).
   *
   * @param {string} text - The input text to process
   * @param {string} targetLanguage - Human-readable language name (e.g. "Arabic")
   * @param {string} targetLanguageCode - DeepL language code (e.g. "AR", "FR", "EN-US")
   * @returns {{ historyId, detectedLanguage, targetLanguage, emotions, originalText, translatedText }}
   */
  analyze: (text, targetLanguage = 'English', targetLanguageCode = 'EN-US') =>
    request('POST', '/analyze', { text, targetLanguage, targetLanguageCode }),

  /**
   * Rewrite text with a target emotion using Anthropic Claude.
   *
   * @param {string} text - Original text
   * @param {string} targetEmotion - Desired emotion (e.g. "calm", "confident", "empathetic")
   * @returns {{ historyId, originalText, targetEmotion, rewrittenText }}
   */
  rewrite: (text, targetEmotion) =>
    request('POST', '/rewrite', { text, targetEmotion }),
};

// ── History (current user only) ────────────────────────────────────────────────
export const historyApi = {
  /** Get all history records for the current logged-in user */
  getAll: () => request('GET', '/history'),

  /** Get a single record by ID */
  getById: (id) => request('GET', `/history/${id}`),

  /** Delete a record by ID */
  delete: (id) => request('DELETE', `/history/${id}`),
};

// ── Admin / HR only ───────────────────────────────────────────────────────────
export const adminApi = {
  /** [HR only] Get all registered users */
  getAllUsers: () => request('GET', '/admin/users'),

  /** [HR only] Get all history records across all users */
  getAllHistory: () => request('GET', '/admin/history'),

  /** [HR only] Delete any history record by ID */
  deleteHistory: (id) => request('DELETE', `/admin/history/${id}`),
};
