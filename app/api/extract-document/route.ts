import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFromPDF, extractFromDOCX } from '@/lib/document-extraction'
import { tagImage } from '@/lib/image-tagger'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const EXTRACT_ALL_PROMPT = `You are a property information extractor. From the given document text, extract the following 4 categories. Return ONLY valid JSON with these exact keys:

{
  "wifi_password": "the WiFi network name and password, or null if not found",
  "checkin_instructions": "check-in instructions including key location, door codes, arrival steps, parking info, or null if not found",
  "local_tips": "local tips and recommendations like restaurants, attractions, transport, shops, things to do, or null if not found",
  "house_rules": "house rules like quiet hours, smoking policy, pet policy, trash, checkout procedures, dos and don'ts, or null if not found"
}

Rules:
- Return raw JSON only, no markdown fences or extra text
- Use null (not the string "null") for categories not found in the document
- Keep extracted text concise but complete
- Preserve important details like specific times, codes, addresses, and names`

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const propertyId = formData.get('propertyId') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // Verify property belongs to user's org (if propertyId provided)
    const supabase = createAdminClient()
    if (propertyId && org) {
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

    // Extract text and images from all files
    const allTexts: string[] = []
    const allImages: { buffer: Buffer; mimeType: string; contextText: string; sourceFilename: string }[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name.toLowerCase()

      try {
        if (fileName.endsWith('.pdf')) {
          const result = await extractFromPDF(buffer)
          allTexts.push(result.text)
          allImages.push(...result.images)
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          const result = await extractFromDOCX(buffer)
          allTexts.push(result.text)
          allImages.push(...result.images)
        } else {
          console.warn(`Skipping unsupported file type: ${file.name}`)
        }
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err)
      }
    }

    if (allTexts.length === 0) {
      return NextResponse.json(
        { error: 'No content could be extracted from the uploaded files' },
        { status: 400 }
      )
    }

    // Extract structured text data via Claude
    const combinedText = allTexts.join('\n\n--- NEXT DOCUMENT ---\n\n')
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: EXTRACT_ALL_PROMPT,
      messages: [
        { role: 'user', content: `Extract all property information from this document:\n\n${combinedText}` },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    let extracted: Record<string, string | null>
    try {
      const cleaned = responseText
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      extracted = JSON.parse(cleaned)
    } catch {
      console.error('Claude raw response:', responseText)
      extracted = { wifi_password: null, checkin_instructions: null, local_tips: null, house_rules: null }
    }

    // Process images: tag with AI and store in Supabase (if propertyId provided)
    const extractedImages: {
      url: string
      filename: string
      suggested_tags: string[]
      context_text: string
      ai_description: string
    }[] = []

    if (propertyId && allImages.length > 0) {
      // Check existing image count
      const { count: existingCount } = await supabase
        .from('property_images')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId)

      const maxTotal = 10
      const available = Math.max(0, maxTotal - (existingCount || 0))
      const imagesToProcess = allImages.slice(0, Math.min(available, 10))

      for (const img of imagesToProcess) {
        try {
          // Auto-tag with Claude Vision
          const tagResult = await tagImage(img.buffer, img.mimeType, img.contextText)

          // Upload to Supabase Storage
          const ext = img.mimeType.includes('png') ? 'png' : 'jpg'
          const storagePath = `${propertyId}/${Date.now()}_${img.sourceFilename.replace(/\.[^.]+$/, '')}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(storagePath, img.buffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: img.mimeType,
            })

          if (uploadError) {
            console.error('Image upload error:', uploadError)
            continue
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('property-images').getPublicUrl(storagePath)

          // Insert into property_images table
          const { error: dbError } = await supabase.from('property_images').insert({
            property_id: propertyId,
            url: publicUrl,
            filename: img.sourceFilename,
            tags: tagResult.tags,
          })

          if (dbError) {
            console.error('Image DB insert error:', dbError)
            continue
          }

          extractedImages.push({
            url: publicUrl,
            filename: img.sourceFilename,
            suggested_tags: tagResult.tags,
            context_text: img.contextText.substring(0, 200),
            ai_description: tagResult.description,
          })
        } catch (err) {
          console.error(`Failed to process image ${img.sourceFilename}:`, err)
        }
      }
    }

    return NextResponse.json({
      wifi_password: extracted.wifi_password ?? null,
      checkin_instructions: extracted.checkin_instructions ?? null,
      local_tips: extracted.local_tips ?? null,
      house_rules: extracted.house_rules ?? null,
      extracted_images: extractedImages,
      image_count_skipped: Math.max(0, allImages.length - extractedImages.length),
    })
  } catch (error) {
    console.error('Document extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Document extraction failed' },
      { status: 500 }
    )
  }
}
