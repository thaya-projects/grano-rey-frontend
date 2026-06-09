'use client';
import { useSession, signOut as naSignOut } from 'next-auth/react';
import type { RolUsuario } from './types';

export type Role = RolUsuario;

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  iniciales: string;
}

// Token en memoria para el interceptor de axios — lo sincroniza AppLayout
let _token: string | null = null;
export const getAccessToken = () => _token;
export const setAccessToken = (t: string | null) => { _token = t; };

export function useAuth() {
  const { data: session } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id:        session.user.id,
        nombre:    session.user.nombre,
        email:     session.user.email ?? '',
        rol:       session.user.rol,
        iniciales: session.user.iniciales,
      }
    : null;

  return {
    user,
    logout: () => naSignOut({ callbackUrl: '/login' }),
  };
}
