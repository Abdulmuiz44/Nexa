import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

// GET /api/campaigns - List user's campaigns
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: campaigns, error } = await supabaseServer
      .from('campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      platforms,
      duration_days,
      posts_per_day,
      topic,
      start_date,
      end_date,
      metadata
    } = body;

    // Validate required fields
    if (!name || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({
        error: 'Name and at least one platform are required'
      }, { status: 400 });
    }

    // Create campaign
    const { data: campaign, error } = await supabaseServer
      .from('campaigns')
      .insert({
        user_id: session.user.id,
        name,
        description,
        platforms,
        duration_days: duration_days || 7,
        posts_per_day: posts_per_day || 1,
        topic,
        status: 'draft',
        start_date,
        end_date,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Create campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
