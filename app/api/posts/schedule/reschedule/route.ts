import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { scheduledPostsQueue } from '@/src/queue/scheduledPosts'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, scheduled_at } = await req.json() as { id: string, scheduled_at: string }
    if (!id || !scheduled_at) return NextResponse.json({ error: 'Missing id or scheduled_at' }, { status: 400 })

    const newTime = new Date(scheduled_at)
    if (Number.isNaN(newTime.getTime())) return NextResponse.json({ error: 'Invalid scheduled_at' }, { status: 400 })

    const { data: post, error } = await supabaseServer
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (post.status !== 'pending') return NextResponse.json({ error: 'Only pending posts can be rescheduled' }, { status: 409 })

    // Remove existing job
    const job = await scheduledPostsQueue.getJob(id)
    if (job) await job.remove()

    // Update DB time
    const { error: upErr } = await supabaseServer
      .from('scheduled_posts')
      .update({ scheduled_at: newTime.toISOString(), error_message: null })
      .eq('id', id)

    if (upErr) return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })

    // Enqueue again with same jobId
    const delay = Math.max(0, newTime.getTime() - Date.now())
    await scheduledPostsQueue.add('executeScheduledPost', { scheduledPostId: id }, { delay, jobId: id })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}