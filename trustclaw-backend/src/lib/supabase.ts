import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cached clients (created on first use in serverless)
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

// Get Supabase client (public - respects RLS)
export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  _supabase = createClient(url, key)
  return _supabase
}

// Get Supabase admin client (bypasses RLS)
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    // Fall back to regular client if no service key
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon client')
    return getSupabase()
  }
  
  _supabaseAdmin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  return _supabaseAdmin
}

// Legacy exports - proxy to getter functions for backwards compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as unknown as Record<string | symbol, unknown>)[prop]
  }
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as unknown as Record<string | symbol, unknown>)[prop]
  }
})

// Check if wallet is admin
export function isAdmin(walletAddress: string): boolean {
  const adminWallet = process.env.ADMIN_WALLET
  const adminWallets = process.env.ADMIN_WALLETS?.split(',').map(w => w.trim()) || []
  
  return walletAddress === adminWallet || adminWallets.includes(walletAddress)
}
