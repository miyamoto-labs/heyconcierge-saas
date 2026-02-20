import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 })
    }

    const { propertyId } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify the property belongs to the user's organization
    const { data: property } = await supabase
      .from('properties')
      .select('id, org_id')
      .eq('id', propertyId)
      .single()

    if (!property || property.org_id !== org.id) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 403 })
    }

    // Delete related data first
    const { data: images } = await supabase
      .from('property_images')
      .select('id, url')
      .eq('property_id', propertyId)

    if (images && images.length > 0) {
      const filePaths = images
        .map(img => {
          const parts = img.url?.split('/property-images/')
          return parts?.length === 2 ? parts[1] : null
        })
        .filter(Boolean) as string[]

      if (filePaths.length > 0) {
        await supabase.storage.from('property-images').remove(filePaths)
      }

      await supabase.from('property_images').delete().eq('property_id', propertyId)
    }

    await supabase.from('property_config_sheets').delete().eq('property_id', propertyId)
    await supabase.from('bookings').delete().eq('property_id', propertyId)
    await supabase.from('guest_sessions').delete().eq('property_id', propertyId)
    await supabase.from('goconcierge_messages').delete().eq('property_id', propertyId)

    const { error } = await supabase.from('properties').delete().eq('id', propertyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete property error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete property' },
      { status: 500 }
    )
  }
}
