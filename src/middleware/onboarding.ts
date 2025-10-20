
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function onboardingMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check for NextAuth session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                       request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If session token exists, allow access (skip onboarding check for now)
  return response;
}
