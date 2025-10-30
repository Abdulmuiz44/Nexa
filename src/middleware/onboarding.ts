
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function onboardingMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check for NextAuth session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                       request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // For /onboarding page, allow if user exists (even if not completed)
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    return response;
  }

  // For other protected pages, check if user has completed onboarding or has active subscription
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (userData?.status === 'onboarding_complete' || userData?.status === 'active') {
      return response;
    }
  }

  // If not completed onboarding, redirect to onboarding
  const url = request.nextUrl.clone();
  url.pathname = '/onboarding';
  return NextResponse.redirect(url);
}
