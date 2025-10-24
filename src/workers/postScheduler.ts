import { Worker } from 'bullmq';
import { composio } from '@/lib/composio';
import { supabaseServer } from '@/src/lib/supabaseServer';

const connection = {
  host: process.env.REDIS_URL || 'localhost',
  port: 6379,
};

export const postSchedulerWorker = new Worker(
  'postScheduler',
  async (job) => {
    const { postId } = job.data;

    // Get post details
    const { data: post } = await supabaseServer
      .from('posts')
      .select('*, composio_connections(*)')
      .eq('id', postId)
      .single();

    if (!post || post.status !== 'scheduled') {
      throw new Error('Post not found or not scheduled');
    }

    const connection = post.composio_connections;
    if (!connection) {
      throw new Error('No connection found');
    }

    try {
      const result = await composio.tools.execute({
        connectionId: connection.composio_connection_id,
        appName: connection.toolkit_slug,
        actionName: post.platform === 'twitter' ? 'create_tweet' : post.platform === 'reddit' ? 'submit_post' : 'post_content',
        input: {
          content: post.content,
        },
      });

      // Update post status
      await supabaseServer
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date(),
          platform_post_id: result.executionId,
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
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
);

// Analytics job
export const analyticsWorker = new Worker(
  'analytics',
  async (job) => {
    // Get all active connections
    const { data: connections } = await supabaseServer
      .from('composio_connections')
      .select('*');

    for (const connection of connections || []) {
      try {
        // Fetch metrics based on toolkit
        let metrics;
        if (connection.toolkit_slug === 'twitter') {
          metrics = await composio.tools.execute({
            connectionId: connection.composio_connection_id,
            appName: connection.toolkit_slug,
            actionName: 'get_account_info',
            input: {},
          });
        } else if (connection.toolkit_slug === 'reddit') {
          // Add Reddit metrics action
        }

        if (metrics) {
          // Store in analytics table
          await supabaseServer
            .from('analytics')
            .insert({
              post_id: null, // For account-level metrics
              platform: connection.toolkit_slug as any,
              impressions: metrics.impressions || 0,
              engagements: metrics.engagements || 0,
              likes: metrics.likes || 0,
              comments: metrics.comments || 0,
              shares: metrics.shares || 0,
              meta: metrics,
            });
        }
      } catch (error: any) {
        console.error('Analytics fetch error:', error);
      }
    }
  },
  {
    connection,
    repeat: {
      every: 4 * 60 * 60 * 1000, // 4 hours
    },
  }
);
