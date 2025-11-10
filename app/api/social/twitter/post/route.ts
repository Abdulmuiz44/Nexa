import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * POST /api/social/twitter/post
 * Post a tweet to Twitter
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { content, replyToTweetId, quoteTweetId, mediaUrls } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Tweet content is required' },
        { status: 400 }
      );
    }

    const composioService = new ComposioIntegrationService(userId);

    const result = await composioService.postTweet({
      content,
      replyToTweetId,
      quoteTweetId,
      mediaUrls,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to post tweet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      url: result.url,
      message: 'Tweet posted successfully',
    });
  } catch (error: any) {
    console.error('Error posting tweet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
