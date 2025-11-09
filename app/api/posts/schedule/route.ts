import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { platform, content, scheduled_at, media_url } = body as { platform: 'twitter' | 'reddit'; content: string; scheduled_at: string; media_url?: string }

    if (!platform || !content || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const when = new Date(scheduled_at)
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled_at' }, { status: 400 })
    }

    // Create DB row
    const { data, error } = await supabaseServer
      .from('scheduled_posts')
      .insert({
        user_id: userId,
        platform,
        content,
        media_url: media_url || null,
        status: 'pending',
        scheduled_at: when.toISOString(),
      })
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
    }

    // Enqueue job (lazy import so dev without Redis doesn't crash)
    try {
      const { scheduledPostsQueue } = await import('@/src/queue/scheduledPosts')
      const delay = Math.max(0, when.getTime() - Date.now())
      await scheduledPostsQueue.add('executeScheduledPost', { scheduledPostId: data.id }, { delay, jobId: data.id })
    } catch (e) {
      console.warn('Queue unavailable, skipping enqueue', e)
    }

    return NextResponse.json({ success: true, scheduled_post: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}