import { type NextRequest, NextResponse } from "next/server";
import { FlutterwavePayment } from "@/src/payments/flutterwave";
import { logger } from "@/src/agent/utils/logger";
import { creditService } from "@/src/services/creditService";

interface CreditPurchaseData {
  credits: number;
  amount: number;
  currency: string;
  email: string;
  name: string;
  user_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreditPurchaseData = await request.json();

    // Validate required fields
    if (!body.credits || !body.amount || !body.currency || !body.email || !body.name || !body.user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    // Validate credits
    if (body.credits <= 0) {
      return NextResponse.json({ error: "Credits must be greater than 0" }, { status: 400 });
    }

    // Prepare payment data for Flutterwave
    const paymentData = {
      amount: body.amount,
      currency: body.currency,
      email: body.email,
      name: body.name,
      user_id: body.user_id,
      credits: body.credits,
      // Use a custom redirect URL for credits
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/credits/verify`,
    };

    const flutterwave = new FlutterwavePayment();
    const result = await flutterwave.initializePayment(paymentData);

    if (result.status === "success") {
      logger.info("Credit purchase initialization successful", {
        userId: body.user_id,
        credits: body.credits,
        amount: body.amount,
        reference: result.data?.reference,
      });

      return NextResponse.json(result);
    } else {
      logger.error("Credit purchase initialization failed", {
        userId: body.user_id,
        credits: body.credits,
        error: result.message,
      });

      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    logger.error("Credit purchase initialization endpoint error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
