import { type NextRequest, NextResponse } from "next/server";
import { billingService } from "@/src/services/billingService";

// This endpoint should be called by a cron job on the 1st of every month
// Example cron: 0 0 1 * * (runs at midnight on the 1st of every month)
export async function POST(request: NextRequest) {
  try {
    // Basic authentication check (you should use proper auth for production)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Starting monthly billing report generation...');

    const result = await billingService.generateMonthlyReports();

    console.log(`Monthly reports generated: ${result.usersProcessed} users processed, ${result.errors.length} errors`);

    if (result.errors.length > 0) {
      console.error('Errors during report generation:', result.errors);
    }

    // Send email notifications
    const emailResult = await billingService.sendMonthlyEmailNotifications();
    console.log(`Email notifications sent: ${emailResult.userEmailsSent} user emails, ${emailResult.adminEmailsSent} admin emails`);

    return NextResponse.json({
      success: true,
      reports_generated: result.usersProcessed,
      admin_report: result.adminReportGenerated,
      errors: result.errors,
      emails_sent: {
        users: emailResult.userEmailsSent,
        admins: emailResult.adminEmailsSent
      }
    });
  } catch (error: any) {
    console.error('Critical error in monthly report generation:', error);
    return NextResponse.json({
      error: "Internal server error",
      details: error.message
    }, { status: 500 });
  }
}

// Allow GET requests for testing (should be removed in production)
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  return POST(request);
}
