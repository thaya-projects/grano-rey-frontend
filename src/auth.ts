import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { LoginResponse, RolUsuario } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001/api/v1';

const APP_ROUTES = [
  '/dashboard',
  '/stock',
  '/materia-prima',
  '/ventas',
  '/despachos',
  '/reportes',
  '/configuracion',
];

// Cookie de NextAuth dura 8 horas — tiempo de jornada laboral
const SESSION_MAX_AGE = 8 * 60 * 60;

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

// Decodifica el exp del JWT del backend sin librería externa (Edge-safe)
function getTokenExpiry(accessToken: string): number | undefined {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

export const authConfig: NextAuthConfig = {
  pages:     { signIn: '/login' },
  trustHost: true,
  session:   { strategy: 'jwt', maxAge: SESSION_MAX_AGE },

  providers: [
    Credentials({
      authorize: async (credentials) => {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password }),
          });
          if (!res.ok) return null;

          const data: LoginResponse = await res.json();
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
    // Middleware usa este callback: si el accessToken expiró, redirige a login
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user && !auth.error;
      const isAppRoute = APP_ROUTES.some(r => nextUrl.pathname.startsWith(r));
      if (isAppRoute) return isLoggedIn;
      return true;
    },

    jwt({ token, user }) {
      // Solo en el login (user está presente)
      if (user) {
        token.id                = user.id;
        token.nombre            = user.nombre;
        token.rol               = user.rol;
        token.iniciales         = user.iniciales;
        token.accessToken       = user.accessToken;
        token.accessTokenExpires = getTokenExpiry(user.accessToken);
        delete token.error;
      }

      // En cada request: verificar si el accessToken del backend ya expiró
      if (
        typeof token.accessTokenExpires === 'number' &&
        Date.now() > token.accessTokenExpires
      ) {
        return { ...token, error: 'AccessTokenExpired' as const };
      }

      return token;
    },

    session({ session, token }) {
      session.user.id          = token.id          as string;
      session.user.nombre      = token.nombre      as string;
      session.user.rol         = token.rol         as RolUsuario;
      session.user.iniciales   = token.iniciales   as string;
      session.user.accessToken = token.accessToken as string;
      if (token.error) session.error = token.error;
      return session;
    },
  },
};

export const { signIn, signOut, auth, handlers } = NextAuth(authConfig);
