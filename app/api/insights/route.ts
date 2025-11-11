import { NextRequest, NextResponse } from 'next/server';
import { PerformanceIntelligenceService } from '@/lib/services/performanceIntelligenceService';
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

    if (action === 'dashboard') {
      const dashboardData = await PerformanceIntelligenceService.getDashboardData(user.id);
      return NextResponse.json(dashboardData);
    }

    if (action === 'generate') {
      const days = parseInt(searchParams.get('days') || '30');
      const insights = await PerformanceIntelligenceService.generateInsights(user.id, days);
      return NextResponse.json({ insights });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Insights GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
