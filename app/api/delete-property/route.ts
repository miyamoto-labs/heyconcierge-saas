import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { propertyId } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    // Delete related data first (in case CASCADE isn't set on all tables)

    // Delete property images from storage
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

      await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId)
    }

    // Delete config sheets
    await supabase
      .from('property_config_sheets')
      .delete()
      .eq('property_id', propertyId)

    // Delete bookings
    await supabase
      .from('bookings')
      .delete()
      .eq('property_id', propertyId)

    // Delete guest sessions
    await supabase
      .from('guest_sessions')
      .delete()
      .eq('property_id', propertyId)

    // Delete messages
    await supabase
      .from('goconcierge_messages')
      .delete()
      .eq('property_id', propertyId)

    // Delete the property itself
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)

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
