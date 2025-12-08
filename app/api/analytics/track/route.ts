import { type NextRequest, NextResponse } from "next/server"
import { analyticsTracker, type AnalyticsEvent } from "@/src/analytics/tracker"
import { logger } from "@/src/agent/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json()

    // Validate required fields
    if (!event.event) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 })
    }

    await analyticsTracker.trackEvent(event)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Analytics tracking API error')
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
