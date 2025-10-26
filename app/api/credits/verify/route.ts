import { type NextRequest, NextResponse } from "next/server";
import { FlutterwavePayment } from "@/src/payments/flutterwave";
import { supabase } from "@/lib/db";
import { logger } from "@/src/agent/utils/logger";
import { creditService } from "@/src/services/creditService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transaction_id = searchParams.get("transaction_id");
  const tx_ref = searchParams.get("tx_ref");

  if (!transaction_id || !tx_ref) {
    return NextResponse.redirect(new URL("/dashboard?error=Invalid callback", request.url));
  }

  try {
    const flutterwave = new FlutterwavePayment();
    const result = await flutterwave.verifyPayment(transaction_id);

    if (result.status === "success") {
      // Get transaction details from Flutterwave response
      const transactionData = result.data;

      if (!transactionData) {
        logger.error("No transaction data in Flutterwave response", { transaction_id, tx_ref });
        return NextResponse.redirect(new URL("/dashboard?error=Transaction data missing", request.url));
      }

      // Extract user_id and credits from transaction metadata
      // Note: In a real implementation, you'd store this in the payment initialization
      // For now, we'll need to extract from the transaction reference or metadata

      // Assuming the tx_ref contains user info or we need to look it up
      // This is a simplified version - in production you'd store payment intent data

      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .select('meta')
        .eq('transaction_id', tx_ref)
        .single();

      if (paymentError || !paymentRecord) {
        logger.error("Payment record not found", { transaction_id, tx_ref, paymentError });

        // Try to extract from transaction metadata (if Flutterwave provides it)
        // For now, redirect with success but log the issue
        logger.info("Credit purchase successful but payment record not found - manual processing may be needed", {
          transaction_id,
          tx_ref,
          amount: transactionData.amount,
          currency: transactionData.currency
        });

        return NextResponse.redirect(new URL("/dashboard?message=Payment successful - credits processing", request.url));
      }

      const { user_id, credits, amount } = paymentRecord.meta as {
        user_id: string;
        credits: number;
        amount: number;
      };

      // Process the credit top-up
      await creditService.processCreditTopUp(
        user_id,
        amount,
        credits,
        'flutterwave',
        transaction_id,
        {
          transaction_ref: tx_ref,
          flutterwave_data: transactionData
        }
      );

      logger.info("Credit purchase successful and credits added", {
        user_id,
        credits,
        amount,
        transaction_id
      });

      return NextResponse.redirect(new URL("/dashboard?message=Credits purchased successfully", request.url));
    } else {
      logger.error("Credit purchase verification failed", { transaction_id, tx_ref });
      return NextResponse.redirect(new URL("/dashboard?error=Payment verification failed", request.url));
    }
  } catch (error) {
    logger.error("Credit purchase verification endpoint error", { error });
    return NextResponse.redirect(new URL("/dashboard?error=Internal server error", request.url));
  }
}
