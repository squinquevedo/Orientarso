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

export const login = (username, password) =>
  api.post('/login/', { username, password });

export const registro = (formData) =>
  api.post('/registro/', formData);

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

export default api;
