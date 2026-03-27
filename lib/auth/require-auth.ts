import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    return { user: null, org: null }
  }

  // Look up user's organization — prefer auth_user_id match, fall back to email
  const adminSupabase = createAdminClient()
  const { data: orgs } = await adminSupabase
    .from('organizations')
    .select('*')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .order('created_at', { ascending: false })
    .limit(1)

  return { user, org: orgs?.[0] ?? null }
}
