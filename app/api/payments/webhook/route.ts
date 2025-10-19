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
      const userId = tx_ref.split('_')[1]; // tx_ref is nexa_<user_id>_<timestamp>

      const flutterwave = new FlutterwavePayment();
      const verificationResult = await flutterwave.verifyPayment(payload.id.toString());

      if (verificationResult.status === 'success') {
        const { error: updateError } = await supabaseServer
          .from('users')
          .update({ status: 'active', subscription_tier: 'standard' })
          .eq('id', userId);

        if (updateError) {
          console.error('Webhook: Error updating user', updateError);
          // Still return 200 to acknowledge webhook receipt
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}