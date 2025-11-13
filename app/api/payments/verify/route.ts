import { type NextRequest, NextResponse } from "next/server";
import { FlutterwavePayment } from "@/src/payments/flutterwave";
import { createClient } from "@/utils/supabase-server";
import { logger } from "@/src/agent/utils/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transaction_id = searchParams.get("transaction_id");
  const tx_ref = searchParams.get("tx_ref");

  if (!transaction_id || !tx_ref) {
    return NextResponse.redirect(new URL("/pricing?error=Invalid callback", request.url));
  }

  try {
  const supabase = createClient();
  const flutterwave = new FlutterwavePayment();
    const result = await flutterwave.verifyPayment(transaction_id);

  if (result.status === "success") {
  const { data: transaction, error: transactionError } = await supabase
  .from('payments')
  .select('meta')
  .eq('transaction_id', tx_ref)
  .single();

  if (transactionError || !transaction) {
    logger.error({ transaction_id, tx_ref, transactionError }, "Error fetching transaction from database");
    return NextResponse.redirect(new URL("/pricing?error=Transaction not found", request.url));
  }

  const { plan_id, user_id } = transaction.meta as { plan_id: string, user_id: string };

  const { error: userError } = await supabase
  .from('users')
  .update({ subscription_tier: plan_id })
  .eq('id', user_id);

  if (userError) {
  logger.error({ user_id, plan_id, userError }, "Error updating user subscription");
  return NextResponse.redirect(new URL("/pricing?error=Subscription update failed", request.url));
  }

  logger.info({ user_id, plan_id, transaction_id }, "Payment successful and subscription updated");
  return NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
  logger.error({ transaction_id, tx_ref }, "Payment verification failed");
  return NextResponse.redirect(new URL("/pricing?error=Payment failed", request.url));
  }
  } catch (error) {
  logger.error({ error }, "Payment verification endpoint error");
  return NextResponse.redirect(new URL("/pricing?error=Internal server error", request.url));
  }
}
