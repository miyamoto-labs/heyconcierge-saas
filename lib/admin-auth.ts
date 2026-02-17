import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SESSION_DURATION_HOURS = 8

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getAdminSession() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null

  const supabase = getAdminSupabase()
  const { data: session } = await supabase
    .from('admin_sessions')
    .select('*, admin_users(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  return session || null
}

export async function requireAdminSession() {
  const session = await getAdminSession()
  if (!session) return null
  if (!session.mfa_verified) return null
  return session
}

export function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}
