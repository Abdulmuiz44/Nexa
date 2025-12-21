/**
 * Composio OAuth Initiation Endpoint
 * POST /api/composio/auth/[platform]
 *
 * Initiates OAuth flow for a social media platform
 * Supports: twitter, reddit, linkedin
 *
 * Security: Rate limited (see rate-limit middleware)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createLogger } from '@/lib/logger';
import { createRateLimiter, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();
const oauthRateLimiter = createRateLimiter(RATE_LIMITS.oauth);

interface AuthParams {
  params: {
    platform: string;
  };
}

export async function POST(request: NextRequest, { params }: AuthParams): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResult = oauthRateLimiter(request);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { platform } = params;

    // Validate platform
    if (!['twitter', 'reddit', 'linkedin'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform', details: `Supported platforms: twitter, reddit, linkedin` },
        { status: 400 }
      );
    }

    await logger.info('composio_auth_init', `Initiating ${platform} OAuth`, { userId });

    // Check if user already has an active connection for this platform
    const { data: existingConnection } = await supabaseServer
      .from('composio_connections')
      .select('id, status')
      .eq('user_id', userId)
      .eq('toolkit_slug', platform)
      .eq('status', 'active')
      .single();

    if (existingConnection) {
      await logger.warn('composio_already_connected', `User already has active ${platform} connection`, {
        userId,
        connectionId: existingConnection.id,
      });

      return NextResponse.json(
        {
          error: `${platform} is already connected`,
          details: 'Disconnect the existing account first if you want to connect a different one',
          alreadyConnected: true,
        },
        { status: 409 }
      );
    }

    const composioService = new ComposioIntegrationService(userId);

    let authResult;

    switch (platform) {
      case 'twitter':
        authResult = await composioService.initiateTwitterConnection();
        break;
      case 'reddit':
        authResult = await composioService.initiateRedditConnection();
        break;
      case 'linkedin':
        // LinkedIn not implemented yet
        return NextResponse.json(
          { error: 'LinkedIn integration coming soon' },
          { status: 501 }
        );
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Generate unique state for CSRF protection
    const state = uuidv4();

    // Store auth session state in database for verification
    const { error: insertError } = await supabaseServer
      .from('auth_sessions')
      .insert({
        user_id: userId,
        platform,
        state,
        composio_connection_id: authResult.connectionId,
        status: 'pending',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });

    if (insertError) {
      throw new Error(`Failed to create auth session: ${insertError.message}`);
    }

    await logger.info('composio_auth_session_created', `Auth session created for ${platform}`, {
      userId,
      connectionId: authResult.connectionId,
      state,
    });

    return NextResponse.json(
      {
        success: true,
        authUrl: authResult.authUrl,
        connectionId: authResult.connectionId,
        state,
        platform,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('composio_auth_error', `Failed to initiate ${params.platform} OAuth`, {
      userId: (await getServerSession())?.user?.id,
      platform: params.platform,
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Failed to initiate authentication',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
