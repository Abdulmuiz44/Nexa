import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';

// Record a connection (POST from client) or handle provider redirect (GET)
export async function POST(req: Request) {
  try {
    const { sessionId, userId, toolkit } = await req.json();
    if (!sessionId || !userId || !toolkit) {
      return NextResponse.json({ error: 'sessionId, userId and toolkit are required' }, { status: 400 });
    }
    const saved = await saveConnection({ sessionId, userId, toolkit });
    if ('error' in saved) return NextResponse.json({ error: saved.error }, { status: 500 });
    return NextResponse.json({ success: true, connectionId: saved.id });
  } catch (error: unknown) {
    console.error('Composio callback error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Composio callback failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const userId = url.searchParams.get('userId') || undefined;
    const toolkit = url.searchParams.get('toolkit') || undefined;
    if (!sessionId || !userId || !toolkit) {
      return NextResponse.redirect(new URL('/dashboard/connections?error=missing_params', url.origin));
    }
    const saved = await saveConnection({ sessionId, userId, toolkit });
    if ('error' in saved) {
      return NextResponse.redirect(new URL('/dashboard/connections?error=save_failed', url.origin));
    }
    return NextResponse.redirect(new URL(`/dashboard/connections?connected=${encodeURIComponent(toolkit)}`, url.origin));
  } catch (error) {
    console.error('Composio callback GET error:', error);
    const url = new URL(req.url);
    return NextResponse.redirect(new URL('/dashboard/connections?error=callback', url.origin));
  }
}

async function saveConnection({ sessionId, userId, toolkit }: { sessionId: string; userId: string; toolkit: string }) {
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
    return { error: 'Failed to save connection' } as const;
  }
  return { id: data!.id } as const;
}
