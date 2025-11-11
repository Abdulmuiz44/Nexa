import { NextRequest, NextResponse } from 'next/server';
import { EngagementSuiteService } from '@/lib/services/engagementSuiteService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'opportunities') {
      const minScore = parseInt(searchParams.get('min_score') || '70');
      const limit = parseInt(searchParams.get('limit') || '50');
      const opportunities = await EngagementSuiteService.getPendingOpportunities(user.id, minScore, limit);
      return NextResponse.json({ opportunities });
    }

    if (action === 'stats') {
      const stats = await EngagementSuiteService.getEngagementStats(user.id);
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, opportunity_id, engagement_action, response_content } = body;

    if (action === 'engage') {
      const tracking = await EngagementSuiteService.engageWithOpportunity(
        opportunity_id,
        engagement_action,
        response_content
      );
      return NextResponse.json({ success: true, tracking });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Engagement POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
