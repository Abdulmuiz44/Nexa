import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/src/middleware/rate-limit";
import { subscriptionMiddleware } from "@/src/middleware/subscription";
import { onboardingMiddleware } from "@/src/middleware/onboarding";
import { verifyAuthToken } from "@/src/middleware/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }

    if (pathname.startsWith("/api/agent/")) {
      return verifyAuthToken(request);
    }

    // For other API routes, continue with the response from the rate limiter
    return rateLimitResponse;
  }

  // Protect onboarding, chat, subscribe and pricing pages
  if (pathname.startsWith("/onboarding") ||
  pathname.startsWith("/chat") ||
  pathname.startsWith("/subscribe") ||
  pathname.startsWith("/pricing") ||
  pathname.startsWith("/docs")) {

    const onboardingResponse = await onboardingMiddleware(request);
  if (onboardingResponse.status !== 200) {
    return onboardingResponse;
  }
  }

  // Protect dashboard pages (let dashboard layout handle auth)
  if (pathname.startsWith("/dashboard")) {
  // Only check subscription for dashboard
  return subscriptionMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/chat/:path*",
    "/docs/:path*",
    "/api/:path*",
    "/subscribe/:path*",
    "/pricing/:path*",
  ],
};
