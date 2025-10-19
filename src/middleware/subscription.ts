import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function subscriptionMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    const url = request.nextUrl.clone();
    url.pathname = '/pricing';
    url.searchParams.set('error', 'user_not_found');
    return NextResponse.redirect(url);
  }

  if (userData.subscription_tier === 'free') {
    const url = request.nextUrl.clone();
    url.pathname = '/pricing';
    return NextResponse.redirect(url);
  }

  return response;
}
