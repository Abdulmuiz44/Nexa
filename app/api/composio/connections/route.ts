/**
 * Composio Connections Endpoint
 * GET /api/composio/connections
 * DELETE /api/composio/connections?platform=[platform]
 *
 * Manage user's connected social media accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createLogger } from '@/lib/logger';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

const logger = createLogger();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

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
      throw new Error(`Supabase query failed: ${error.message || JSON.stringify(error)}`);
    }

    // Format connections with additional metadata
    const formattedConnections = (connections || []).map((conn) => {
      const meta = conn.meta || {};

      return {
        id: conn.id,
        platform: conn.toolkit_slug,
        username: conn.account_username || 'Unknown',
        accountId: conn.account_id,
        status: conn.status,
        connectedAt: conn.created_at,
        verified: meta.verified || false,
        followerCount: meta.follower_count || 0,
        lastVerifiedAt: meta.last_verified_at,
        isExpired: conn.updated_at
          ? new Date(conn.updated_at).getTime() + 90 * 24 * 60 * 60 * 1000 < Date.now()
          : false, // 90 day expiry warning
      };
    });

    await logger.info('connections_retrieved', 'Connections list fetched', {
      userId,
      count: formattedConnections.length,
      platforms: formattedConnections.map((c) => c.platform),
    });

    return NextResponse.json({
      success: true,
      connections: formattedConnections,
      count: formattedConnections.length,
      hasExpiredConnections: formattedConnections.some((c) => c.isExpired),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('connections_fetch_error', 'Failed to retrieve connections', {
      userId: (await getServerSession())?.user?.id,
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
    const session = await getServerSession(authOptions);

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

    await logger.info('connection_revoke_start', `Attempting to revoke ${platform} connection`, {
      userId,
      platform,
    });

    // Get connection to revoke
    const { data: connection, error: fetchError } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('toolkit_slug', platform)
      .single();

    if (fetchError || !connection) {
      await logger.warn('connection_not_found', `${platform} connection not found for user`, {
        userId,
        platform,
        error: fetchError?.message,
      });

      return NextResponse.json(
        { error: `No ${platform} connection found` },
        { status: 404 }
      );
    }

    // Try to revoke on Composio side (best-effort, non-blocking)
    let composioRevoked = false;
    try {
      const composioService = new ComposioIntegrationService(userId);
      composioRevoked = await composioService.revokeComposioConnection(
        connection.composio_connection_id
      );

      if (composioRevoked) {
        await logger.info('composio_revoked', `Successfully revoked ${platform} on Composio`, {
          userId,
          platform,
          connectionId: connection.composio_connection_id,
        });
      }
    } catch (revokeError) {
      // Non-fatal error: local deletion still succeeds
      await logger.warn('composio_revoke_failed', `Could not revoke on Composio side`, {
        userId,
        platform,
        error: revokeError instanceof Error ? revokeError.message : String(revokeError),
      });
    }

    // Delete connection from database
    const { error: deleteError } = await supabaseServer
      .from('composio_connections')
      .delete()
      .eq('id', connection.id);

    if (deleteError) {
      throw new Error(`Database delete failed: ${deleteError.message}`);
    }

    // Log audit trail
    try {
      await supabaseServer.from('audit_logs').insert({
        user_id: userId,
        action: 'connection_revoked',
        resource: 'composio_connection',
        resource_id: connection.id,
        details: {
          platform,
          composio_connection_id: connection.composio_connection_id,
          account_username: connection.account_username,
          composio_revoke_successful: composioRevoked,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (auditError) {
      // Non-critical: don't block if audit logging fails
      console.warn('Failed to log audit trail:', auditError);
    }

    await logger.info('connection_revoked_complete', `${platform} connection revoked successfully`, {
      userId,
      platform,
      connectionId: connection.id,
      composioRevoked,
    });

    return NextResponse.json({
      success: true,
      message: `${platform} account disconnected successfully`,
      platform,
      data: {
        revokedAt: new Date().toISOString(),
        composioRevoked,
        username: connection.account_username,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('connection_revoke_error', 'Failed to revoke connection', {
      userId: (await getServerSession())?.user?.id,
      platform: request.nextUrl.searchParams.get('platform'),
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Failed to disconnect account',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
