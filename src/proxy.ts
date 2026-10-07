import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'vk_admin_session';
const PUBLIC_ADMIN_PATHS = ['/admin/login'];

/**
 * First line of defence only: bounces requests with no session cookie away from
 * the portal. Every admin page and API route re-validates the session against
 * the database and checks the role — this never grants access on its own.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const login = new URL('/admin/login', request.url);
    if (pathname !== '/admin' && pathname !== '/admin/dashboard') login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
