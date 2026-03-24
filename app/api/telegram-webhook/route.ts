import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import {
  searchActivities,
  formatActivitiesForPrompt,
  logAffiliateClick,
  ACTIVITY_SEARCH_TOOL,
  ACTIVITY_DETAILS_TOOL,
} from '@/lib/activities'
import type {
  Activity,
  ActivitySearchParams,
  PropertyOTAConfig,
} from '@/lib/activities'

export const maxDuration = 30

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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

async function autoAttachImages(chatId: number, guestMessage: string, aiReply: string, propertyId: string, supabase: ReturnType<typeof getSupabase>) {
  try {
    const { data } = await supabase
      .from('property_images')
      .select('url, tags')
      .eq('property_id', propertyId)

    const images = data as { url: string; tags: string[] | null }[] | null
    if (!images || images.length === 0) return

    const combinedText = (guestMessage + ' ' + aiReply).toLowerCase()
    let imagesToSend: { url: string }[] = []

    if (/key\s*box|nøkkel|inngang|entry|check.?in|how to (get|enter)|hvordan komme|schlüssel|eingang|llave|entrada/i.test(combinedText)) {
      imagesToSend = images.filter(img => img.tags?.some(t => ['entry', 'keybox', 'checkin'].includes(t))).slice(0, 4)
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

// --- Load OTA config for property ---

async function loadOTAConfig(
  supabase: ReturnType<typeof getSupabase>,
  propertyId: string,
): Promise<PropertyOTAConfig | null> {
  const { data } = await supabase
    .from('property_ota_configs')
    .select('*')
    .eq('property_id', propertyId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    propertyId: data.property_id,
    getyourguideEnabled: data.getyourguide_enabled,
    viatorEnabled: data.viator_enabled,
    autoRecommend: data.auto_recommend,
    maxRecommendations: data.max_recommendations,
    minRating: data.min_rating,
    maxPriceEur: data.max_price_eur,
    preferredCategories: data.preferred_categories || [],
    customMessage: data.custom_message,
  }
}

// --- Handle Claude tool calls for activity search ---

async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  property: any,
  otaConfig: PropertyOTAConfig | null,
  supabase: ReturnType<typeof getSupabase>,
  lastSearchResults: Activity[],
): Promise<{ result: string; activities: Activity[] }> {
  if (toolName === 'search_activities') {
    // Property must have location
    if (!property.latitude || !property.longitude) {
      return {
        result: 'Activity search is not available — property location (lat/long) is not configured yet.',
        activities: [],
      }
    }

    const searchParams: ActivitySearchParams = {
      query: (toolInput.query as string) || undefined,
      latitude: Number(property.latitude),
      longitude: Number(property.longitude),
      radiusKm: 25,
      currency: 'EUR',
      startDate: (toolInput.date as string) || undefined,
      participants: (toolInput.participants as number) || 2,
      maxPriceAmount: (toolInput.max_price as number) || undefined,
      limit: otaConfig?.maxRecommendations || 5,
    }

    const searchResult = await searchActivities(
      searchParams,
      otaConfig,
      supabase,
      property.id,
    )

    if (searchResult.activities.length === 0) {
      return {
        result: 'No activities found matching the search criteria near this property.',
        activities: [],
      }
    }

    // Log affiliate impressions for all recommended activities
    for (const activity of searchResult.activities) {
      await logAffiliateClick(supabase, property.id, activity)
    }

    const formatted = formatActivitiesForPrompt(
      searchResult.activities,
      otaConfig?.maxRecommendations || 5,
    )

    return {
      result: `Found ${searchResult.totalCount} activities. Here are the top recommendations:\n\n${formatted}`,
      activities: searchResult.activities,
    }
  }

  if (toolName === 'get_activity_details') {
    const activityNumber = (toolInput.activity_number as number) || 0
    const idx = activityNumber - 1

    if (idx < 0 || idx >= lastSearchResults.length) {
      return {
        result: `Activity #${activityNumber} not found. There are ${lastSearchResults.length} activities in the last search results.`,
        activities: lastSearchResults,
      }
    }

    const activity = lastSearchResults[idx]
    const durationStr = activity.durationMinutes
      ? activity.durationMinutes < 60
        ? `${activity.durationMinutes} min`
        : `${Math.floor(activity.durationMinutes / 60)}h${activity.durationMinutes % 60 > 0 ? ` ${activity.durationMinutes % 60}min` : ''}`
      : null

    const details = [
      `Name: ${activity.name}`,
      `Provider: ${activity.provider === 'getyourguide' ? 'GetYourGuide' : 'Viator'}`,
      `Price: ${activity.price.formatted}`,
      activity.rating ? `Rating: ${activity.rating}/5 (${activity.reviewCount} reviews)` : null,
      durationStr ? `Duration: ${durationStr}` : null,
      activity.description ? `\nDescription: ${activity.description.substring(0, 500)}` : null,
      activity.highlights?.length ? `\nHighlights:\n${activity.highlights.map(h => `• ${h}`).join('\n')}` : null,
      activity.cancellationPolicy ? `\nCancellation: ${activity.cancellationPolicy}` : null,
      `\nBook here: ${activity.bookingUrl}`,
    ]
      .filter(Boolean)
      .join('\n')

    // Log the detail view click
    await logAffiliateClick(supabase, property.id, activity)

    return {
      result: details,
      activities: lastSearchResults,
    }
  }

  return {
    result: `Unknown tool: ${toolName}`,
    activities: lastSearchResults,
  }
}

// --- Main webhook handler ---

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  try {
    const update = await request.json()
    const message = update.message

    // Only handle text messages in private chats
    if (!message?.text || message.chat?.type !== 'private') {
      return NextResponse.json({ ok: true })
    }

    const chatId: number = Number(message.chat.id)
    if (!Number.isInteger(chatId) || chatId === 0) {
      return NextResponse.json({ ok: true })
    }
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
        `• Activities, tours & experiences nearby\n` +
        `• House rules & amenities\n\n` +
        `How can I help you?`
      )
      return NextResponse.json({ ok: true })
    }

    // --- Regular message: resolve session ---
    const { data: session, error: sessionErr } = await supabase
      .from('guest_sessions')
      .select('property_id')
      .eq('telegram_chat_id', chatId)
      .single()

    if (sessionErr || !session) {
      await sendMessage(chatId, "I don't know which property you're at. Please scan the QR code at your property to connect.")
      return NextResponse.json({ ok: true })
    }

    // Update session timestamp
    await supabase
      .from('guest_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('telegram_chat_id', chatId)

    // Check if this is an upsell response (YES/NO/JA/SI etc.)
    const { handleUpsellResponse } = await import('@/lib/upsell')
    const guestPhone = `tg:${chatId}`
    const upsellReply = await handleUpsellResponse(supabase, guestPhone, text)
    if (upsellReply) {
      await sendMessage(chatId, upsellReply)
      // Log the upsell conversation
      try {
        await supabase.from('goconcierge_messages').insert([
          { property_id: session.property_id, guest_phone: guestPhone, guest_name: firstName, role: 'user', content: text, channel: 'telegram' },
          { property_id: session.property_id, guest_phone: guestPhone, guest_name: firstName, role: 'assistant', content: upsellReply, channel: 'telegram' },
        ])
      } catch (logErr) {
        console.error('Failed to log upsell conversation:', logErr)
      }
      return NextResponse.json({ ok: true })
    }

    // Load property + config
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('*, property_config_sheets(*)')
      .eq('id', session.property_id)
      .single()

    if (propErr || !property) {
      await sendMessage(chatId, `Error loading property: ${propErr?.message || 'not found'}`)
      return NextResponse.json({ ok: true })
    }

    const configData = Array.isArray(property.property_config_sheets)
      ? property.property_config_sheets[0]
      : property.property_config_sheets
    const config = configData || {}

    // Check if config is populated
    if (!config.wifi_password && !config.checkin_instructions && !config.local_tips && !config.house_rules) {
      await sendMessage(chatId, `Hi ${firstName}! The host for ${property.name} hasn't set up the concierge information yet. Please contact your host directly for check-in details.`)
      return NextResponse.json({ ok: true })
    }

    // Load OTA config (for activity search feature)
    const otaConfig = await loadOTAConfig(supabase, property.id)

    // Fetch conversation history (last 5 user+assistant pairs = 10 rows)
    const { data: history } = await supabase
      .from('goconcierge_messages')
      .select('role, content')
      .eq('property_id', property.id)
      .eq('guest_phone', `tg:${chatId}`)
      .order('created_at', { ascending: false })
      .limit(10)

    // Build Claude messages with history
    const claudeMessages: Anthropic.MessageParam[] = []
    for (const h of (history || []).reverse()) {
      if (h.role === 'user' || h.role === 'assistant') {
        claudeMessages.push({ role: h.role, content: h.content })
      }
    }
    claudeMessages.push({ role: 'user', content: text })

    // Build context and call Claude
    const propertyContext = buildPropertyContext(property, config)

    // Determine if activity tools should be available
    const hasLocation = property.latitude && property.longitude
    const activityToolsEnabled = hasLocation && (otaConfig?.autoRecommend !== false)

    const activitySystemPromptSection = activityToolsEnabled
      ? `

ACTIVITIES & TOURS:
When guests ask about activities, tours, things to do, experiences, sightseeing, excursions,
or anything fun to do nearby — use the search_activities tool to find options.
- Present the top 3-5 results naturally, with name, price, duration, rating, and the booking link.
- Always include the booking link so the guest can book directly.
- If a guest asks for more details about a specific option, use the get_activity_details tool.
- Adapt recommendations to the guest's language, interests, and group size if mentioned.
- If no activities are found, suggest checking GetYourGuide or Viator directly.`
      : ''

    const systemPrompt = `You are a helpful, friendly AI concierge for ${property.name}.

Your job is to assist guests with:
- Check-in/check-out procedures
- WiFi passwords and access codes
- Local recommendations (restaurants, attractions, tips)
- House rules and amenities
- General property questions${activityToolsEnabled ? '\n- Activities, tours, and experiences nearby' : ''}

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
${activitySystemPromptSection}

Here's the property information you have access to:

${propertyContext}`

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      await sendMessage(chatId, "ANTHROPIC_API_KEY not configured on server.")
      return NextResponse.json({ ok: true })
    }

    let reply: string
    try {
      const anthropic = new Anthropic({ apiKey })

      // Build tools array (only include activity tools if property has location)
      const tools: Anthropic.Tool[] = []
      if (activityToolsEnabled) {
        tools.push(ACTIVITY_SEARCH_TOOL as unknown as Anthropic.Tool)
        tools.push(ACTIVITY_DETAILS_TOOL as unknown as Anthropic.Tool)
      }

      // First Claude call — may return tool_use blocks
      let response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
        ...(tools.length > 0 ? { tools } : {}),
      })

      // Track search results for get_activity_details tool
      let lastSearchResults: Activity[] = []

      // Tool use loop — handle up to 3 rounds of tool calls
      let toolRounds = 0
      const maxToolRounds = 3

      while (response.stop_reason === 'tool_use' && toolRounds < maxToolRounds) {
        toolRounds++

        // Extract tool use blocks
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock =>
            block.type === 'tool_use',
        )

        if (toolUseBlocks.length === 0) break

        // Build tool results
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolUse of toolUseBlocks) {
          const { result, activities } = await handleToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            property,
            otaConfig,
            supabase,
            lastSearchResults,
          )
          lastSearchResults = activities
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          })
        }

        // Continue conversation with tool results
        const continuationMessages: Anthropic.MessageParam[] = [
          ...claudeMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ]

        response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: continuationMessages,
          ...(tools.length > 0 ? { tools } : {}),
        })
      }

      // Extract the final text reply
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      )
      reply = textBlocks.map((b) => b.text).join('\n') || ''

    } catch (aiErr) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr)
      await sendMessage(chatId, `AI error: ${msg}`)
      return NextResponse.json({ ok: true })
    }

    // Send reply
    await sendMessage(chatId, reply)

    // Auto-attach images
    await autoAttachImages(chatId, text, reply, property.id, supabase)

    // Log conversation (user message + assistant reply as separate rows)
    try {
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
    } catch (logErr) {
      console.error('Failed to log conversation:', logErr)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true })
  }
}
