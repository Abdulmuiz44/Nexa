import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * POST /api/social/reddit/post
 * Post to a Reddit subreddit
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { subreddit, title, content, url, flair } = body;

    if (!subreddit || !title) {
      return NextResponse.json(
        { error: 'subreddit and title are required' },
        { status: 400 }
      );
    }

    if (!content && !url) {
      return NextResponse.json(
        { error: 'Either content or url is required' },
        { status: 400 }
      );
    }

    const composioService = new ComposioIntegrationService(userId);
    const result = await composioService.postToReddit({
      subreddit,
      title,
      content,
      url,
      flair,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to post to Reddit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      url: result.url,
      message: 'Posted to Reddit successfully',
    });
  } catch (error: any) {
    console.error('Error posting to Reddit:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
