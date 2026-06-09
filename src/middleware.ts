import { decode } from 'next-auth/jwt';
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

// NextAuth v5 puede usar cualquiera de estos dos nombres dependiendo del entorno.
// En vez de inferir cuál es, leemos directamente del request.
const COOKIE_NAMES = [
  '__Secure-authjs.session-token', // producción (HTTPS)
  'authjs.session-token',          // desarrollo (HTTP)
];

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const isAppRoute = APP_ROUTES.some(r => req.nextUrl.pathname.startsWith(r));
  if (!isAppRoute) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next(); // mala config → dejar pasar sin romper

  // Buscar el cookie que realmente existe en este request
  let cookieValue: string | undefined;
  let cookieName:  string | undefined;

  for (const name of COOKIE_NAMES) {
    const val = req.cookies.get(name)?.value;
    if (val) { cookieValue = val; cookieName = name; break; }
  }

  // No hay cookie → ir al login
  if (!cookieValue || !cookieName) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // decode() maneja JWE (cifrado de v5) usando secret + salt (nombre del cookie)
    const token = await decode({ token: cookieValue, secret, salt: cookieName });

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Backend token expirado → ir al login
    if (typeof token.accessTokenExpires === 'number' && Date.now() > token.accessTokenExpires) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  } catch {
    // Si decode lanza (token corrupto, secret erróneo) → ir al login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
