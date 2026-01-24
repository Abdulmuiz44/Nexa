import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { isRedisAvailable } from '@/lib/utils/redis-check'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data: post, error } = await supabaseServer
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (post.status !== 'pending') return NextResponse.json({ error: 'Only pending posts can be cancelled' }, { status: 409 })

    // Remove queued job if exists (lazy)
    if (await isRedisAvailable()) {
      try {
        const { scheduledPostsQueue } = await import('@/src/queue/scheduledPosts')
        const job = await scheduledPostsQueue.getJob(id)
        if (job) await job.remove()
      } catch (err) {
        console.warn('Queue cleanup failed:', err)
      }
    }

    // Mark as cancelled
    await supabaseServer
      .from('scheduled_posts')
      .update({ status: 'cancelled', error_message: 'Cancelled by user' })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
