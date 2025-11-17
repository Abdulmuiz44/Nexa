import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { Composio } from '@composio/core';

/**
 * Composio connection metadata
 */
interface ComposioMeta {
  status?: string;
  [key: string]: unknown;
}

/**
 * Database composio_connections record
 */
interface ComposioConnection {
  id: string;
  toolkit_slug: string;
  composio_connection_id: string;
  meta?: ComposioMeta;
  created_at: string;
}

/**
 * Enriched connection response
 */
interface EnrichedConnection extends ComposioConnection {
  status: string;
  isActive: boolean;
  lastVerified: string | null;
}

/**
 * Composio account response
 */
interface ComposioAccount {
  id: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Composio list response
 */
interface ComposioListResponse {
  items?: ComposioAccount[];
  [key: string]: unknown;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let connections: ComposioConnection[] = [];

    // Get connections from database with error handling
    try {
      const { data, error } = await supabaseServer
        .from('composio_connections')
        .select('id, toolkit_slug, composio_connection_id, meta, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections from database:', error);
        // Return empty connections instead of failing completely
        connections = [];
      } else {
        connections = (data as ComposioConnection[]) || [];
      }
    } catch (dbError: unknown) {
      console.error('Database connection error:', dbError);
      // Return empty connections if database is unavailable
      connections = [];
    }

    // Verify connections with Composio if API key is available
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (apiKey && connections.length > 0) {
      try {
        const composio = new Composio({ apiKey });

        // Get all connected accounts from Composio with timeout
        const timeoutMs = 10000; // 10 second timeout
        const composioAccountsPromise = composio.connectedAccounts.list({
          userIds: [session.user.id],
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Composio API timeout')), timeoutMs)
        );

        const composioAccounts = (await Promise.race([
          composioAccountsPromise,
          timeoutPromise,
        ])) as ComposioListResponse;

        // Enrich our connections with live status from Composio
        const enrichedConnections: EnrichedConnection[] = connections.map((conn) => {
          const composioAccount = composioAccounts.items?.find(
            (acc) => acc.id === conn.composio_connection_id
          );

          return {
            ...conn,
            status: composioAccount?.status || conn.meta?.status || 'UNKNOWN',
            isActive: composioAccount?.status === 'ACTIVE',
            lastVerified: new Date().toISOString(),
          };
        });

        return NextResponse.json({
          connections: enrichedConnections,
          verified: true,
        });
      } catch (composioError: unknown) {
        const message =
          composioError instanceof Error ? composioError.message : String(composioError);
        console.warn('Could not verify connections with Composio:', message);

        // Return database connections even if Composio verification fails
        const fallbackConnections: EnrichedConnection[] = connections.map((conn) => ({
          ...conn,
          status: (conn.meta?.status as string) || 'UNKNOWN',
          isActive: true, // Assume active if we can't verify
          lastVerified: null,
        }));

        return NextResponse.json({
          connections: fallbackConnections,
          verified: false,
          warning: 'Could not verify with Composio',
        });
      }
    }

    return NextResponse.json({ connections, verified: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Error in connections route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
