import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * POST /api/social/twitter/engage
 * Engage with a tweet (like, retweet, reply)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { tweetId, type, replyContent } = body;

    if (!tweetId || !type) {
      return NextResponse.json(
        { error: 'tweetId and type are required' },
        { status: 400 }
      );
    }

    if (!['like', 'retweet', 'reply'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid engagement type. Must be: like, retweet, or reply' },
        { status: 400 }
      );
    }

    if (type === 'reply' && !replyContent) {
      return NextResponse.json(
        { error: 'replyContent is required for reply engagement' },
        { status: 400 }
      );
    }

    const composioService = new ComposioIntegrationService(userId);
    const result = await composioService.autoEngageWithTweet(
      tweetId,
      type as 'like' | 'retweet' | 'reply',
      replyContent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to engage with tweet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${type}d tweet`,
      tweetId,
      type,
    });
  } catch (error: any) {
    console.error('Error engaging with tweet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
