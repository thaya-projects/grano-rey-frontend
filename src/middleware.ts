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

export default function middleware(req: NextRequest): NextResponse {
  const isAppRoute = APP_ROUTES.some(r => req.nextUrl.pathname.startsWith(r));
  if (!isAppRoute) return NextResponse.next();

  // Si NO hay cookie de sesión → redirigir al login.
  // No intentamos descifrar el token aquí — eso lo hace /api/auth/session.
  // Solo comprobamos si existe el cookie para evitar loops.
  const hasCookie = SESSION_COOKIES.some(name => req.cookies.has(name));
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
