import { NextResponse, type NextRequest } from 'next/server';

// Allowlist: rutas accesibles sin sesión. Todo lo que NO calce con ninguna
// de estas queda protegido por defecto (fail-closed), en vez de mantener
// una lista de rutas privadas que hay que recordar actualizar cada vez
// que se agrega una página nueva al grupo (app).
const PUBLIC_ROUTES = [
  '/catalogo',
  '/login',
  '/api/auth',
  '/api/public',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
];

// Nombres posibles del cookie de sesión de NextAuth v5
const SESSION_COOKIES = [
  '__Secure-authjs.session-token', // HTTPS (producción)
  'authjs.session-token',          // HTTP (desarrollo)
];

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const isPublicRoute = pathname === '/' || PUBLIC_ROUTES.some(r => pathname.startsWith(r));
  if (isPublicRoute) return NextResponse.next();

  // Solo comprobamos si el cookie existe.
  // El descifrado real lo hace /api/auth/session en Node.js.
  const hasCookie = SESSION_COOKIES.some(name => req.cookies.has(name));
  if (!hasCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
