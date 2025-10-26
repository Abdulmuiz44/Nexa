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

    const userId = session.user.id;

    // Get credit balance and recent transactions
    const [balance, transactions] = await Promise.all([
      creditService.getCreditBalance(userId),
      creditService.getCreditTransactions(userId, 20)
    ]);

    return NextResponse.json({
      balance,
      transactions,
      success: true
    });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
