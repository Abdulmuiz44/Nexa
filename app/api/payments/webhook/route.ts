import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/src/lib/supabaseServer"
import { FlutterwavePayment } from "@/src/payments/flutterwave"
import { addCredits } from "@/lib/utils/credits"

export async function POST(request: NextRequest) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  const signature = request.headers.get('verif-hash');

  if (!signature || (signature !== secretHash)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();

    // Expect payload to include: status, id (transaction id), tx_ref, amount, currency
    if (payload.status === 'successful' && payload.tx_ref && payload.id) {
      const tx_ref: string = payload.tx_ref;
      const parts = tx_ref.split('_'); // nexa_<userId>_<planId>_<ts>
      const userId = parts[1];
      const planId = parts[2] || 'credits';

      const flutterwave = new FlutterwavePayment();
      const verificationResult = await flutterwave.verifyPayment(String(payload.id));

      if (verificationResult.status === 'success' && userId) {
        if (planId === 'credits') {
          // Find most recent pending credit payment for this user
          const { data: rec, error: recErr } = await supabaseServer
            .from('payment_history')
            .select('*')
            .eq('user_id', userId)
            .eq('payment_provider', 'flutterwave')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!recErr && rec) {
            // Mark as paid
            await supabaseServer
              .from('payment_history')
              .update({ status: 'paid', provider_tx_id: String(payload.id) })
              .eq('id', rec.id);

            // Credit the wallet by credits_issued
            const credits = Number(rec.credits_issued || 0);
            if (credits > 0) {
              try {
                await addCredits(userId, credits, 'credit_top_up', String(payload.id), { tx_ref, provider: 'flutterwave' });
              } catch (e) {
                // If RPC not available, fallback to direct update as a safeguard
                await supabaseServer.rpc('ensure_user_wallet', { p_user_id: userId });
                await supabaseServer
                  .from('credits_wallet')
                  .update({ balance: (Number((await supabaseServer
                    .from('credits_wallet')
                    .select('balance')
                    .eq('user_id', userId)
                    .maybeSingle()).data?.balance ?? 0) + credits) })
                  .eq('user_id', userId);
              }
            }
          }
        } else {
          // Subscription flow (legacy)
          await supabaseServer
            .from('users')
            .update({ status: 'active', subscription_tier: planId })
            .eq('id', userId);

          await supabaseServer
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan: planId,
              amount: payload.amount,
              currency: payload.currency,
              flutterwave_subscription_id: String(payload.id),
            });
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
