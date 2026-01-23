/**
 * Social Connections API - Direct OAuth (No Composio)
 * GET /api/connectors - List user's connected accounts
 * DELETE /api/connectors?platform=[platform] - Disconnect an account
 * 
 * Uses the connected_accounts table populated by direct OAuth flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_user_id: string;
  username: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scopes?: string[];
  created_at: string;
  updated_at: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session (handle different session structures)
    const userId = (session.user as any).id || session.user.email;

    if (!userId) {
      console.error('No user ID found in session:', session.user);
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    // Get all connected accounts for user from direct OAuth
    const { data: accounts, error } = await supabaseServer
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch connected accounts:', error);
      // Return empty array instead of error so the UI can still render
      return NextResponse.json({
        success: true,
        connections: [],
        count: 0,
        error: error.message
      });
    }

    // Format connections for frontend (don't expose tokens)
    const connections = (accounts || []).map((acc: ConnectedAccount) => {
      const isExpired = acc.expires_at
        ? new Date(acc.expires_at).getTime() < Date.now()
        : false;

      return {
        id: acc.id,
        platform: acc.platform,
        username: acc.username,
        platformUserId: acc.platform_user_id,
        connectedAt: acc.created_at,
        updatedAt: acc.updated_at,
        isExpired,
        hasRefreshToken: !!acc.refresh_token,
        scopes: acc.scopes || [],
      };
    });

    return NextResponse.json({
      success: true,
      connections,
      count: connections.length,
    });
  } catch (error) {
    console.error('Connections fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    if (!['twitter', 'reddit'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Delete the connection
    const { data: deleted, error } = await supabaseServer
      .from('connected_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform)
      .select()
      .single();

    if (error || !deleted) {
      return NextResponse.json(
        { error: `No ${platform} connection found` },
        { status: 404 }
      );
    }

    // Log to activity log
    try {
      await supabaseServer.from('activity_log').insert({
        user_id: userId,
        action: 'account_disconnected',
        description: `Disconnected ${platform} account @${deleted.username}`,
        metadata: {
          platform,
          username: deleted.username,
        },
      });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `${platform} account disconnected successfully`,
      platform,
      username: deleted.username,
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
