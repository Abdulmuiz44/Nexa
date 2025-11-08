import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseServer
      .from('payment_history')
      .select('id, created_at, status, credits_issued, payment_provider')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ transactions: [] })

    const transactions = (data || []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      tx_type: r.status,
      credits: Number(r.credits_issued ?? 0),
      description: r.payment_provider || 'flutterwave',
    }))

    return NextResponse.json({ transactions })
  } catch (e: any) {
    return NextResponse.json({ transactions: [] })
  }
}
