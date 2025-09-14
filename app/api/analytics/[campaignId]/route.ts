import { type NextRequest, NextResponse } from "next/server"
import { analyticsTracker } from "@/src/analytics/tracker"
import { logger } from "@/src/agent/utils/logger"

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const { campaignId } = params
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined

    const report = await analyticsTracker.generateReport(campaignId, startDate, endDate)

    if (report) {
      return NextResponse.json(report)
    } else {
      return NextResponse.json({ error: "Failed to generate analytics report" }, { status: 500 })
    }
  } catch (error) {
    logger.error("Analytics API error", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
