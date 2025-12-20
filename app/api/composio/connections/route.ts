/**
 * Composio Connections Endpoint
 * GET /api/composio/connections
 * DELETE /api/composio/connections?platform=[platform]
 *
 * Manage user's connected social media accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createLogger } from '@/lib/logger';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

const logger = createLogger();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all active connections for user
    const { data: connections, error } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const formattedConnections = connections?.map((conn) => ({
      id: conn.id,
      platform: conn.toolkit_slug,
      username: conn.account_username,
      status: conn.status,
      connectedAt: conn.created_at,
    })) || [];

    await logger.info('connections_list', 'Connections retrieved', {
      userId,
      count: formattedConnections.length,
    });

    return NextResponse.json({
      success: true,
      connections: formattedConnections,
      count: formattedConnections.length,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('connections_error', 'Failed to retrieve connections', {
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Failed to retrieve connections',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const platform = request.nextUrl.searchParams.get('platform');

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    if (!['twitter', 'reddit', 'linkedin'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Get connection to revoke
    const { data: connection } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('toolkit_slug', platform)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: `No ${platform} connection found` },
        { status: 404 }
      );
    }

    // Try to revoke on Composio side
    try {
      const composioService = new ComposioIntegrationService(userId);
      // Add revoke method if available
      // await composioService.revokeConnection(connection.composio_connection_id);
    } catch (revokeError) {
      console.warn('Could not revoke on Composio side:', revokeError);
      // Continue with local deletion even if Composio revoke fails
    }

    // Delete connection from database
    await supabaseServer
      .from('composio_connections')
      .delete()
      .eq('id', connection.id);

    await logger.info('connection_deleted', `${platform} connection deleted`, {
      userId,
      platform,
    });

    return NextResponse.json({
      success: true,
      message: `${platform} connection removed`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('connection_delete_error', 'Failed to delete connection', {
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Failed to remove connection',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
