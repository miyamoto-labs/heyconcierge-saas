import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// Lazy-initialized singleton — defers createClient() until first use at runtime,
// preventing "supabaseUrl is required" errors during Next.js build.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  }
})
