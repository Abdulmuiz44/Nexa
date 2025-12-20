/**
 * Composio OAuth Callback Handler
 * GET /api/composio/callback
 *
 * Handles OAuth callback from Composio for all platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      await logger.error('composio_callback_error', 'OAuth callback error', {
        error,
        error_description: errorDescription,
      });

      // Redirect to error page with encoded error message
      const errorMsg = encodeURIComponent(`OAuth failed: ${errorDescription || error}`);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=${errorMsg}`);
    }

    if (!connectionId || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify auth session
    const { data: authSession } = await supabaseServer
      .from('auth_sessions')
      .select('*')
      .eq('state', state)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!authSession) {
      await logger.error('composio_callback_invalid_state', 'Invalid or expired auth session', {
        state,
      });

      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent('Invalid or expired auth session')}`
      );
    }

    const userId = authSession.user_id;
    const platform = authSession.platform;

    // Check if connection already exists for this platform
    const { data: existingConnection } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('toolkit_slug', platform)
      .single();

    if (existingConnection) {
      // Update existing connection
      await supabaseServer
        .from('composio_connections')
        .update({
          composio_connection_id: connectionId,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      await logger.info('composio_connection_updated', `${platform} connection updated`, {
        userId,
        platform,
      });
    } else {
      // Create new connection
      await supabaseServer.from('composio_connections').insert({
        user_id: userId,
        composio_connection_id: connectionId,
        toolkit_slug: platform,
        status: 'active',
        account_username: '', // Will be populated on first use
        account_id: '', // Will be populated on first use
      });

      await logger.info('composio_connection_created', `${platform} connection created`, {
        userId,
        platform,
      });
    }

    // Update auth session status
    await supabaseServer
      .from('auth_sessions')
      .update({ status: 'completed' })
      .eq('id', authSession.id);

    // Redirect to integrations page with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=${encodeURIComponent(`${platform} connected successfully`)}&platform=${platform}`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('composio_callback_error', 'Callback processing failed', {
      error: errorMsg,
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=${encodeURIComponent('Connection failed')}`
    );
  }
}
