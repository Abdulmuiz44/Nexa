import { Worker } from 'bullmq';
import { SocialMediaService } from '@/src/services/socialMediaService';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { analyticsEngine } from '@/src/services/analyticsEngine';

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
    // Get all users who have connected accounts
    const { data: users } = await supabaseServer
      .from('connected_accounts')
      .select('user_id');

    const uniqueUserIds = [...new Set((users || []).map(u => u.user_id))];

    for (const userId of uniqueUserIds) {
      try {
        console.log(`Starting bulk analytics collection for user: ${userId}`);
        await analyticsEngine.collectBulkAnalytics(userId);
      } catch (error: any) {
        console.error(`Analytics fetch error for user ${userId}:`, error);
      }
    }
  },
  {
    connection: connection as any,
  }
);

postSchedulerWorker.on('error', handleRedisError);
analyticsWorker.on('error', handleRedisError);
