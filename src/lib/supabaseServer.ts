import { createClient } from '@supabase/supabase-js'

// Prefer server-only env vars; gracefully fall back to public anon key in dev
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// In local/dev, it's common to not set the service role key. Fall back to anon key so APIs don't 500.
const supabaseKey = serviceRoleKey || anonKey

if (!supabaseUrl || !supabaseKey) {
  // Fail with a clear message if both are missing
  throw new Error('Supabase configuration missing: ensure SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
}

// Note: Using anon key on server will respect RLS; ensure your policies allow the operations you perform.
export const supabaseServer = createClient(supabaseUrl, supabaseKey)
