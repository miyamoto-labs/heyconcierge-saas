import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured on the server' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const { message, property, config } = await request.json()

    if (!message || !property) {
      return NextResponse.json({ error: 'Message and property data required' }, { status: 400 })
    }

    // Fetch property images for context and auto-attach
    const supabase = createAdminClient()
    const { data: propertyImages } = await supabase
      .from('property_images')
      .select('url, tags')
      .eq('property_id', property.id)

    const images = propertyImages as { url: string; tags: string[] | null }[] | null

    // Build property context (mirrors backend/whatsapp_server.js buildPropertyContext)
    let propertyContext = `
Property: ${property.name || 'Unnamed'}
Location: ${property.address || 'N/A'}
Type: ${property.property_type || 'N/A'}

WiFi Network: ${config?.wifi_network || 'Not provided'}
WiFi Password: ${config?.wifi_password || 'Not provided'}

Check-in Instructions:
${config?.checkin_instructions || 'Not provided'}

Local Tips:
${config?.local_tips || 'Not provided'}

House Rules:
${config?.house_rules || 'Not provided'}`

    if (config?.booking_url) {
      propertyContext += `\n\nBooking / Reservation URL: ${config.booking_url}
(Use this when guests ask about booking additional nights, extending their stay, or making future reservations)`
    }

    if (images && images.length > 0) {
      const tagSummary = images.map(img => (img.tags || []).join(', ')).filter(Boolean)
      propertyContext += `\n\nProperty Images Available: ${images.length} image(s) with tags: ${[...new Set(tagSummary.join(', ').split(', '))].join(', ')}
(When guests ask about check-in, entry, parking, etc., relevant photos will be automatically attached to your response.)`
    }

    // System prompt mirrors the real WhatsApp concierge
    const systemPrompt = `You are a helpful, friendly AI concierge for ${property.name || 'this property'}.

Your job is to assist guests with:
- Check-in/check-out procedures
- WiFi passwords and access codes
- Local recommendations (restaurants, attractions, tips)
- House rules and amenities
- General property questions

LANGUAGE BEHAVIOR:
- Detect the language of each guest message.
- ALWAYS respond in the same language the guest used.
- If the language is ambiguous, default to English.

RESPONSE GUIDELINES:
- Keep responses concise and WhatsApp-friendly (under 1000 characters when possible).
- Use line breaks for readability, but avoid excessive formatting.
- Be warm and helpful.
- If you do not know an answer, say so honestly and suggest contacting the host.
- Never invent information about the property that is not in the profile data.
${images && images.length > 0 ? '- When relevant photos are available for a topic (check-in, parking, etc.), mention that photos are attached to help the guest.' : ''}

Here's the property information you have access to:

${propertyContext.trim()}`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Auto-attach images (mirrors telegram-webhook autoAttachImages)
    let attachedImages: { url: string }[] = []
    if (images && images.length > 0) {
      const combinedText = (message + ' ' + reply).toLowerCase()

      if (/key\s*box|nøkkel|inngang|entry|check.?in|how to (get|enter)|hvordan komme|schlüssel|eingang|llave|entrada/i.test(combinedText)) {
        attachedImages = images.filter(img => img.tags?.some(t => ['entry', 'keybox', 'checkin'].includes(t))).slice(0, 4)
      } else if (/parking|parkering|parken|aparcamiento|where (do i|can i) park/i.test(combinedText)) {
        attachedImages = images.filter(img => img.tags?.includes('parking')).slice(0, 2)
      } else if (/view|utsikt|vista|aussicht/i.test(combinedText)) {
        attachedImages = images.filter(img => img.tags?.includes('view')).slice(0, 2)
      } else if (/pool|gym|fitness|amenity|facilities|swimming|sauna/i.test(combinedText)) {
        attachedImages = images.filter(img => img.tags?.includes('amenity')).slice(0, 2)
      }
    }

    return NextResponse.json({ reply, images: attachedImages.map(img => img.url) })
  } catch (error) {
    console.error('Test concierge error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to get AI response'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
