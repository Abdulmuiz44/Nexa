import { Worker, Job } from 'bullmq'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { post_to_platform } from '@/src/services/postToPlatform'

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : { host: '127.0.0.1', port: 6379 }

interface JobData { scheduledPostId: string }

export const scheduledPostsWorker = new Worker(
  'scheduledPosts',
  async (job: Job<JobData>) => {
    const { scheduledPostId } = job.data

    // Fetch scheduled post
    const { data: post, error } = await supabaseServer
      .from('scheduled_posts')
      .select('*')
      .eq('id', scheduledPostId)
      .single()

    if (error || !post) {
      throw new Error('Scheduled post not found')
    }

    if (post.status !== 'pending') {
      return { skipped: true, reason: 'Not pending' }
    }

    // If job fired early, guard by time
    if (new Date(post.scheduled_at).getTime() > Date.now()) {
      // Re-enqueue with remaining delay
      const delay = new Date(post.scheduled_at).getTime() - Date.now()
      await job.update({ scheduledPostId })
      await job.retry().catch(() => {})
      return { rescheduled: true, delay }
    }

    const result = await post_to_platform({
      platform: post.platform,
      userId: post.user_id,
      content: post.content,
      mediaUrl: post.media_url || undefined,
    })

    if (result.success) {
      await supabaseServer
        .from('scheduled_posts')
        .update({ status: 'posted', posted_at: new Date().toISOString() })
        .eq('id', scheduledPostId)

      // Optionally, write to main posts table for history/analytics
      await supabaseServer
        .from('posts')
        .insert({
          user_id: post.user_id,
          platform: post.platform,
          content: post.content,
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: result.platformPostId,
          platform_post_url: result.platformPostUrl,
          metadata: { source: 'scheduler', scheduled_post_id: scheduledPostId },
        })

      return { success: true, platformPostId: result.platformPostId }
    }

    await supabaseServer
      .from('scheduled_posts')
      .update({ status: 'failed', error_message: result.error || 'Unknown error' })
      .eq('id', scheduledPostId)

    throw new Error(result.error || 'Posting failed')
  },
  { connection, removeOnComplete: { age: 3600, count: 100 }, removeOnFail: { age: 3600, count: 100 } }
)