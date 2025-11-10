import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

/**
 * POST /api/social/twitter/schedule
 * Schedule a tweet for later
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { content, scheduledAt, replyToTweetId, quoteTweetId } = body;

    if (!content || !scheduledAt) {
      return NextResponse.json(
        { error: 'content and scheduledAt are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'scheduledAt must be in the future' },
        { status: 400 }
      );
    }

    const composioService = new ComposioIntegrationService(userId);
    const result = await composioService.schedulePost(
      'twitter',
      {
        content,
        replyToTweetId,
        quoteTweetId,
      },
      scheduledDate
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to schedule tweet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduleId: result.scheduleId,
      scheduledAt: scheduledDate.toISOString(),
      message: 'Tweet scheduled successfully',
    });
  } catch (error: any) {
    console.error('Error scheduling tweet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
