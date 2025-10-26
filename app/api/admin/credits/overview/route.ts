import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
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

    const overview = await creditService.getAdminCreditOverview();

    return NextResponse.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error("Error fetching admin credit overview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
