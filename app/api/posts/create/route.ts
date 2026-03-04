import { NextRequest } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import crypto from 'crypto';
import { createPostSchema } from '@/lib/schemas/posts';
import { validateBody } from '@/lib/api/validation';
import { apiSuccess, apiError, apiCreated, apiUnauthorized, apiNotFound, apiConflict } from '@/lib/api/response';
import { getAuthenticatedUser } from '@/lib/api/auth-middleware';

// TODO: Implement post scheduling queue
// const postSchedulerQueue = new Queue('postScheduler', {
//   connection: {
//     host: process.env.REDIS_URL || 'localhost',
//     port: 6379,
//   },
// });

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || undefined;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiUnauthorized('Authentication required', requestId);
    }

    // Validate request body
    const { data: body, error: validationErr } = await validateBody(req, createPostSchema, requestId);

    if (validationErr) {
      return validationErr;
    }

    if (!body) {
      return apiError('Invalid request body', 400, 'BAD_REQUEST', requestId);
    }

    // Extract fields from validated body
    const { content, platform, campaign_id: campaignId, scheduled_at: scheduledAt } = body;
    const preview = req.nextUrl.searchParams.get('preview') === 'true';

    // Get connection
    const { data: connection, error: connError } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return apiNotFound('No platform connection found. Please connect your account first.', requestId);
    }

    const idempotencyKey = crypto.randomUUID();

    if (preview) {
      // Return preview data
      return apiSuccess(
        {
          preview: true,
          content,
          platform,
          connection: {
            id: connection.id,
            toolkit: connection.toolkit_slug,
          },
          idempotencyKey,
        },
        200,
        'POST_PREVIEW',
        requestId
      );
    }

    // Check for idempotency
    const { data: existingPost, error: dupError } = await supabaseServer
      .from('posts')
      .select('id')
      .eq('meta->>idempotencyKey', idempotencyKey)
      .single();

    if (existingPost && !dupError) {
      return apiConflict('Post already created with this request', requestId);
    }

    if (scheduledAt) {
      // Schedule post
      const { data: post, error: postError } = await supabaseServer
        .from('posts')
        .insert({
          user_id: user.id,
          campaign_id: campaignId,
          platform: platform as 'twitter' | 'reddit',
          content,
          composio_connection_id: connection.id,
          status: 'scheduled',
          scheduled_at: new Date(scheduledAt),
          meta: { idempotencyKey },
        })
        .select()
        .single();

      if (postError || !post) {
        console.error('Error saving scheduled post:', postError);
        return apiError('Failed to schedule post', 500, 'DATABASE_ERROR', requestId);
      }

      // TODO: Add to scheduling queue
      // await postSchedulerQueue.add(
      //   'schedulePost',
      //   { postId: post.id },
      //   {
      //     delay: new Date(scheduledAt).getTime() - Date.now(),
      //     attempts: 3,
      //     backoff: {
      //       type: 'exponential',
      //       delay: 5000,
      //     },
      //   }
      // );

      return apiCreated(
        {
          post,
          scheduled: true,
        },
        requestId
      );
    }

    // TODO: Execute posting via Composio
    // try {
    //   const result = await composio.tools.execute({
    //     connectionId: connection.composio_connection_id,
    //     appName: connection.toolkit_slug,
    //     actionName: platform === 'twitter' ? 'create_tweet' : platform === 'reddit' ? 'submit_post' : 'post_content',
    //     input: {
    //       content,
    //       // Add other params based on platform
    //     },
    //   });

    // Save post to DB (placeholder)
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        platform: platform as 'twitter' | 'reddit',
        content,
        composio_connection_id: connection.id,
        status: 'published',
        published_at: new Date(),
        platform_post_id: `placeholder-${Date.now()}`,
        meta: { idempotencyKey },
      })
      .select()
      .single();

    if (postError || !post) {
      console.error('Error saving post:', postError);
      return apiError('Failed to save post', 500, 'DATABASE_ERROR', requestId);
    }

    return apiCreated(
      {
        post,
        platformResult: { executionId: `placeholder-${Date.now()}` },
      },
      requestId
    );
    // TODO: Add error handling for posting failures
    // } catch (error: unknown) {
    //   console.error('Composio execute error:', error);
    //
    //   // Save failed post
    //   await supabaseServer
    //     .from('posts')
    //     .insert({
    //       user_id: user.id,
    //       campaign_id: campaignId,
    //       platform: platform as 'twitter' | 'reddit',
    //       content,
    //       composio_connection_id: connection.id,
    //       status: 'failed',
    //       meta: { error: error instanceof Error ? error.message : String(error), idempotencyKey },
    //     });
    //
    //   return apiError('Failed to post content', 500, 'POSTING_ERROR', requestId);
    // }
  } catch (error: unknown) {
    console.error('Posts create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return apiError(message, 500, 'INTERNAL_ERROR', requestId);
  }
}
