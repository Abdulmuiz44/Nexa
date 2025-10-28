import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('sb-access-token')?.value;

  if (pathname.startsWith('/dashboard')) {
    if (!token) return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  if ((pathname.startsWith('/auth') || pathname === '/onboarding' || pathname === '/pricing-intro') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/onboarding', '/pricing-intro'],
};
