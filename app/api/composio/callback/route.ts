import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';

// Minimal, safe placeholder callback that records a connection without crashing
export async function POST(req: Request) {
  try {
    const { sessionId, userId, toolkit } = await req.json();
    if (!sessionId || !userId || !toolkit) {
      return NextResponse.json({ error: 'sessionId, userId and toolkit are required' }, { status: 400 });
    }

    // Persist a placeholder connection row
    const { data, error } = await supabaseServer
      .from('composio_connections')
      .insert({
        user_id: userId,
        composio_connection_id: sessionId,
        toolkit_slug: toolkit,
        meta: { status: 'COMPLETED', createdAt: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving connection:', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, connectionId: data.id });
  } catch (error: unknown) {
    console.error('Composio callback error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Composio callback failed' }, { status: 500 });
  }
}
