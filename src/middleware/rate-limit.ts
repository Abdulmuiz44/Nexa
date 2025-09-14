import { RateLimiterMemory } from "rate-limiter-flexible"
import { type NextRequest, NextResponse } from "next/server"

const rateLimiter = new RateLimiterMemory({
  keyPrefix: "middleware",
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
})

export async function rateLimitMiddleware(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "127.0.0.1"
    await rateLimiter.consume(ip)
    return NextResponse.next()
  } catch (rejRes) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }
}
