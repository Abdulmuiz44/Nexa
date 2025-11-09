import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * Analyze a tweet's characteristics
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);
    const { tweetContent } = await req.json();

    if (!tweetContent) {
      return NextResponse.json(
        { error: 'Tweet content is required' },
        { status: 400 }
      );
    }

    const composioService = new ComposioIntegrationService(userId);
    const analysis = await composioService.analyzeTweet(tweetContent);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Error analyzing tweet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze tweet' },
      { status: 500 }
    );
  }
}
