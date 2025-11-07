import { NextResponse } from 'next/server'
import { supabaseServer } from '@/src/lib/supabaseServer'
import crypto from 'crypto'
import { addCredits } from '@/lib/utils/credits'

// Flutterwave webhook endpoint (set FLUTTERWAVE_SECRET for signature verification)
export async function POST(req: Request) {
  try {
    const signature = req.headers.get('verif-hash') || ''
    const secret = process.env.FLUTTERWAVE_SECRET || ''

    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const bodyText = await req.text()
    if (signature !== secret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(bodyText)
    const status = payload?.data?.status
    const txRef = payload?.data?.tx_ref || payload?.data?.id
    const amountUSD = Number(payload?.data?.amount || 0)
    const userId = payload?.data?.meta?.user_id

    if (status !== 'successful' || !userId || !amountUSD) {
      return NextResponse.json({ ok: true })
    }

    // Locate pending payment record
    const { data: rec } = await supabaseServer
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Upsert payment history
    await supabaseServer
      .from('payment_history')
      .upsert({
        id: rec?.id,
        user_id: userId,
        amount_usd: amountUSD,
        credits_issued: Math.floor((amountUSD / 0.10) * 10000) / 10000,
        payment_provider: 'flutterwave',
        provider_ref: String(txRef),
        status: 'completed',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    const credits = Math.floor((amountUSD / 0.10) * 10000) / 10000
    await addCredits(userId, credits, 'flutterwave_top_up', null, { provider: 'flutterwave', tx_ref: txRef, amount_usd: amountUSD })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('flutterwave webhook error', e)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
