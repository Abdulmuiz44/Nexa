import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * GET /api/social/twitter/search
 * Search user's tweets
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || undefined;
    const maxResults = parseInt(url.searchParams.get('maxResults') || '100');

    const composioService = new ComposioIntegrationService(userId);
    const tweets = await composioService.searchUserTweets(query, maxResults);

    return NextResponse.json({
      success: true,
      tweets,
      count: tweets.length,
      query,
    });
  } catch (error: any) {
    console.error('Error searching tweets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search tweets' },
      { status: 500 }
    );
  }
}
