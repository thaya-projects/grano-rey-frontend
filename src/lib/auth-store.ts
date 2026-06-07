import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from './api';
import type { LoginResponse, RolUsuario } from './types';

export type Role = RolUsuario;

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  iniciales: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

function inicialesFromName(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      login: async (email, password) => {
        const { data } = await axios.post<LoginResponse>(
          `${API_URL}/auth/login`,
          { email, password },
          { headers: { 'Content-Type': 'application/json' } },
        );
        set({
          accessToken: data.access_token,
          user: {
            id: data.usuario.id,
            nombre: data.usuario.nombre,
            email: data.usuario.email,
            rol: data.usuario.rol,
            iniciales: inicialesFromName(data.usuario.nombre),
          },
        });
      },
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: 'gr-auth' },
  ),
);
