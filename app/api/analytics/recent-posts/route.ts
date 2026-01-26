import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 25)

    const { data: posts, error } = await supabaseServer
      .from('posts')
      .select('id, platform, content, published_at, platform_post_url, status, analytics:analytics(*)')
      .eq('user_id', session.user.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Recent posts fetch error:', error)
      return NextResponse.json({ error: 'Failed to load recent posts' }, { status: 500 })
    }

    const items = (posts || []).map((p: any) => {
      const a = Array.isArray(p.analytics) ? p.analytics : []
      const latest = a.sort((x: any, y: any) =>
        new Date(y.fetched_at).getTime() - new Date(x.fetched_at).getTime()
      )[0] || {}

      const metrics = {
        impressions: latest.impressions || 0,
        engagements: latest.engagements || 0,
        likes: latest.likes || 0,
        comments: latest.comments || 0,
        shares: latest.shares || 0,
        clicks: latest.clicks || 0
      }

      return {
        id: p.id,
        platform: p.platform,
        content: p.content,
        published_at: p.published_at,
        url: p.platform_post_url,
        metrics: metrics,
      }
    })

    return NextResponse.json({ posts: items })
  } catch (error: unknown) {
    console.error('Recent posts error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to load recent posts',
    }, { status: 500 })
  }
}
