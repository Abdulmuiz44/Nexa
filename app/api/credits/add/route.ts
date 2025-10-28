import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import flw from '@/lib/flutterwaveClient';
import { creditPrices } from '@/lib/pricingConfig';

export async function POST(req: NextRequest) {
  const { amount } = await req.json(); // amount in credits
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const usdAmount = creditPrices[amount];

  if (!usdAmount) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Create payment record
  const txRef = `credit_${userId}_${Date.now()}`;
  await supabase.from('payment_history').insert({
    user_id: userId,
    amount_usd: usdAmount,
    credits_issued: amount,
    payment_provider: 'flutterwave',
    provider_ref: txRef,
    status: 'pending',
  });

  // Initiate Flutterwave payment
  const payment = await flw.Payment.create({
    tx_ref: txRef,
    amount: usdAmount,
    currency: 'USD',
    redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    customer: {
      email: session.user.email,
    },
  });

  return NextResponse.json({ paymentUrl: payment.data.link });
}
