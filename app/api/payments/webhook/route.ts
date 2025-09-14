import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/src/agent/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("verif-hash")

    if (!signature) {
      logger.warn("Webhook received without signature")
      return NextResponse.json({ error: "No signature provided" }, { status: 400 })
    }

    // Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || ""
    if (signature !== secretHash) {
      logger.warn("Invalid webhook signature", { signature })
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const payload = JSON.parse(body)

    logger.info("Webhook received", {
      event: payload.event,
      txRef: payload.data?.tx_ref,
      status: payload.data?.status,
    })

    // Handle different webhook events
    switch (payload.event) {
      case "charge.completed":
        if (payload.data.status === "successful") {
          const campaignId = payload.data.meta?.campaign_id
          if (campaignId) {
            // Update campaign payment status
            logger.info("Payment completed for campaign", {
              campaignId,
              amount: payload.data.amount,
              currency: payload.data.currency,
            })

            // Here you would update your database
            // await updateCampaignPaymentStatus(campaignId, 'paid')
            // await startCampaign(campaignId)
          }
        }
        break

      case "charge.failed":
        logger.warn("Payment failed", {
          txRef: payload.data.tx_ref,
          reason: payload.data.processor_response,
        })
        break

      default:
        logger.info("Unhandled webhook event", { event: payload.event })
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    logger.error("Webhook processing error", { error })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
