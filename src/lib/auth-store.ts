import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'administradora' | 'almacenero' | 'vendedor' | 'produccion';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  iniciales: string;
}

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@granory.bo':      { id: 'u1', nombre: 'Jovana', email: 'admin@granory.bo',      password: '123456', rol: 'administradora', iniciales: 'MF' },
  'almacen@granory.bo':    { id: 'u2', nombre: 'Carlos Rojas',    email: 'almacen@granory.bo',    password: '123456', rol: 'almacenero',     iniciales: 'CR' },
  'vendedor@granory.bo':   { id: 'u3', nombre: 'Ana Gutiérrez',   email: 'vendedor@granory.bo',   password: '123456', rol: 'vendedor',       iniciales: 'AG' },
  'produccion@granory.bo': { id: 'u4', nombre: 'Luis Mamani',     email: 'produccion@granory.bo', password: '123456', rol: 'produccion',     iniciales: 'LM' },
};

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (email, password) => {
        await new Promise(r => setTimeout(r, 600));
        const found = DEMO_USERS[email.toLowerCase()];
        if (!found || found.password !== password) throw new Error('Credenciales incorrectas');
        const { password: _, ...user } = found;
        set({ user });
      },
      logout: () => set({ user: null }),
    }),
    { name: 'gr-auth' }
  )
);
