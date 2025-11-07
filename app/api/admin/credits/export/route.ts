import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'

function isAdmin(email?: string | null) {
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (!email) return false
  return allow.includes(email.toLowerCase())
}

function toMonthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0))
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || new Date().toISOString().slice(0,7)
    const format = (searchParams.get('format') || 'json').toLowerCase()
    const { start, end } = toMonthRange(month)

    const { data, error } = await supabaseServer
      .from('credit_transactions')
      .select('created_at, user_id, tx_type, credits, description, metadata')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('export query error', error)
      return NextResponse.json({ error: 'Failed to export usage' }, { status: 500 })
    }

    if (format === 'csv') {
      const headers = ['created_at','user_id','tx_type','credits','description','total_tokens','openai_model']
      const rows = (data || []).map(r => [
        r.created_at,
        r.user_id,
        r.tx_type,
        r.credits,
        (r.description || ''),
        (r.metadata?.total_tokens ?? ''),
        (r.metadata?.model ?? ''),
      ].map(v => (v === null || v === undefined) ? '' : String(v).replace(/\r|\n|"/g, ' ').trim()))
      const csv = [headers.join(','), ...rows.map(row => row.map(v => `"${v}"`).join(','))].join('\n')
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } })
    }

    return NextResponse.json({ month, items: data || [] })
  } catch (e: any) {
    console.error('admin export error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
