// NEXA - Campaign Management API Routes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('tool_id');
    const active = searchParams.get('active');

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        tools (
          id,
          name,
          description,
          url,
          category,
          keywords,
          features
        )
      `)
      .order('created_at', { ascending: false });

    if (toolId) {
      query = query.eq('tool_id', toolId);
    }

    if (active !== null) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      tool_id,
      name,
      description,
      prompt_template,
      platforms,
      frequency,
      target_audience,
      tone,
      hashtags
    } = body;

    // Validate required fields
    if (!tool_id || !name || !prompt_template || !platforms || !frequency) {
      return NextResponse.json({ 
        error: 'Missing required fields: tool_id, name, prompt_template, platforms, frequency' 
      }, { status: 400 });
    }

    // Create campaign
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        tool_id,
        name,
        description,
        prompt_template,
        platforms: Array.isArray(platforms) ? platforms : [platforms],
        frequency,
        target_audience: target_audience || 'AI enthusiasts',
        tone: tone || 'professional',
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        active: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign: data }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaign: data });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}