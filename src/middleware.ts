import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const APP_ROUTES = [
  '/dashboard',
  '/stock',
  '/materia-prima',
  '/ventas',
  '/despachos',
  '/reportes',
  '/configuracion',
];

export default auth((req) => {
  const isAppRoute = APP_ROUTES.some(r => req.nextUrl.pathname.startsWith(r));
  if (isAppRoute && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|logo|.*\\..*).*)'],
};
