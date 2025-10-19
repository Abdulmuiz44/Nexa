import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xbmcovqzgcukluprfgnz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibWNvdnF6Z2N1a2x1cHJmZ256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzA0ODMsImV4cCI6MjA3NjMwNjQ4M30.uWo_UEbUbZdxqUulygBvrAshqdzfQE0OZ0pgAHC4'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key for server-side')
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey)