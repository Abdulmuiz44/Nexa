import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseServer
      .from('composio_connections')
      .select('id, toolkit_slug, composio_connection_id, meta')
      .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })

    return NextResponse.json({ connections: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}