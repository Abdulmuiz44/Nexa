import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { billingService } from "@/src/services/billingService";
import { creditService } from "@/src/services/creditService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await creditService.isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Try to get existing admin report first
    let report = await billingService.getAdminLatestReport();

    // If no report exists or it's old, generate a new one
    if (!report) {
      console.log('Generating new admin billing report');
      const summary = await billingService.generateAdminReport();
      report = await billingService.getAdminLatestReport();
    }

    if (!report) {
      return NextResponse.json({
        error: "Failed to generate or retrieve admin billing report"
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
    console.error("Error fetching admin billing report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
