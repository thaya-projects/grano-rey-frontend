import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import axios from 'axios';
import { authConfig } from './auth.config';
import type { LoginResponse } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001/api/v1';

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const { data } = await axios.post<LoginResponse>(
            `${API_BASE}/auth/login`,
            { email, password },
            { headers: { 'Content-Type': 'application/json' } },
          );
          const u = data.usuario;
          return {
            id:          u.id,
            nombre:      u.nombre,
            email:       u.email,
            rol:         u.rol,
            iniciales:   iniciales(u.nombre),
            accessToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
