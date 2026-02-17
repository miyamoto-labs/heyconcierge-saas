import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Test concierge error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to get AI response'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
