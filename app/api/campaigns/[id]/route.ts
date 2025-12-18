import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

// GET /api/campaigns/[id] - Get specific campaign
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params
    const { data: campaign, error } = await supabaseServer
      .from('campaigns')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      console.error('Error fetching campaign:', error);
      return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Get campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      status,
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

    const resolvedParams = await params
    // Update campaign
    const { data: campaign, error } = await supabaseServer
      .from('campaigns')
      .update({
        name,
        description,
        platforms,
        duration_days,
        posts_per_day,
        topic,
        status,
        start_date,
        end_date,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      console.error('Error updating campaign:', error);
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Update campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params
    const { error } = await supabaseServer
      .from('campaigns')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting campaign:', error);
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
