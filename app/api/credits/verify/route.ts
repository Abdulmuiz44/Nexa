import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { FlutterwavePayment } from '@/src/payments/flutterwave'
import { addCredits, getCreditBalance } from '@/lib/utils/credits'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const transaction_id = url.searchParams.get('transaction_id')
  const tx_ref = url.searchParams.get('tx_ref')

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!transaction_id || !tx_ref) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })

    const fw = new FlutterwavePayment()
    const result = await fw.verifyPayment(String(transaction_id))
    if (result.status !== 'success') {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    // First try to find by provider_tx_id == tx_ref for robust matching
    let { data: rec } = await supabaseServer
      .from('payment_history')
      .select('*')
      .eq('provider_tx_id', tx_ref)
      .eq('status', 'pending')
      .maybeSingle()

    if (!rec) {
      // Fallback to most recent pending for this user
      const fallback = await supabaseServer
        .from('payment_history')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('payment_provider', 'flutterwave')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      rec = fallback.data || null
    }

    let credited = 0
    let balance = await getCreditBalance(session.user.id)

    if (rec) {
      await supabaseServer
        .from('payment_history')
        .update({ status: 'paid', provider_tx_id: String(transaction_id) })
        .eq('id', rec.id)

      const credits = Number(rec.credits_issued || 0)
      if (credits > 0) {
        await addCredits(session.user.id, credits, 'credit_top_up', String(transaction_id), { tx_ref, provider: 'flutterwave' })
        credited = credits
        balance = await getCreditBalance(session.user.id)
      }
    }

    return NextResponse.json({ success: true, credited, balance })
  } catch (e: any) {
    return NextResponse.json({ error: 'Verification error' }, { status: 500 })
  }
}