import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { EngagementSuiteService } from '@/src/lib/services/engagementSuiteService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'opportunities') {
      const minScore = parseInt(searchParams.get('min_score') || '70');
      const limit = parseInt(searchParams.get('limit') || '50');
      const opportunities = await EngagementSuiteService.discoverEngagementOpportunities(session.user.id, minScore, limit);
      return NextResponse.json({ opportunities });
    }

    if (action === 'stats') {
      const stats = await EngagementSuiteService.getEngagementStats(session.user.id);
      return NextResponse.json({ stats });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Engagement GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunityId, action } = await request.json();

    if (!opportunityId || !action) {
      return NextResponse.json({ error: 'opportunityId and action are required' }, { status: 400 });
    }

    if (!['like', 'retweet', 'reply', 'skip'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be like, retweet, reply, or skip' }, { status: 400 });
    }

    const result = await EngagementSuiteService.engageWithOpportunity(opportunityId, session.user.id, action);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Engagement POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
