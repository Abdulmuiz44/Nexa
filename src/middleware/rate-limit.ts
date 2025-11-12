import { type NextRequest, NextResponse } from "next/server"

type RateLimiterEntry = {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS = 100
const rateLimiterStore = new Map<string, RateLimiterEntry>()

function canProceed(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimiterStore.get(ip)

  if (!entry || entry.resetAt <= now) {
    rateLimiterStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count < MAX_REQUESTS) {
    entry.count += 1
    return true
  }

  return false
}

export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "127.0.0.1"

  if (canProceed(ip)) {
    return NextResponse.next()
  }

  return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
}
