const envBase = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE : undefined;
const host = (typeof window !== 'undefined' && window.location && window.location.hostname)
	? window.location.hostname
	: '127.0.0.1';
export const API_BASE = envBase || `http://${host}:8000`;
export const API_BASE_URL = `${API_BASE}/api`;
