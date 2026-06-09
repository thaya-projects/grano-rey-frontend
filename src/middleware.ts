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

  // NextAuth v5 cookie name: __Secure- prefix en HTTPS (producción), sin él en HTTP (dev)
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieName = isProduction
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
