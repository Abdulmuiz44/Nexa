import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { creditService } from "@/src/services/creditService";

interface AdjustCreditsRequest {
  target_user_id: string;
  credits: number;
  reason: string;
  adjustment_type?: 'adjust' | 'refund';
}

export async function POST(request: NextRequest) {
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

    const body: AdjustCreditsRequest = await request.json();

    if (!body.target_user_id || !body.reason || body.credits === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof body.credits !== 'number' || body.credits === 0) {
      return NextResponse.json({ error: "Credits must be a non-zero number" }, { status: 400 });
    }

    // Perform the adjustment
    await creditService.adjustUserCredits(
      session.user.id,
      body.target_user_id,
      body.credits,
      body.reason,
      body.adjustment_type || 'adjust'
    );

    // Get updated balance
    const newBalance = await creditService.getCreditBalance(body.target_user_id);

    return NextResponse.json({
      success: true,
      message: `Successfully ${body.adjustment_type === 'refund' ? 'refunded' : 'adjusted'} ${Math.abs(body.credits)} credits`,
      new_balance: newBalance,
      adjustment_type: body.adjustment_type || 'adjust'
    });
  } catch (error: any) {
    console.error("Error adjusting user credits:", error);

    if (error.message.includes('Admin access required')) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (error.message.includes('Cannot subtract more credits')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
