import { createBrowserClient } from '@supabase/ssr'

// Guard against missing env vars during Next.js build/prerendering.
// At runtime in the browser, NEXT_PUBLIC_ vars are always inlined.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
