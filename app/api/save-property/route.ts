import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { propertyId, property, config } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify the property exists
    const { data: existingProp } = await supabase
      .from('properties')
      .select('id, org_id')
      .eq('id', propertyId)
      .single()

    if (!existingProp) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    if (org && existingProp.org_id && existingProp.org_id !== org.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update property
    if (property) {
      const { error: propErr } = await supabase
        .from('properties')
        .update({
          name: property.name,
          address: property.address,
          property_type: property.property_type,
          whatsapp_number: property.whatsapp_number,
          ical_url: property.ical_url,
        })
        .eq('id', propertyId)

      if (propErr) throw propErr
    }

    // Update or insert config
    if (config) {
      if (config.id) {
        const { error } = await supabase
          .from('property_config_sheets')
          .update({
            wifi_network: config.wifi_network || '',
            wifi_password: config.wifi_password || '',
            checkin_instructions: config.checkin_instructions || '',
            local_tips: config.local_tips || '',
            house_rules: config.house_rules || '',
          })
          .eq('id', config.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('property_config_sheets')
          .insert({
            property_id: propertyId,
            sheet_url: '',
            wifi_network: config.wifi_network || '',
            wifi_password: config.wifi_password || '',
            checkin_instructions: config.checkin_instructions || '',
            local_tips: config.local_tips || '',
            house_rules: config.house_rules || '',
          })

        if (error) throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save property error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save property' },
      { status: 500 }
    )
  }
}
