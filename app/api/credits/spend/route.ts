import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { creditService, CreditService } from "@/src/services/creditService";

interface SpendCreditsRequest {
  operation: keyof typeof CreditService.CREDIT_COSTS;
  referenceId?: string;
  customDescription?: string;
  operationType?: string;
  operationId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body: SpendCreditsRequest = await request.json();

    if (!body.operation) {
      return NextResponse.json({ error: "Operation is required" }, { status: 400 });
    }

    // Get the cost for this operation
    const creditsRequired = creditService.getCostForOperation(body.operation);

    if (!creditsRequired) {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }

    // Check if user has sufficient credits
    const hasCredits = await creditService.hasSufficientCredits(userId, creditsRequired);

    if (!hasCredits) {
      return NextResponse.json({
        error: "Insufficient credits",
        required: creditsRequired,
        success: false
      }, { status: 400 });
    }

    // Spend the credits
    const description = body.customDescription || `${body.operation.replace(/_/g, ' ')} - ${creditsRequired} credits`;

    await creditService.spendCreditsWithTracking(
      userId,
      creditsRequired,
      description,
      body.operationType || body.operation,
      body.operationId,
      body.referenceId
    );

    // Get updated balance
    const newBalance = await creditService.getCreditBalance(userId);

    return NextResponse.json({
      success: true,
      creditsSpent: creditsRequired,
      newBalance,
      operation: body.operation
    });
  } catch (error) {
    console.error("Error spending credits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
