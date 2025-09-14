import type { NextRequest } from "next/server"
import { rateLimitMiddleware } from "@/src/middleware/rate-limit"
import { authMiddleware } from "@/src/middleware/auth"

export async function middleware(request: NextRequest) {
  // Apply rate limiting to all API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimitResponse = await rateLimitMiddleware(request)
    if (rateLimitResponse.status !== 200) {
      return rateLimitResponse
    }
  }

  // Apply auth middleware to protected routes
  if (request.nextUrl.pathname.startsWith("/api/agent/")) {
    return authMiddleware(request)
  }

  return
}

export const config = {
  matcher: ["/api/:path*"],
}
