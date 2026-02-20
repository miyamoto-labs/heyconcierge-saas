import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    return { user: null, org: null }
  }

  // Look up user's organization
  const adminSupabase = createAdminClient()
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('*')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .single()

  return { user, org }
}
