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

  // Protect dashboard, subscribe and pricing pages
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/subscribe") || pathname.startsWith("/pricing")) {
    const onboardingResponse = await onboardingMiddleware(request);
    if (onboardingResponse.status !== 200) {
      return onboardingResponse;
    }

    if (pathname.startsWith("/dashboard")) {
      return subscriptionMiddleware(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/subscribe/:path*", "/pricing/:path*"],
};
