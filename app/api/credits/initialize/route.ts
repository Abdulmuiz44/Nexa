import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { CREDIT_VALUE_USD, MINIMUM_PURCHASE_CREDITS } from '@/lib/utils/credits'
import { FlutterwavePayment } from '@/src/payments/flutterwave'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amountUSD } = await req.json()
    const amt = Number(amountUSD)
    if (!amt || amt <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const minUSD = MINIMUM_PURCHASE_CREDITS * CREDIT_VALUE_USD
    if (amt < minUSD) {
      return NextResponse.json({ error: `Minimum purchase is $${minUSD.toFixed(2)} (${MINIMUM_PURCHASE_CREDITS} credits)` }, { status: 400 })
    }

    const credits = Math.floor((amt / CREDIT_VALUE_USD) * 10000) / 10000

    // Create pending payment record for reconciliation
    const { data: rec, error } = await supabaseServer
      .from('payment_history')
      .insert({
        user_id: session.user.id,
        amount_usd: amt,
        credits_issued: credits,
        payment_provider: 'flutterwave',
        status: 'pending',
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to init payment' }, { status: 500 })

    const fw = new FlutterwavePayment()
    const init = await fw.initializePayment({
      amount: amt,
      currency: 'USD',
      email: session.user.email || 'user@example.com',
      name: session.user.name || 'User',
      campaignId: session.user.id,
      planId: 'credits',
    })

    if (init.status === 'success') {
      // Store tx_ref on the pending record for robust matching later
      const txRef = String(init.data?.reference || '')
      if (txRef) {
        await supabaseServer
          .from('payment_history')
          .update({ provider_tx_id: txRef })
          .eq('id', rec.id)
      }
      return NextResponse.json({ link: init.data?.link, reference: txRef })
    }

    return NextResponse.json({ error: init.message || 'Failed to initialize payment' }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
  }
}
