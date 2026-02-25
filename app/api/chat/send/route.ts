import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

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

ESCALATION TRIGGERS:
Escalate to human if the user:
- Says "talk to human", "speak to someone", "real person"
- Has billing/payment questions
- Has complex technical issues
- Seems frustrated or unsatisfied
- Asks about custom enterprise features

Always be friendly, concise, and helpful. Use emojis sparingly.
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

    const supabase = await createClient()

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

    // Check if should escalate
    const needsEscalation = shouldEscalate(message)

    if (needsEscalation) {
      // Update chat status
      await supabase
        .from('chats')
        .update({ status: 'escalated', escalated_at: new Date().toISOString() })
        .eq('id', finalChatId)

      // Send Telegram notification
      await sendTelegramNotification(finalChatId, message, userEmail, userName)

      // Save escalation message
      await supabase.from('messages').insert({
        chat_id: finalChatId,
        sender_type: 'ai',
        content: "I'll connect you with our team right away! They'll respond shortly. 😊"
      })

      return NextResponse.json({
        chatId: finalChatId,
        reply: "I'll connect you with our team right away! They'll respond shortly. 😊",
        escalated: true
      })
    }

    // Get AI response
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: KNOWLEDGE_BASE,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })

      const aiReply = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Sorry, I had trouble processing that. Can you rephrase?'

      // Save AI response
      await supabase.from('messages').insert({
        chat_id: finalChatId,
        sender_type: 'ai',
        content: aiReply
      })

      return NextResponse.json({
        chatId: finalChatId,
        reply: aiReply,
        escalated: false
      })
    } catch (aiError) {
      console.error('AI response error:', aiError)
      
      // Fallback response
      const fallbackReply = "I'm having a bit of trouble right now. Our team has been notified and will help you shortly!"
      
      // Escalate on AI failure
      await supabase
        .from('chats')
        .update({ status: 'escalated', escalated_at: new Date().toISOString() })
        .eq('id', finalChatId)

      await sendTelegramNotification(finalChatId, message, userEmail, userName)

      return NextResponse.json({
        chatId: finalChatId,
        reply: fallbackReply,
        escalated: true
      })
    }
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
