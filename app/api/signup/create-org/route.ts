import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, email } = await request.json()
  const adminSupabase = createAdminClient()

  // Check if org already exists for this user
  const { data: existingOrg } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (existingOrg) {
    return NextResponse.json({ org: existingOrg })
  }

  // Create new org using admin client (bypasses RLS)
  const { data: org, error: orgErr } = await adminSupabase
    .from('organizations')
    .insert({
      name,
      email: email || user.email,
      user_id: user.id,
      auth_user_id: user.id,
    })
    .select()
    .single()

  if (orgErr) {
    console.error('Create org error:', orgErr)
    return NextResponse.json({ error: orgErr.message }, { status: 500 })
  }

  return NextResponse.json({ org })
}
