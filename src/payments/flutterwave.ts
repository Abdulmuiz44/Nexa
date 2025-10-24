import { logger } from "../agent/utils/logger"

export interface PaymentData {
  amount: number
  currency: string
  email: string
  name: string
  phone?: string
  campaignId: string
  planId: string
}

export interface PaymentResponse {
  status: "success" | "error"
  data?: any
  message?: string
}

export class FlutterwavePayment {
  private secretKey: string
  private publicKey: string
  private baseUrl: string

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || ""
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || ""
    this.baseUrl = "https://api.flutterwave.com/v3"

    if (!this.secretKey || !this.publicKey) {
      throw new Error("Flutterwave API keys not configured")
    }
  }

  async initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const payload = {
        tx_ref: `nexa_${paymentData.campaignId}_${paymentData.planId}_${Date.now()}`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        customer: {
          email: paymentData.email,
          name: paymentData.name,
          phonenumber: paymentData.phone,
        },
        customizations: {
          title: "Nexa AI Campaign Payment",
          description: `Payment for campaign: ${paymentData.campaignId}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
        },
        meta: {
          campaign_id: paymentData.campaignId,
          plan_id: paymentData.planId,
        },
      }

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.status === "success") {
        logger.info("Payment initialized successfully", {
          reference: result.data.tx_ref,
          campaignId: paymentData.campaignId,
        })

        return {
          status: "success",
          data: {
            link: result.data.link,
            reference: result.data.tx_ref,
          },
        }
      } else {
        logger.error("Payment initialization failed", { error: result })
        return {
          status: "error",
          message: result.message || "Payment initialization failed",
        }
      }
    } catch (error) {
      logger.error("Payment initialization error", { error })
      return {
        status: "error",
        message: "Internal payment error",
      }
    }
  }

  async verifyPayment(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.status === "success" && result.data.status === "successful") {
        logger.info("Payment verified successfully", {
          transactionId,
          amount: result.data.amount,
          currency: result.data.currency,
        })

        return {
          status: "success",
          data: result.data,
        }
      } else {
        logger.warn("Payment verification failed", { transactionId, result })
        return {
          status: "error",
          message: "Payment verification failed",
        }
      }
    } catch (error) {
      logger.error("Payment verification error", { error, transactionId })
      return {
        status: "error",
        message: "Payment verification error",
      }
    }
  }

  async getPaymentStatus(reference: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions?tx_ref=${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.status === "success" && result.data.length > 0) {
        const transaction = result.data[0]
        return {
          status: "success",
          data: {
            reference: transaction.tx_ref,
            link: transaction.status,
          },
        }
      } else {
        return {
          status: "error",
          message: "Transaction not found",
        }
      }
    } catch (error) {
      logger.error("Get payment status error", { error, reference })
      return {
        status: "error",
        message: "Failed to get payment status",
      }
    }
  }
}
