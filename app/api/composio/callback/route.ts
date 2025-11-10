import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { Composio } from '@composio/core';

// Handle OAuth callback from Composio
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    
    // Extract parameters from query string
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const connectionId = url.searchParams.get('connectionId');
    const integrationId = url.searchParams.get('integrationId');
    const entityId = url.searchParams.get('entityId');
    
    console.log('Composio callback received:', { 
      hasCode: !!code, 
      hasState: !!state, 
      connectionId, 
      integrationId,
      entityId 
    });

    if (!connectionId || !integrationId || !entityId) {
      console.error('Missing required parameters in callback');
      return NextResponse.redirect(
        new URL('/dashboard/connections?error=missing_params', url.origin)
      );
    }

    // Save connection to database
    const saved = await saveConnection({
      connectionId,
      userId: entityId,
      toolkit: integrationId,
    });

    if ('error' in saved) {
      console.error('Failed to save connection:', saved.error);
      return NextResponse.redirect(
        new URL('/dashboard/connections?error=save_failed', url.origin)
      );
    }

    console.log('Connection saved successfully:', saved.id);

    // Redirect back to connections page with success message
    return NextResponse.redirect(
      new URL(`/dashboard/connections?connected=${encodeURIComponent(integrationId)}`, url.origin)
    );
  } catch (error) {
    console.error('Composio callback GET error:', error);
    const url = new URL(req.url);
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=callback', url.origin)
    );
  }
}

// Alternative: manual callback recording from client
export async function POST(req: Request) {
  try {
    const { sessionId, userId, toolkit, connectionId } = await req.json();
    
    console.log('Manual connection recording:', { sessionId, userId, toolkit, connectionId });

    if (!userId || !toolkit) {
      return NextResponse.json(
        { error: 'userId and toolkit are required' },
        { status: 400 }
      );
    }

    const connId = connectionId || sessionId;
    if (!connId) {
      return NextResponse.json(
        { error: 'connectionId or sessionId required' },
        { status: 400 }
      );
    }

    // Verify the connection with Composio
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (apiKey) {
      try {
        const composio = new Composio({ apiKey });
        const account = await composio.connectedAccounts.get({
          connectedAccountId: connId
        });
        
        console.log('Verified connection with Composio:', {
          id: account.id,
          status: account.status,
          integrationId: account.integrationId
        });
      } catch (verifyError) {
        console.warn('Could not verify connection with Composio:', verifyError);
        // Continue anyway - connection might still be valid
      }
    }

    const saved = await saveConnection({
      connectionId: connId,
      userId,
      toolkit,
    });

    if ('error' in saved) {
      return NextResponse.json({ error: saved.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      connectionId: saved.id,
      message: 'Connection saved successfully'
    });
  } catch (error: unknown) {
    console.error('Composio callback POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Composio callback failed' },
      { status: 500 }
    );
  }
}

async function saveConnection({
  connectionId,
  userId,
  toolkit,
}: {
  connectionId: string;
  userId: string;
  toolkit: string;
}) {
  try {
    // Check if connection already exists
    const { data: existing } = await supabaseServer
      .from('composio_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('composio_connection_id', connectionId)
      .single();

    if (existing) {
      console.log('Connection already exists:', existing.id);
      return { id: existing.id };
    }

    // Insert new connection
    const { data, error } = await supabaseServer
      .from('composio_connections')
      .insert({
        user_id: userId,
        composio_connection_id: connectionId,
        toolkit_slug: toolkit,
        meta: {
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          source: 'oauth_callback',
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error saving connection:', error);
      return { error: 'Failed to save connection to database' } as const;
    }

    console.log('New connection created:', data.id);
    return { id: data!.id } as const;
  } catch (error) {
    console.error('Exception in saveConnection:', error);
    return { error: 'Failed to save connection' } as const;
  }
}
