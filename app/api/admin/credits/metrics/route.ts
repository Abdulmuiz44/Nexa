import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { CREDIT_VALUE_USD, TOKENS_PER_CREDIT, MODEL_COST_PER_MILLION, costPerCreditUSD } from '@/lib/utils/credits'

function isAdmin(email?: string | null) {
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (!email) return false
  return allow.includes(email.toLowerCase())
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseServer
      .from('credit_transactions')
      .select('tx_type, credits, metadata')

    if (error) {
      console.error('Metrics query error', error)
      return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
    }

    let totalPurchased = 0
    let totalSpent = 0
    let totalTokens = 0

    for (const row of data || []) {
      if (row.tx_type === 'purchase') totalPurchased += Number(row.credits || 0)
      if (row.tx_type === 'spend') totalSpent += Math.abs(Number(row.credits || 0))
      const t = Number((row.metadata || {})?.total_tokens || 0)
      if (!Number.isNaN(t)) totalTokens += t
    }

    const revenueUSD = totalPurchased * CREDIT_VALUE_USD
    const costPerCredit = costPerCreditUSD(TOKENS_PER_CREDIT, MODEL_COST_PER_MILLION)
    const costUSD = totalSpent * costPerCredit
    const profitUSD = revenueUSD - costUSD

    return NextResponse.json({
      totals: {
        credits: { purchased: totalPurchased, spent: totalSpent },
        tokens: { total: totalTokens },
        revenueUSD,
        costUSD,
        profitUSD,
      },
      pricing: {
        CREDIT_VALUE_USD,
        TOKENS_PER_CREDIT,
        MODEL_COST_PER_MILLION,
        costPerCreditUSD: costPerCredit,
      }
    })
  } catch (e: any) {
    console.error('admin metrics error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
