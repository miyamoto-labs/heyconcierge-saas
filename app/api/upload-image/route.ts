import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const formData = await request.formData()
    const propertyId = formData.get('propertyId') as string
    const tagsJson = formData.get('tags') as string
    const files = formData.getAll('images') as File[]

    if (!propertyId || !tagsJson || files.length === 0) {
      return NextResponse.json({ error: 'propertyId, tags, and images are required' }, { status: 400 })
    }

    // Verify property belongs to user's org
    if (org) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .eq('org_id', org.id)
        .single()
      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
    }

    const tags = JSON.parse(tagsJson)
    const uploaded: { url: string; filename: string }[] = []

    for (const file of files) {
      const fileName = `${propertyId}/${Date.now()}_${file.name}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          url: publicUrl,
          filename: file.name,
          tags,
        })

      if (dbError) throw dbError

      uploaded.push({ url: publicUrl, filename: file.name })
    }

    return NextResponse.json({ success: true, uploaded })
  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}
