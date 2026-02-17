import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { imageId, imageUrl } = await request.json()

    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required' }, { status: 400 })
    }

    // Delete from storage if URL provided
    if (imageUrl) {
      const urlParts = imageUrl.split('/property-images/')
      if (urlParts.length === 2) {
        const filePath = urlParts[1]
        const { error: storageError } = await supabase.storage
          .from('property-images')
          .remove([filePath])
        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    )
  }
}
