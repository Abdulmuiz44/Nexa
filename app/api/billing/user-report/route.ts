import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { billingService } from "@/src/services/billingService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Try to get existing report first
    let report = await billingService.getUserLatestReport(userId);

    // If no report exists or it's old, generate a new one
    if (!report) {
      console.log(`Generating new billing report for user ${userId}`);
      const summary = await billingService.generateUserReport(userId);
      report = await billingService.getUserLatestReport(userId);
    }

    if (!report) {
      return NextResponse.json({
        error: "Failed to generate or retrieve billing report"
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        period_start: report.period_start,
        period_end: report.period_end,
        summary: report.report_json,
        generated_at: report.generated_at,
        email_sent: report.email_sent
      }
    });
  } catch (error: any) {
    console.error("Error fetching user billing report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
