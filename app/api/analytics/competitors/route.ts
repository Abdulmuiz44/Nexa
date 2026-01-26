import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsEngine } from '@/src/services/analyticsEngine';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const competitors = await analyticsEngine.getCompetitorAnalysis(userId);

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Error in competitor analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { handle, platform } = await request.json();

    if (!handle || !platform) {
      return NextResponse.json({ error: 'Handle and platform are required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if competitor already exists
    const { data: existing } = await supabase
      .from('competitor_tracking')
      .select('id')
      .eq('user_id', userId)
      .eq('handle', handle)
      .eq('platform', platform)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Competitor already being tracked' }, { status: 400 });
    }

    // Add competitor to tracking
    const { data, error } = await supabase
      .from('competitor_tracking')
      .insert({
        user_id: userId,
        handle: handle.replace(/^@/, ''),
        platform,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding competitor:', error);
      return NextResponse.json({ error: 'Failed to add competitor' }, { status: 500 });
    }

    // Generate fresh analysis for the new competitor
    const enriched = await analyticsEngine.getCompetitorAnalysis(userId);
    const newCompetitor = enriched.find(c => c.id === data.id);

    return NextResponse.json({
      success: true,
      competitor: newCompetitor || data
    });
  } catch (error) {
    console.error('Error adding competitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
