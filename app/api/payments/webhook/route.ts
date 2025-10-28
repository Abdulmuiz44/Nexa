import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import flw from '@/lib/flutterwaveClient';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verify webhook
  const secretHash = req.headers.get('verif-hash');
  if (secretHash !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (body.event === 'charge.completed' && body.data.status === 'successful') {
    const { tx_ref, amount, customer } = body.data;

    // Find payment_history entry
    const { data: payment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('provider_ref', tx_ref)
      .single();

    if (payment && payment.status === 'pending') {
      // Update payment status
      await supabase
        .from('payment_history')
        .update({ status: 'completed' })
        .eq('id', payment.id);

      // Add credits
      const credits = payment.credits_issued;
      await supabase
        .from('credits_wallet')
        .update({ balance: supabase.raw('balance + ?', [credits]), total_purchased: supabase.raw('total_purchased + ?', [credits]) })
        .eq('user_id', payment.user_id);

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: payment.user_id,
        tx_type: 'purchase',
        credits,
        description: 'Credit top-up',
      });
    }
  }

  return NextResponse.json({ status: 'ok' });
}
