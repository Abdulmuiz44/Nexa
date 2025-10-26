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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let result = await creditService.getAllUsersWithCredits(limit, offset);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      result.users = result.users.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: result.users,
      total: result.total,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
