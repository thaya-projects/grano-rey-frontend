import { NextResponse, type NextRequest } from 'next/server';

const APP_ROUTES = [
  '/dashboard',
  '/stock',
  '/materia-prima',
  '/ventas',
  '/despachos',
  '/reportes',
  '/configuracion',
];

// Nombres posibles del cookie de sesión de NextAuth v5
const SESSION_COOKIES = [
  '__Secure-authjs.session-token', // HTTPS (producción)
  'authjs.session-token',          // HTTP (desarrollo)
];

export function proxy(req: NextRequest): NextResponse {
  const isAppRoute = APP_ROUTES.some(r => req.nextUrl.pathname.startsWith(r));
  if (!isAppRoute) return NextResponse.next();

  // Solo comprobamos si el cookie existe.
  // El descifrado real lo hace /api/auth/session en Node.js.
  const hasCookie = SESSION_COOKIES.some(name => req.cookies.has(name));
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
