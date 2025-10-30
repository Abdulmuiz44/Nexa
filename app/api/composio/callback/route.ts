import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // TODO: Implement Composio integration
    // For now, return a placeholder response
    const authSession = { status: 'COMPLETED' };

    if (authSession.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Authentication not completed' }, { status: 400 });
    }

    // Get connections for this session
    const connections = await composio.connections.list({
      authSessionId: sessionId,
    });

    if (connections.length === 0) {
      return NextResponse.json({ error: 'No connections found' }, { status: 400 });
    }

    const connection = connections[0];

    // Get user ID from auth session (assuming we stored it)
    const userId = authSession.userId;

    // Save connection to DB
    const { error } = await supabaseServer
      .from('composio_connections')
      .insert({
        user_id: userId,
        composio_connection_id: connection.id,
        toolkit_slug: connection.appName,
        meta: {
          status: connection.status,
          createdAt: connection.createdAt,
        },
      });

    if (error) {
      console.error('Error saving connection:', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, connectionId: connection.id });
  } catch (error: unknown) {
    console.error('Composio callback error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Composio callback failed' }, { status: 500 });
  }
}
