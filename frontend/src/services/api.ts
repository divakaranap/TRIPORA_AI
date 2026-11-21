import axios from 'axios';

/**
 * Resolves the backend API base URL with full protocol and /api/v1 path.
 * Supports:
 * - VITE_API_URL set to root domain: 'https://tripora-backend.onrender.com' -> 'https://tripora-backend.onrender.com/api/v1'
 * - VITE_API_URL set to versioned path: 'https://tripora-backend.onrender.com/api/v1' -> 'https://tripora-backend.onrender.com/api/v1'
 * - Runtime window.__TRIPORA_API_URL__ override for dynamic environments
 * - Fallback to default local backend 'http://127.0.0.1:8000/api/v1'
 */
export function getApiBaseUrl(): string {
  const envUrl = (
    (typeof window !== 'undefined' && (window as any).__TRIPORA_API_URL__) ||
    import.meta.env.VITE_API_URL ||
    ''
  ).trim();

  if (!envUrl) {
    return 'http://127.0.0.1:8000/api/v1';
  }

  // Remove trailing slashes
  const cleaned = envUrl.replace(/\/+$/, '');

  // If already ends with /api/v1, use as is; otherwise append /api/v1
  return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Attach JWT access token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tripora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid or expired
      localStorage.removeItem('tripora_token');
      localStorage.removeItem('tripora_user');
    }
    return Promise.reject(error);
  }
);

export default api;
