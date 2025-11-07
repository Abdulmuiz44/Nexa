import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function onboardingMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Require NextAuth session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Allow visiting /onboarding while authenticated
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    return response;
  }

  // Lookup user status using service DB (maps to NextAuth token.sub)
  const { data: userData } = await supabaseServer
    .from('users')
    .select('status')
    .eq('id', token.sub as string)
    .single();

  if (userData?.status === 'onboarding_complete' || userData?.status === 'active' || userData?.status === 'agent_active') {
    return response;
  }

  // If not completed onboarding, redirect to onboarding
  const url = request.nextUrl.clone();
  url.pathname = '/onboarding';
  return NextResponse.redirect(url);
}
