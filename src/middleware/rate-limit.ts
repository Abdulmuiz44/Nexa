import { type NextRequest, NextResponse } from "next/server"

type RateLimiterEntry = {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS = 100
const rateLimiterStore = new Map<string, RateLimiterEntry>()

function getClientIp(request: NextRequest): string {
  const directIp = (request as NextRequest & { ip?: string }).ip
  if (directIp) {
    return directIp
  }

  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",").map((segment) => segment.trim())
    if (firstIp) {
      return firstIp
    }
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return "127.0.0.1"
}

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
  const ip = getClientIp(request)

  if (canProceed(ip)) {
    return NextResponse.next()
  }

  return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
}
