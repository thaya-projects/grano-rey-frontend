import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import axios from 'axios';
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

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.nombre      = user.nombre;
        token.rol         = user.rol;
        token.iniciales   = user.iniciales;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id          = token.id as string;
      session.user.nombre      = token.nombre;
      session.user.rol         = token.rol;
      session.user.iniciales   = token.iniciales;
      session.user.accessToken = token.accessToken;
      return session;
    },
  },

  pages:   { signIn: '/login' },
  session: { strategy: 'jwt' },
});
