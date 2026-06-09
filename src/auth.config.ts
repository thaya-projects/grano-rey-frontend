import type { NextAuthConfig } from 'next-auth';
import type { RolUsuario } from '@/lib/types';

const APP_ROUTES = [
  '/dashboard',
  '/stock',
  '/materia-prima',
  '/ventas',
  '/despachos',
  '/reportes',
  '/configuracion',
];

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/login' },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn  = !!auth?.user;
      const isAppRoute  = APP_ROUTES.some(r => nextUrl.pathname.startsWith(r));
      if (isAppRoute) return isLoggedIn; // redirige a /login si no está autenticado
      return true;
    },

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
      session.user.nombre      = token.nombre as string;
      session.user.rol         = token.rol as RolUsuario;
      session.user.iniciales   = token.iniciales as string;
      session.user.accessToken = token.accessToken as string;
      return session;
    },
  },

  providers: [], // los providers reales van en auth.ts
  session: { strategy: 'jwt' },
};
