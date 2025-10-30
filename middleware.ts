import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/src/middleware/rate-limit";
import { authMiddleware } from "@/src/middleware/auth";
import { subscriptionMiddleware } from "@/src/middleware/subscription";
import { onboardingMiddleware } from "@/src/middleware/onboarding";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse;
    }

    if (pathname.startsWith("/api/agent/")) {
      return authMiddleware(request);
    }

    // For other API routes, continue with the response from the rate limiter
    return rateLimitResponse;
  }

  // Protect onboarding, dashboard, chat, subscribe and pricing pages
  if (pathname.startsWith("/onboarding") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/chat") ||
      pathname.startsWith("/subscribe") ||
      pathname.startsWith("/pricing") ||
      pathname.startsWith("/docs")) {

    const onboardingResponse = await onboardingMiddleware(request);
    if (onboardingResponse.status !== 200) {
      return onboardingResponse;
    }

    // Role-based access for dashboard sections
    if (pathname.startsWith("/dashboard")) {
      return subscriptionMiddleware(request);
    }
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
    "/pricing/:path*"
  ],
};
