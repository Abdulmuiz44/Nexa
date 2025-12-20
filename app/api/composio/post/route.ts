/**
 * Social Media Post Endpoint
 * POST /api/composio/post
 *
 * Creates and publishes a post to specified social media platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createLogger } from '@/lib/logger';
import * as TwitterToolkit from '@/lib/composio/twitter';
import * as RedditToolkit from '@/lib/composio/reddit';
import * as LinkedInToolkit from '@/lib/composio/linkedin';

const logger = createLogger();

interface PostRequest {
  platforms: string[];
  content: string | Record<string, string>;
  options?: {
    mediaUrls?: string[];
    scheduledTime?: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body: PostRequest = await request.json();
    const { platforms, content, options } = body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await logger.info('post_creation_start', 'Starting post creation', {
      userId,
      platforms,
      contentLength: typeof content === 'string' ? content.length : Object.values(content).reduce((sum: number, c: any) => sum + c.length, 0),
    });

    const composioService = new ComposioIntegrationService(userId);
    const results: Record<string, any> = {};
    const postIds: string[] = [];

    for (const platform of platforms) {
      if (!['twitter', 'reddit', 'linkedin'].includes(platform)) {
        results[platform] = {
          success: false,
          error: `Unsupported platform: ${platform}`,
        };
        continue;
      }

      try {
        // Check if user has active connection
        const hasConnection = await composioService.hasActiveConnection(platform as any);

        if (!hasConnection) {
          results[platform] = {
            success: false,
            error: `No active ${platform} connection. Please reconnect.`,
          };
          continue;
        }

        const platformContent = typeof content === 'string' ? content : content[platform];

        if (!platformContent) {
          results[platform] = {
            success: false,
            error: `No content provided for ${platform}`,
          };
          continue;
        }

        let postResult;

        switch (platform) {
          case 'twitter':
            postResult = await TwitterToolkit.postTweet(userId, platformContent, {
              media_urls: options?.mediaUrls,
              scheduled_time: options?.scheduledTime,
            });
            break;

          case 'reddit':
            // Reddit requires subreddit - extract from content or use default
            const redditContent = typeof content === 'object' && content.reddit_subreddit
              ? content.reddit_subreddit
              : 'test';

            postResult = await RedditToolkit.postTextToReddit(
              userId,
              redditContent,
              'Generated Post',
              platformContent
            );
            break;

          case 'linkedin':
            postResult = await LinkedInToolkit.postToLinkedIn(userId, platformContent, {
              media_urls: options?.mediaUrls,
            });
            break;

          default:
            postResult = { success: false, error: 'Unsupported platform' };
        }

        results[platform] = postResult;

        if (postResult.success && postResult.postId) {
          postIds.push(postResult.postId);

          // Save post to database
          await supabaseServer.from('posts').insert({
            user_id: userId,
            platform,
            content: platformContent,
            status: options?.scheduledTime ? 'scheduled' : 'published',
            published_at: options?.scheduledTime ? null : new Date().toISOString(),
            scheduled_at: options?.scheduledTime ? new Date(options.scheduledTime).toISOString() : null,
            platform_post_id: postResult.postId,
            url: postResult.url,
            metadata: {
              posted_via: 'api',
              posted_at: new Date().toISOString(),
            },
          });

          await logger.info('post_saved', `Post saved to database`, {
            userId,
            platform,
            postId: postResult.postId,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results[platform] = {
          success: false,
          error: errorMsg,
        };
        await logger.error('post_creation_error', `Failed to post to ${platform}`, {
          userId,
          platform,
          error: errorMsg,
        });
      }
    }

    const allSuccess = Object.values(results).every((r: any) => r.success);

    await logger.info('post_creation_complete', 'Post creation completed', {
      userId,
      platforms,
      successCount: Object.values(results).filter((r: any) => r.success).length,
      failureCount: Object.values(results).filter((r: any) => !r.success).length,
    });

    return NextResponse.json({
      success: allSuccess,
      results,
      postIds: Object.values(results)
        .filter((r: any) => r.success && r.postId)
        .map((r: any) => r.postId),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('post_api_error', 'Post API error', {
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Failed to create post',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
