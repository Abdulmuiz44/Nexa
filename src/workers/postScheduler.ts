import { Worker } from 'bullmq';
import { SocialMediaService } from '@/src/services/socialMediaService';
import { supabaseServer } from '@/src/lib/supabaseServer';

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => 60000,
  };

const handleRedisError = (err: any) => {
  if (err.message?.includes('ECONNREFUSED')) return;
  console.error('Redis worker error:', err);
};

export const postSchedulerWorker = new Worker(
  'postScheduler',
  async (job) => {
    const { postId } = job.data;

    // Get post details
    const { data: post } = await supabaseServer
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (!post || post.status !== 'scheduled') {
      throw new Error('Post not found or not scheduled');
    }

    const socialMediaService = new SocialMediaService(post.user_id);
    const hasConnection = await socialMediaService.hasActiveConnection(post.platform as any);

    if (!hasConnection) {
      throw new Error(`No active ${post.platform} connection found for user`);
    }

    try {
      const result = await socialMediaService.post(post.platform as any, post.content);

      if (!result.success) {
        throw new Error(result.error || 'Failed to post to platform');
      }

      // Update post status
      await supabaseServer
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date(),
          platform_post_id: result.platformPostId,
          platform_post_url: result.platformPostUrl,
        })
        .eq('id', postId);

      return { success: true, result };
    } catch (error: any) {
      console.error('Post execution error:', error);

      // Update post status to failed
      await supabaseServer
        .from('posts')
        .update({
          status: 'failed',
          meta: { ...post.meta, error: error.message },
        })
        .eq('id', postId);

      throw error;
    }
  },
  {
    connection,
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 5 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  } as any
);

// Analytics job
export const analyticsWorker = new Worker(
  'analytics',
  async () => {
    // Get all connected accounts
    const { data: accounts } = await supabaseServer
      .from('connected_accounts')
      .select('*');

    for (const account of accounts || []) {
      try {
        const socialMediaService = new SocialMediaService(account.user_id);
        // Fetch metrics based on toolkit
        let metrics;
        if (account.platform === 'twitter') {
          metrics = await socialMediaService.getPostAnalytics('twitter', ''); // Empty ID for account level if supported
        } else if (account.platform === 'reddit') {
          // Add Reddit metrics action
        }

        if (metrics) {
          // Store in analytics table
          await supabaseServer
            .from('analytics')
            .insert({
              post_id: null, // For account-level metrics
              platform: account.platform as any,
              impressions: metrics.impression_count || metrics.view_count || 0,
              engagements: metrics.reply_count || metrics.retweet_count || metrics.like_count || 0,
              likes: metrics.like_count || 0,
              comments: metrics.reply_count || 0,
              shares: metrics.retweet_count || 0,
              meta: metrics,
            });
        }
      } catch (error: any) {
        console.error('Analytics fetch error:', error);
      }
    }
  },
  {
    connection: connection as any,
  }
);

postSchedulerWorker.on('error', handleRedisError);
analyticsWorker.on('error', handleRedisError);
