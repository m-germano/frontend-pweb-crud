import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '/api' : '/api');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}
