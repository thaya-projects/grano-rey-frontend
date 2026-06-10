import axios, { AxiosError } from 'axios';
import { getAccessToken, setAccessToken } from './auth-store';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    if (error.response?.status === 401) {
      const hadToken = getAccessToken() !== null;
      setAccessToken(null);
      // Solo cerrar sesión si teníamos un token válido que fue rechazado.
      // Si hadToken es false, la sesión aún está cargando — no destruir el cookie.
      if (hadToken) {
        const { signOut } = await import('next-auth/react');
        signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = 'Error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
