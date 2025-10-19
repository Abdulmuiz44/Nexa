import type { NextRequest } from "next/server"
import { rateLimitMiddleware } from "@/src/middleware/rate-limit"
import { authMiddleware } from "@/src/middleware/auth"

export async function middleware(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse
  }

  if (request.nextUrl.pathname.startsWith("/api/agent/")) {
    return authMiddleware(request)
  }

  return rateLimitResponse
}

export const config = {
  matcher: ["/api/:path*"],
}
