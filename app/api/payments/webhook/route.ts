import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/src/lib/supabaseServer"
import { FlutterwavePayment } from "@/src/payments/flutterwave"
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  const signature = request.headers.get('verif-hash');

  if (!signature || (signature !== secretHash)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();

    if (payload.status === 'successful') {
      const tx_ref = payload.tx_ref;
      const parts = tx_ref.split('_');
      const userId = parts[1];
      const planId = parts[2] || 'growth'; // Default to growth if not specified

      const flutterwave = new FlutterwavePayment();
      const verificationResult = await flutterwave.verifyPayment(payload.id.toString());

      if (verificationResult.status === 'success') {
        // Update user status
        const { error: userError } = await supabaseServer
          .from('users')
          .update({ status: 'active' })
          .eq('id', userId);

        if (userError) {
          console.error('Webhook: Error updating user', userError);
        }

        // Create subscription
        const { error: subError } = await supabaseServer
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan: planId,
            amount: payload.amount,
            currency: payload.currency,
            flutterwave_subscription_id: payload.id.toString(),
          });

        if (subError) {
          console.error('Webhook: Error creating subscription', subError);
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}