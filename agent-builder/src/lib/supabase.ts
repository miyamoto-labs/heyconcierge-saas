import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljseawnwxbkrejwysrey.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MEy6zRFneVmATZnAEwDqLQ_3_JwARoa'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_Brfx07Yxp_L7YLwE012lAA_xKsD-EtY'
  return createClient(supabaseUrl, serviceKey)
}
