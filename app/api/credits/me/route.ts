import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { CREDIT_VALUE_USD, MINIMUM_PURCHASE_CREDITS } from '@/lib/utils/credits'

export async function GET() {
  // Returns wallet balance + low balance indicator
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabaseServer
      .from('credits_wallet')
      .select('balance, auto_top_up, top_up_threshold')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const balance = Number(data?.balance ?? 0)
    return NextResponse.json({
      balance,
      lowBalance: balance < Number(data?.top_up_threshold ?? 5),
      autoTopUp: !!data?.auto_top_up,
      topUpThreshold: Number(data?.top_up_threshold ?? 5)
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load wallet' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // Initialize a purchase intent (basic validation only, Flutterwave checkout handled client-side)
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

    // Create pending payment record (to be completed by webhook)
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

    // Client should now redirect to Flutterwave checkout using its SDK
    return NextResponse.json({ success: true, payment: rec })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to init purchase' }, { status: 500 })
  }
}
