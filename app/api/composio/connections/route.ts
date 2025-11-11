import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { supabaseServer } from '@/src/lib/supabaseServer'
import { Composio } from '@composio/core'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let connections = []
    
    // Get connections from database with error handling
    try {
      const { data, error } = await supabaseServer
        .from('composio_connections')
        .select('id, toolkit_slug, composio_connection_id, meta, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching connections from database:', error)
        // Return empty connections instead of failing completely
        connections = []
      } else {
        connections = data || []
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      // Return empty connections if database is unavailable
      connections = []
    }

    // Verify connections with Composio if API key is available
    const apiKey = process.env.COMPOSIO_API_KEY
    if (apiKey && connections.length > 0) {
      try {
        const composio = new Composio({ apiKey })
        
        // Get all connected accounts from Composio with timeout
        const timeoutMs = 10000 // 10 second timeout
        const composioAccountsPromise = composio.connectedAccounts.list({
          entityIds: [session.user.id]
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Composio API timeout')), timeoutMs)
        )
        
        const composioAccounts = await Promise.race([
          composioAccountsPromise,
          timeoutPromise
        ]) as any

        // Enrich our connections with live status from Composio
        const enrichedConnections = connections.map(conn => {
          const composioAccount = composioAccounts.items?.find(
            (acc: any) => acc.id === conn.composio_connection_id
          )

          return {
            ...conn,
            status: composioAccount?.status || conn.meta?.status || 'UNKNOWN',
            isActive: composioAccount?.status === 'ACTIVE',
            lastVerified: new Date().toISOString(),
          }
        })

        return NextResponse.json({ 
          connections: enrichedConnections,
          verified: true 
        })
      } catch (composioError: any) {
        console.warn('Could not verify connections with Composio:', composioError?.message || composioError)
        // Return database connections even if Composio verification fails
        return NextResponse.json({ 
          connections: connections.map(conn => ({
            ...conn,
            status: conn.meta?.status || 'UNKNOWN',
            isActive: true, // Assume active if we can't verify
            lastVerified: null
          })),
          verified: false,
          warning: 'Could not verify with Composio'
        })
      }
    }

    return NextResponse.json({ connections, verified: false })
  } catch (e: any) {
    console.error('Error in connections route:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}