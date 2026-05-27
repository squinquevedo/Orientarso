import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const visibleErrors = [404, 408, 500, 503];

    if (visibleErrors.includes(status) && !window.location.pathname.startsWith('/error/')) {
      window.location.assign(`/error/${status}`);
    }

    return Promise.reject(error);
  }
);

export const login = (username, password) =>
  api.post('/login/', { username, password });

export const registro = (formData) =>
  api.post('/registro/', formData);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

export default api;
