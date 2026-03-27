import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { orgId, property, config } = body
  const adminSupabase = createAdminClient()

  // Verify the org belongs to this user
  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .eq('auth_user_id', user.id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Create property
  const { data: prop, error: propErr } = await adminSupabase
    .from('properties')
    .insert({
      org_id: orgId,
      name: property.name,
      address: property.address,
      postal_code: property.postal_code,
      city: property.city,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      property_type: property.property_type,
      images: property.images,
      ical_url: property.ical_url || null,
      whatsapp_number: '',
    })
    .select()
    .single()

  if (propErr) {
    console.error('Create property error:', propErr)
    return NextResponse.json({ error: propErr.message }, { status: 500 })
  }

  // Create config sheet
  const { error: configErr } = await adminSupabase
    .from('property_config_sheets')
    .insert({
      property_id: prop.id,
      wifi_password: config.wifi_password,
      checkin_instructions: config.checkin_instructions,
      local_tips: config.local_tips,
      house_rules: config.house_rules,
    })

  if (configErr) {
    console.error('Config sheet creation error:', configErr)
  }

  return NextResponse.json({ property: prop })
}
