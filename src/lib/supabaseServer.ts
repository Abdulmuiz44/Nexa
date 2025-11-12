import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseServerInstance: SupabaseClient | null = null

function createSupabaseServer(): SupabaseClient {
  if (supabaseServerInstance) {
    return supabaseServerInstance
  }

  // Prefer server-only env vars; gracefully fall back to public anon key in dev
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // In local/dev, it's common to not set the service role key. Fall back to anon key so APIs don't 500.
  const supabaseKey = serviceRoleKey || anonKey

  if (!supabaseUrl || !supabaseKey) {
    // During build or local development we may not have Supabase ready. Provide a proxy that surfaces a
    // descriptive runtime error the moment any Supabase method is invoked.
    console.warn(
      'Supabase configuration missing: set SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY. Returning a guarded proxy client.'
    )

    const missingConfigProxy = new Proxy({}, {
      get(_target, prop) {
        if (prop === '__isMissingConfigProxy') {
          return true
        }

        return () => {
          throw new Error(
            `Supabase not configured. Attempted to access "${String(prop)}" without SUPABASE_URL and key environment variables.`
          )
        }
      },
    }) as SupabaseClient

    supabaseServerInstance = missingConfigProxy
    return supabaseServerInstance
  }

  // Note: Using anon key on server will respect RLS; ensure your policies allow the operations you perform.
  supabaseServerInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseServerInstance
}

// Export a getter that lazily creates the client
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createSupabaseServer()
    return (client as any)[prop]
  }
})
