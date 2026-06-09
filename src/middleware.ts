import { getToken } from 'next-auth/jwt';
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

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const isAppRoute = APP_ROUTES.some(r => req.nextUrl.pathname.startsWith(r));
  if (!isAppRoute) return NextResponse.next();

  // En v5 el JWT está cifrado (JWE). getToken necesita `salt` = nombre del cookie
  // para derivar la clave de descifrado correcta.
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName   = isProduction
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  const token = await getToken({
    req,
    secret:       process.env.AUTH_SECRET!,
    salt:         cookieName, // requerido en v5 — sin esto siempre devuelve null
    cookieName,
    secureCookie: isProduction,
  });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si el accessToken del backend ya expiró → redirigir a login
  if (typeof token.accessTokenExpires === 'number' && Date.now() > token.accessTokenExpires) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
