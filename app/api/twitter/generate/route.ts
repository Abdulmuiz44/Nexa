import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * Generate a tweet in user's style
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);
    const { topic, context } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const composioService = new ComposioIntegrationService(userId);
    const tweetContent = await composioService.generateTweetInUserStyle(topic, context);

    return NextResponse.json({
      success: true,
      content: tweetContent,
    });
  } catch (error: any) {
    console.error('Error generating tweet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tweet' },
      { status: 500 }
    );
  }
}
