import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { LoginResponse, RolUsuario } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3001/api/v1';

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 horas — igual que el backend

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

// JWT usa base64url (RFC 4648 §5): - en lugar de + y _ en lugar de /
// atob solo entiende base64 estándar → hay que convertir primero
function getTokenExpiry(accessToken: string): number | undefined {
  try {
    const b64     = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>;
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
    // authorized: se ejecuta en el proxy (edge) para proteger rutas.
    authorized({ auth, request: { nextUrl } }) {
      const APP_ROUTES = ['/dashboard','/stock','/materia-prima','/ventas','/despachos','/reportes','/configuracion'];
      const isAppRoute = APP_ROUTES.some(r => nextUrl.pathname.startsWith(r));
      if (isAppRoute && !auth) return false; // sin sesión → NextAuth redirige a pages.signIn
      return true;
    },

    // jwt: llamado en login (user presente) y en cada request (solo token).
    // Nunca retornar null ni lanzar excepción — eso borra el cookie de sesión.
    jwt({ token, user }) {
      if (user) {
        token.sub                = user.id; // sub es el identificador estándar de NextAuth
        token.id                 = user.id;
        token.nombre             = user.nombre;
        token.rol                = user.rol;
        token.iniciales          = user.iniciales;
        token.accessToken        = user.accessToken;
        token.accessTokenExpires = getTokenExpiry(user.accessToken);
      }
      return token;
    },

    // session: construir objeto nuevo con spread para evitar mutar el original.
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id:          (token.id ?? token.sub) as string,
          nombre:      token.nombre            as string,
          rol:         token.rol               as RolUsuario,
          iniciales:   token.iniciales         as string,
          accessToken: token.accessToken       as string,
        },
      };
    },
  },
};

export const { signIn, signOut, auth, handlers } = NextAuth(authConfig);
