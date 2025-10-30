import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import crypto from 'crypto';

// TODO: Implement post scheduling queue
// const postSchedulerQueue = new Queue('postScheduler', {
//   connection: {
//     host: process.env.REDIS_URL || 'localhost',
//     port: 6379,
//   },
// });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, platform, connectionId, campaignId, scheduledAt, preview = true } = await req.json();

    if (!content || !platform || !connectionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get connection
    const { data: connection } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', session.user.id)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    const idempotencyKey = crypto.randomUUID();

    if (preview) {
      // Return preview data
      return NextResponse.json({
        preview: true,
        content,
        platform,
        connection: {
          id: connection.id,
          toolkit: connection.toolkit_slug,
        },
        idempotencyKey,
      });
    }

    // Check for idempotency
    const existingPost = await supabaseServer
      .from('posts')
      .select('id')
      .eq('meta->>idempotencyKey', idempotencyKey)
      .single();

    if (existingPost.data) {
      return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
    }

    if (scheduledAt) {
      // Schedule post
      const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .insert({
      user_id: session.user.id,
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

      if (postError) {
        console.error('Error saving scheduled post:', postError);
        return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 });
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

      return NextResponse.json({
        success: true,
        post,
        scheduled: true,
      });
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
        user_id: session.user.id,
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

    if (postError) {
      console.error('Error saving post:', postError);
      return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post,
      platformResult: { executionId: `placeholder-${Date.now()}` },
    });
    // TODO: Add error handling for posting failures
    // } catch (error: any) {
    //   console.error('Composio execute error:', error);
    //
    //   // Save failed post
    //   await supabaseServer
    //     .from('posts')
    //     .insert({
    //       user_id: session.user.id,
    //       campaign_id: campaignId,
    //       platform: platform as 'twitter' | 'reddit',
    //       content,
    //       composio_connection_id: connection.id,
    //       status: 'failed',
    //       meta: { error: error.message, idempotencyKey },
    //     });
    //
    //   return NextResponse.json({ error: 'Failed to post content' }, { status: 500 });
    // }
  } catch (error: any) {
    console.error('Posts create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
