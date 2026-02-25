import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
  })
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_CHAT_SUPPORT_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_SUPPORT_CHAT_ID

const KNOWLEDGE_BASE = `
You are a helpful customer support assistant for HeyConcierge, an AI-powered guest concierge service for vacation rentals.

KEY FEATURES:
- 24/7 instant responses via Telegram, WhatsApp, or SMS
- Multilingual support (50+ languages)
- Property-specific knowledge (WiFi, house rules, local tips)
- Automated guest communication

PRICING:
- Starter: €49/month - 1 property, 500 messages
- Pro: €99/month - 3 properties, 2,000 messages (most popular)
- Enterprise: €249/month - Unlimited properties and messages

HOW IT WORKS:
1. Property owners add their property details in the dashboard
2. Share QR code or contact number with guests
3. Guests message via their preferred platform (Telegram/WhatsApp/SMS)
4. AI responds instantly in guest's language

INTEGRATION:
- No PMS required (but can integrate if needed)
- Simple setup - 5 minutes to get started
- Works with Airbnb, Booking.com, VRBO, direct bookings

ESCALATION:
If you cannot confidently answer a question, or the user needs human help, include the exact tag [ESCALATE] at the very end of your response (after your message to the user). Do this when:
- You don't know the answer or it's outside your knowledge base
- The user asks about their specific account, billing, or payment details
- The user has a complex technical issue you can't resolve
- The user explicitly asks for a human or real person
- The user seems frustrated or unsatisfied with your answers

When escalating, give a brief helpful response first, then add [ESCALATE] at the end.
If you CAN answer confidently, do NOT include [ESCALATE].

Always be friendly, concise, and helpful. Use emojis sparingly. Keep responses under 3 sentences when possible.
`

async function sendTelegramNotification(chatId: string, message: string, userEmail?: string, userName?: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return

  try {
    const notificationText = `
💬 *New Chat Message*

${userName ? `Name: ${userName}` : ''}
${userEmail ? `Email: ${userEmail}` : ''}
Chat ID: \`${chatId}\`

📝 Message:
${message}

Reply in dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/chats
    `.trim()

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: notificationText,
        parse_mode: 'Markdown'
      })
    })
  } catch (error) {
    console.error('Telegram notification error:', error)
  }
}

function shouldEscalate(message: string): boolean {
  const escalationKeywords = [
    'human', 'real person', 'talk to someone', 'speak to team',
    'manager', 'billing', 'payment', 'refund', 'cancel',
    'frustrated', 'angry', 'unhappy', 'disappointed'
  ]

  const lowerMessage = message.toLowerCase()
  return escalationKeywords.some(keyword => lowerMessage.includes(keyword))
}

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, userEmail, userName } = await request.json()


    // Create chat if new
    let finalChatId = chatId
    if (chatId === 'new') {
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          user_email: userEmail || null,
          user_name: userName || null,
          status: 'active'
        })
        .select()
        .single()

      if (createError) throw createError
      finalChatId = newChat.id
    }

    // Save user message
    await supabase.from('messages').insert({
      chat_id: finalChatId,
      sender_type: 'user',
      content: message
    })

    // Get chat status to check if already escalated
    const { data: chatData } = await supabase
      .from('chats')
      .select('status')
      .eq('id', finalChatId)
      .single()

    const isAlreadyEscalated = chatData?.status === 'escalated'

    // If already escalated, just notify team of new message and don't send AI reply
    if (isAlreadyEscalated) {
      await sendTelegramNotification(finalChatId, message, userEmail, userName)

      return NextResponse.json({
        chatId: finalChatId,
        reply: null, // No AI reply when chat is escalated
        escalated: true
      })
    }

    // Check if message should be escalated to human
    if (shouldEscalate(message)) {
      await supabase
        .from('chats')
        .update({ status: 'escalated', escalated_at: new Date().toISOString() })
        .eq('id', finalChatId)

      await sendTelegramNotification(finalChatId, message, userEmail, userName)

      const escalationReply = "I'm connecting you with our team — someone will be with you shortly! 😊"
      await supabase.from('messages').insert({
        chat_id: finalChatId,
        sender_type: 'ai',
        content: escalationReply
      })

      return NextResponse.json({
        chatId: finalChatId,
        reply: escalationReply,
        escalated: true
      })
    }

    // Get conversation history for context
    const { data: history } = await supabase
      .from('messages')
      .select('sender_type, content')
      .eq('chat_id', finalChatId)
      .order('created_at', { ascending: true })
      .limit(20)

    const conversationMessages = (history || []).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }))

    // Call Claude API
    const aiResponse = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: KNOWLEDGE_BASE,
      messages: conversationMessages
    })

    let aiReply = aiResponse.content[0].type === 'text'
      ? aiResponse.content[0].text
      : 'Sorry, I couldn\'t generate a response. Please try again.'

    // Check if AI wants to escalate
    const aiWantsEscalation = aiReply.includes('[ESCALATE]')
    aiReply = aiReply.replace('[ESCALATE]', '').trim()

    // Save AI reply
    await supabase.from('messages').insert({
      chat_id: finalChatId,
      sender_type: 'ai',
      content: aiReply
    })

    // If AI flagged escalation, hand off to human
    if (aiWantsEscalation) {
      await supabase
        .from('chats')
        .update({ status: 'escalated', escalated_at: new Date().toISOString() })
        .eq('id', finalChatId)

      await sendTelegramNotification(finalChatId, message, userEmail, userName)

      // Add handoff message after the AI's response
      const handoffMessage = "I've connected you with our team — a real person will follow up shortly!"
      await supabase.from('messages').insert({
        chat_id: finalChatId,
        sender_type: 'ai',
        content: handoffMessage
      })

      return NextResponse.json({
        chatId: finalChatId,
        reply: aiReply + '\n\n' + handoffMessage,
        escalated: true
      })
    }

    return NextResponse.json({
      chatId: finalChatId,
      reply: aiReply,
      escalated: false
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
