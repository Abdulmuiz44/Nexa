/**
 * Composio OAuth Initiation Endpoint
 * POST /api/composio/auth/[platform]
 *
 * Initiates OAuth flow for a social media platform
 * Supports: twitter, reddit, linkedin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

interface AuthParams {
  params: {
    platform: string;
  };
}

export async function POST(request: NextRequest, { params }: AuthParams): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { platform } = params;

    // Validate platform
    if (!['twitter', 'reddit', 'linkedin'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    await logger.info('composio_auth_init', `Initiating ${platform} OAuth`, { userId });

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
        authResult = await composioService.initializeLinkedInConnection?.();
        if (!authResult) {
          throw new Error('LinkedIn connection not implemented');
        }
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Store auth session state in database for verification
    await supabaseServer.from('auth_sessions').insert({
      user_id: userId,
      platform,
      state: authResult.connectionId,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    await logger.info('composio_auth_url_generated', `Auth URL generated for ${platform}`, {
      userId,
      connectionId: authResult.connectionId,
    });

    return NextResponse.json({
      success: true,
      authUrl: authResult.authUrl,
      connectionId: authResult.connectionId,
      platform,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('composio_auth_error', `Failed to initiate ${params.platform} OAuth`, {
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
