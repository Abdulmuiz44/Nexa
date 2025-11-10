import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * GET /api/social/twitter/timeline
 * Get user's Twitter timeline/home feed
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const url = new URL(req.url);
    const maxResults = parseInt(url.searchParams.get('maxResults') || '20');

    const composioService = new ComposioIntegrationService(userId);
    const tweets = await composioService.getUserTimeline(maxResults);

    return NextResponse.json({
      success: true,
      tweets,
      count: tweets.length,
    });
  } catch (error: any) {
    console.error('Error getting timeline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get timeline' },
      { status: 500 }
    );
  }
}
