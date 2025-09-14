import { type NextRequest, NextResponse } from "next/server"
import { FlutterwavePayment, type PaymentData } from "@/src/payments/flutterwave"
import { logger } from "@/src/agent/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const body: PaymentData = await request.json()

    // Validate required fields
    if (!body.amount || !body.currency || !body.email || !body.name || !body.campaignId) {
      return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    const flutterwave = new FlutterwavePayment()
    const result = await flutterwave.initializePayment(body)

    if (result.status === "success") {
      logger.info("Payment initialization successful", {
        campaignId: body.campaignId,
        amount: body.amount,
        reference: result.data?.reference,
      })

      return NextResponse.json(result)
    } else {
      logger.error("Payment initialization failed", {
        campaignId: body.campaignId,
        error: result.message,
      })

      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    logger.error("Payment initialization endpoint error", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
