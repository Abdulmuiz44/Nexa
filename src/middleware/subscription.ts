import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function subscriptionMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get the JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check subscription tier
  const subscriptionTier = token.subscriptionTier as string;

  // If user doesn't have a paid subscription, redirect to pricing
  if (!subscriptionTier || subscriptionTier === 'free') {
    const url = request.nextUrl.clone();
    url.pathname = '/pricing';
    return NextResponse.redirect(url);
  }

  return response;
}
