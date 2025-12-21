/**
 * Composio OAuth Callback Handler
 * GET /api/composio/callback
 *
 * Handles OAuth callback from Composio for all platforms
 * Verifies state, fetches account info, and stores connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors (user denied, etc)
    if (error) {
      await logger.warn('composio_callback_oauth_error', 'User denied OAuth or error occurred', {
        error,
        error_description: errorDescription,
      });

      // Redirect to error page with encoded error message
      const errorMsg = encodeURIComponent(
        `OAuth failed: ${errorDescription || error}. Please try again.`
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${errorMsg}`
      );
    }

    if (!connectionId || !state) {
      await logger.error('composio_callback_missing_params', 'Missing OAuth callback parameters', {
        hasConnectionId: !!connectionId,
        hasState: !!state,
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${encodeURIComponent(
          'OAuth callback failed: missing parameters'
        )}`
      );
    }

    // Verify auth session (CSRF protection)
    const { data: authSession, error: sessionError } = await supabaseServer
      .from('auth_sessions')
      .select('*')
      .eq('state', state)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !authSession) {
      await logger.warn('composio_callback_invalid_state', 'Invalid or expired auth session', {
        state,
        sessionError: sessionError?.message,
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${encodeURIComponent(
          'Session expired. Please try connecting again.'
        )}`
      );
    }

    // Check session hasn't expired
    if (new Date(authSession.expires_at) < new Date()) {
      await logger.warn('composio_callback_session_expired', 'Auth session expired', {
        userId: authSession.user_id,
        platform: authSession.platform,
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${encodeURIComponent(
          'Session expired. Please try connecting again.'
        )}`
      );
    }

    const userId = authSession.user_id;
    const platform = authSession.platform;

    try {
      // Try to get verified account info from Composio
      const composioService = new ComposioIntegrationService(userId);
      let accountInfo: any = {
        username: '',
        accountId: '',
        verified: false,
        followerCount: 0,
      };

      try {
        accountInfo = await composioService.getVerifiedAccountInfo(
          platform as 'twitter' | 'reddit',
          connectionId
        );
        await logger.info('composio_account_verified', `Account info retrieved for ${platform}`, {
          userId,
          platform,
          username: accountInfo.username,
        });
      } catch (verifyError) {
        // Non-fatal: account info fetch failed, but connection is still valid
        await logger.warn('composio_account_verify_failed', `Could not verify ${platform} account`, {
          userId,
          platform,
          error: verifyError instanceof Error ? verifyError.message : String(verifyError),
        });
        // Continue with empty account info
      }

      // Check if connection already exists for this platform
      const { data: existingConnection } = await supabaseServer
        .from('composio_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('toolkit_slug', platform)
        .single();

      if (existingConnection) {
        // Update existing connection
        const { error: updateError } = await supabaseServer
          .from('composio_connections')
          .update({
            composio_connection_id: connectionId,
            status: 'active',
            account_username: accountInfo.username,
            account_id: accountInfo.accountId,
            meta: {
              verified: accountInfo.verified,
              follower_count: accountInfo.followerCount,
              last_verified_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConnection.id);

        if (updateError) throw updateError;

        await logger.info('composio_connection_updated', `${platform} connection updated`, {
          userId,
          platform,
          connectionId,
          username: accountInfo.username,
        });
      } else {
        // Create new connection
        const { error: insertError } = await supabaseServer
          .from('composio_connections')
          .insert({
            user_id: userId,
            composio_connection_id: connectionId,
            toolkit_slug: platform,
            status: 'active',
            account_username: accountInfo.username,
            account_id: accountInfo.accountId,
            meta: {
              verified: accountInfo.verified,
              follower_count: accountInfo.followerCount,
              connected_at: new Date().toISOString(),
            },
          });

        if (insertError) throw insertError;

        await logger.info('composio_connection_created', `${platform} connection created`, {
          userId,
          platform,
          connectionId,
          username: accountInfo.username,
        });
      }

      // Mark auth session as completed
      await supabaseServer
        .from('auth_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', authSession.id);

      // Redirect to success page with platform info
      const successMsg = encodeURIComponent(
        accountInfo.username
          ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} (@${accountInfo.username}) connected successfully!`
          : `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`
      );

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?success=${successMsg}&platform=${platform}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Mark auth session as failed
      await supabaseServer
        .from('auth_sessions')
        .update({
          status: 'failed',
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', authSession.id);

      await logger.error('composio_callback_processing_failed', 'Failed to process OAuth callback', {
        userId,
        platform,
        error: errorMsg,
        connectionId,
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${encodeURIComponent(
          `Failed to complete ${platform} connection: ${errorMsg}`
        )}`
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('composio_callback_fatal_error', 'Fatal error in OAuth callback handler', {
      error: errorMsg,
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/connections?error=${encodeURIComponent(
        'An unexpected error occurred. Please try again.'
      )}`
    );
  }
}
