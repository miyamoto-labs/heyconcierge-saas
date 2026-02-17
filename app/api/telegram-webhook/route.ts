import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

// --- Telegram helpers ---

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

async function sendPhoto(chatId: number, photoUrl: string) {
  await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl }),
  })
}

// --- Property context (mirrors backend/whatsapp_server.js) ---

function buildPropertyContext(property: any, config: any): string {
  let context = `
Property: ${property.name}
Location: ${property.address || 'N/A'}
Type: ${property.property_type || 'N/A'}

WiFi Network: ${config.wifi_network || 'Not provided'}
WiFi Password: ${config.wifi_password || 'Not provided'}

Check-in Instructions:
${config.checkin_instructions || 'Not provided'}

Local Tips:
${config.local_tips || 'Not provided'}

House Rules:
${config.house_rules || 'Not provided'}`

  if (config.booking_url) {
    context += `\n\nBooking / Reservation URL: ${config.booking_url}
(Use this when guests ask about booking additional nights, extending their stay, or making future reservations)`
  }

  return context.trim()
}

// --- Image auto-attach (mirrors backend/whatsapp_server.js) ---

async function autoAttachImages(chatId: number, guestMessage: string, aiReply: string, propertyId: string) {
  try {
    const { data: images } = await supabase
      .from('property_images')
      .select('url, tags')
      .eq('property_id', propertyId)

    if (!images || images.length === 0) return

    const combinedText = (guestMessage + ' ' + aiReply).toLowerCase()
    let imagesToSend: { url: string }[] = []

    if (/key\s*box|nøkkel|inngang|entry|check.?in|how to (get|enter)|hvordan komme|schlüssel|eingang|llave|entrada/i.test(combinedText)) {
      imagesToSend = images.filter(img => img.tags?.some((t: string) => ['entry', 'keybox', 'checkin'].includes(t))).slice(0, 4)
    } else if (/parking|parkering|parken|aparcamiento|where (do i|can i) park/i.test(combinedText)) {
      imagesToSend = images.filter(img => img.tags?.includes('parking')).slice(0, 2)
    } else if (/view|utsikt|vista|aussicht/i.test(combinedText)) {
      imagesToSend = images.filter(img => img.tags?.includes('view')).slice(0, 2)
    } else if (/pool|gym|fitness|amenity|facilities|swimming|sauna/i.test(combinedText)) {
      imagesToSend = images.filter(img => img.tags?.includes('amenity')).slice(0, 2)
    }

    for (const img of imagesToSend) {
      await sendPhoto(chatId, img.url)
    }
  } catch (err) {
    console.error('Image auto-attach error:', err)
  }
}

// --- Main webhook handler ---

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update = await request.json()
    const message = update.message

    // Only handle text messages in private chats
    if (!message?.text || message.chat?.type !== 'private') {
      return NextResponse.json({ ok: true })
    }

    const chatId: number = message.chat.id
    const text: string = message.text.trim()
    const firstName: string = message.from?.first_name || 'Guest'

    // --- Handle /start command ---
    if (text.startsWith('/start')) {
      const propertyId = text.split(' ')[1]?.trim()

      if (!propertyId) {
        await sendMessage(chatId, 'Welcome to HeyConcierge! To get started, please scan the QR code at your property.')
        return NextResponse.json({ ok: true })
      }

      // Look up property
      const { data: property } = await supabase
        .from('properties')
        .select('id, name')
        .eq('id', propertyId)
        .single()

      if (!property) {
        await sendMessage(chatId, "I couldn't find that property. Please check the QR code and try again.")
        return NextResponse.json({ ok: true })
      }

      // Upsert guest session
      const { data: existing } = await supabase
        .from('guest_sessions')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single()

      if (existing) {
        await supabase
          .from('guest_sessions')
          .update({ property_id: propertyId, updated_at: new Date().toISOString() })
          .eq('telegram_chat_id', chatId)
      } else {
        await supabase
          .from('guest_sessions')
          .insert({ telegram_chat_id: chatId, property_id: propertyId })
      }

      await sendMessage(chatId,
        `Welcome to *${property.name}*, ${firstName}! 🏠\n\n` +
        `I'm your AI concierge. Ask me anything about:\n` +
        `• WiFi & check-in instructions\n` +
        `• Local tips & recommendations\n` +
        `• House rules & amenities\n\n` +
        `How can I help you?`
      )
      return NextResponse.json({ ok: true })
    }

    // --- Regular message: resolve session ---
    const { data: session } = await supabase
      .from('guest_sessions')
      .select('property_id')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!session) {
      await sendMessage(chatId, "I don't know which property you're at. Please scan the QR code at your property to connect.")
      return NextResponse.json({ ok: true })
    }

    // Update session timestamp
    await supabase
      .from('guest_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('telegram_chat_id', chatId)

    // Load property + config
    const { data: property } = await supabase
      .from('properties')
      .select('*, property_config_sheets(*)')
      .eq('id', session.property_id)
      .single()

    if (!property) {
      await sendMessage(chatId, "Something went wrong loading your property. Please try scanning the QR code again.")
      return NextResponse.json({ ok: true })
    }

    const configData = Array.isArray(property.property_config_sheets)
      ? property.property_config_sheets[0]
      : property.property_config_sheets
    const config = configData || {}

    // Check if config is populated
    if (!config.wifi_password && !config.checkin_instructions && !config.local_tips && !config.house_rules) {
      await sendMessage(chatId, `Hi ${firstName}! The host for *${property.name}* hasn't set up the concierge information yet. Please contact your host directly for check-in details.`)
      return NextResponse.json({ ok: true })
    }

    // Rate limiting: max 30 messages per minute
    const { count } = await supabase
      .from('goconcierge_messages')
      .select('*', { count: 'exact', head: true })
      .eq('guest_phone', `tg:${chatId}`)
      .gte('created_at', new Date(Date.now() - 60000).toISOString())

    if ((count || 0) >= 30) {
      await sendMessage(chatId, "You're sending messages too quickly. Please wait a moment.")
      return NextResponse.json({ ok: true })
    }

    // Fetch conversation history (last 5 user+assistant pairs = 10 rows)
    const { data: history } = await supabase
      .from('goconcierge_messages')
      .select('role, content')
      .eq('property_id', property.id)
      .eq('guest_phone', `tg:${chatId}`)
      .order('created_at', { ascending: false })
      .limit(10)

    // Build Claude messages with history
    const messages: { role: 'user' | 'assistant'; content: string }[] = []
    for (const h of (history || []).reverse()) {
      if (h.role === 'user' || h.role === 'assistant') {
        messages.push({ role: h.role, content: h.content })
      }
    }
    messages.push({ role: 'user', content: text })

    // Build context and call Claude
    const propertyContext = buildPropertyContext(property, config)

    const systemPrompt = `You are a helpful, friendly AI concierge for ${property.name}.

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
- You are fluent in all major languages including Norwegian, English, German,
  French, Spanish, Swedish, Dutch, Italian, Japanese, Chinese, and Korean.
- Do NOT mention that you are detecting their language. Just respond naturally.

RESPONSE GUIDELINES:
- Keep responses concise and chat-friendly (under 1000 characters when possible).
- Use line breaks for readability, but avoid excessive formatting.
- Be warm and helpful.
- Include Google Maps links when recommending places:
  https://www.google.com/maps/search/?api=1&query=<place+city>
- If you do not know an answer, say so honestly and suggest contacting the host.
- Never invent information about the property that is not in the profile data.

Here's the property information you have access to:

${propertyContext}`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      await sendMessage(chatId, "I'm having trouble right now. Please try again later.")
      console.error('ANTHROPIC_API_KEY not configured')
      return NextResponse.json({ ok: true })
    }

    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    // Send reply
    await sendMessage(chatId, reply)

    // Auto-attach images
    await autoAttachImages(chatId, text, reply, property.id)

    // Log conversation (user message + assistant reply as separate rows)
    await supabase.from('goconcierge_messages').insert([
      {
        property_id: property.id,
        guest_phone: `tg:${chatId}`,
        guest_name: firstName,
        role: 'user',
        content: text,
        channel: 'telegram',
      },
      {
        property_id: property.id,
        guest_phone: `tg:${chatId}`,
        guest_name: firstName,
        role: 'assistant',
        content: reply,
        channel: 'telegram',
      },
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true })
  }
}
