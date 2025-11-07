import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const sp = url.searchParams
    const status = sp.get('status') || undefined
    const from = sp.get('from') || undefined
    const to = sp.get('to') || undefined
    const limit = sp.get('limit') ? Math.max(0, parseInt(sp.get('limit') as string, 10)) : 100
    const offset = sp.get('offset') ? Math.max(0, parseInt(sp.get('offset') as string, 10)) : 0
    const countOnly = ['1','true'].includes((sp.get('countOnly') || '').toLowerCase())

    // Count-only mode (fast head request)
    if (countOnly) {
      let cq = supabaseServer
        .from('scheduled_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (status) cq = cq.eq('status', status)
      if (from) cq = cq.gte('scheduled_at', from)
      if (to) cq = cq.lte('scheduled_at', to)

      const { count, error } = await cq
      if (error) return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
      return NextResponse.json({ count: count || 0 })
    }

    // Data query
    let q = supabaseServer
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', userId)

    if (status) q = q.eq('status', status)
    if (from) q = q.gte('scheduled_at', from)
    if (to) q = q.lte('scheduled_at', to)

    q = q.order('scheduled_at', { ascending: true })

    if (limit > 0) {
      q = q.range(offset, offset + limit - 1)
    }

    const { data, error } = await q
    if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

    return NextResponse.json({ scheduled_posts: data || [], limit, offset })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
