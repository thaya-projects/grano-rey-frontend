// En Next.js 16 el proxy reemplaza a middleware.ts.
// Exportar `auth` como `proxy` activa NextAuth v5 como proxy de autenticación.
// La lógica de protección vive en el callback `authorized` de auth.ts.
export { auth as proxy } from '@/auth';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
