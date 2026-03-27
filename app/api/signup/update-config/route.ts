import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { propertyId, config } = await request.json()
  const adminSupabase = createAdminClient()

  // Verify the property belongs to user's org
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: prop } = await adminSupabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('org_id', org.id)
    .single()

  if (!prop) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  await adminSupabase
    .from('property_config_sheets')
    .update({
      wifi_password: config.wifi_password,
      checkin_instructions: config.checkin_instructions,
      local_tips: config.local_tips,
      house_rules: config.house_rules,
    })
    .eq('property_id', propertyId)

  return NextResponse.json({ success: true })
}
