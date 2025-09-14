import { type NextRequest, NextResponse } from "next/server"
import { FlutterwavePayment } from "@/src/payments/flutterwave"
import { logger } from "@/src/agent/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    const flutterwave = new FlutterwavePayment()
    const result = await flutterwave.verifyPayment(transactionId)

    if (result.status === "success") {
      logger.info("Payment verification successful", { transactionId })

      // Here you would typically update the campaign status in your database
      // await updateCampaignPaymentStatus(campaignId, 'paid')

      return NextResponse.json(result)
    } else {
      logger.warn("Payment verification failed", { transactionId, error: result.message })
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    logger.error("Payment verification endpoint error", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
