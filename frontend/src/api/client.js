import axios from 'axios';

const apiBaseUrl = (() => {
  const configuredUrl = import.meta.env.VITE_API_URL || '';
  if (!configuredUrl) return '/api';
  return `${configuredUrl.replace(/\/$/, '')}/api`;
})();

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add bearer token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      originalRequest._retry = true;
      try {
        const res = await api.post('/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        if (newToken) {
          localStorage.setItem('careconnect_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('careconnect_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
