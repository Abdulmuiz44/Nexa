import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * Analyze user's tweet patterns
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);
    const composioService = new ComposioIntegrationService(userId);

    const patterns = await composioService.analyzeUserTweetPatterns();

    return NextResponse.json({
      success: true,
      patterns,
    });
  } catch (error: any) {
    console.error('Error analyzing tweet patterns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze tweet patterns' },
      { status: 500 }
    );
  }
}
