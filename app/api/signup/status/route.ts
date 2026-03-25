import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ authenticated: false })
  }

  const adminSupabase = createAdminClient()

  // Check existing org
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id, subscription_status')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .single()

  if (!org) {
    return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.user_metadata?.name || '' }, org: null, property: null, config: null })
  }

  // Check existing property
  const { data: props } = await adminSupabase
    .from('properties')
    .select('id, name')
    .eq('org_id', org.id)
    .limit(1)

  const property = props && props.length > 0 ? props[0] : null

  let config = null
  if (property) {
    const { data: cfgData } = await adminSupabase
      .from('property_config_sheets')
      .select('wifi_password, checkin_instructions, local_tips, house_rules')
      .eq('property_id', property.id)
      .single()
    config = cfgData
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.user_metadata?.name || '' },
    org,
    property,
    config,
  })
}
