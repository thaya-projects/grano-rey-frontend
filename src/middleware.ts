import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Instancia Edge-safe: solo usa authConfig (sin axios ni módulos Node.js)
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
