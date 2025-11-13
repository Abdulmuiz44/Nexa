import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { post_to_platform } from '@/src/services/postToPlatform'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { platform, content, media_url } = body as { platform: 'twitter' | 'reddit'; content: string; media_url?: string }

    if (!platform || !content) {
      return NextResponse.json({ error: 'Missing platform or content' }, { status: 400 })
    }

    // Create an audit row in scheduled_posts for traceability, then immediately post
    const { data: sched } = await supabaseServer
      .from('scheduled_posts')
      .insert({ user_id: userId, platform, content, media_url: media_url || null, status: 'pending', scheduled_at: new Date().toISOString() })
      .select('*')
      .single()

    const result = await post_to_platform({ platform, userId, content, mediaUrl: media_url })

    if (result.success) {
      await supabaseServer
        .from('scheduled_posts')
        .update({ status: 'posted', posted_at: new Date().toISOString(), error_message: null })
        .eq('id', sched?.id)

      // Mirror to posts table (for analytics/history)
      await supabaseServer
        .from('posts')
        .insert({
          user_id: userId,
          platform,
          content,
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: result.platformPostId,
          platform_post_url: result.platformPostUrl,
          metadata: { source: 'post_now', scheduled_post_id: sched?.id },
        })

      return NextResponse.json({ success: true, result })
    }

    await supabaseServer
      .from('scheduled_posts')
      .update({ status: 'failed', error_message: result.error || 'Failed to post' })
      .eq('id', sched?.id)

    return NextResponse.json({ error: result.error || 'Failed to post' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
