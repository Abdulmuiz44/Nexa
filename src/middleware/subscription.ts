import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function subscriptionMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get the JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Allow free users to access dashboard; gate only specific premium routes if needed
  // Currently, we do not enforce a redirect for 'free' tier here to avoid blocking onboarding flow to chat
  return response;
}
