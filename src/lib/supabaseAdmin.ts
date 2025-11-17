import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseAdminInstance: SupabaseClient | null = null

class SupabaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupabaseAdminConfigurationError'
  }
}

function resolveServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_KEY_B64
  )
}

function createSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = resolveServiceRoleKey()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseAdminConfigurationError(
      'Supabase service role credentials are missing. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in your environment to enable privileged operations.'
    )
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })

  return supabaseAdminInstance
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createSupabaseAdmin()
    return (client as any)[prop]
  },
})

export { SupabaseAdminConfigurationError }
