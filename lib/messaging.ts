// Provider-agnostic messaging — Telegram now, WhatsApp later

export type MessagingProvider = 'telegram' | 'whatsapp'

export function getMessagingProvider(): MessagingProvider {
  return (process.env.MESSAGING_PROVIDER as MessagingProvider) || 'telegram'
}

/**
 * Send a welcome message to a guest after a new reservation.
 * Returns true if the message was sent successfully.
 */
export async function sendWelcomeMessage(
  guestIdentifier: string,
  propertyName: string,
  guestFirstName: string,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  const provider = getMessagingProvider()
  const message = formatWelcomeMessage(propertyName, guestFirstName, checkIn, checkOut)

  if (provider === 'telegram') {
    return sendTelegramMessage(guestIdentifier, message)
  }

  // WhatsApp path — ready to implement when approved
  // if (provider === 'whatsapp') {
  //   return sendWhatsAppTemplate(guestIdentifier, propertyName, checkIn, checkOut)
  // }

  console.warn(`Unknown messaging provider: ${provider}`)
  return false
}

/**
 * Send a plain text message via Telegram.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_CHAT_SUPPORT_BOT_TOKEN
  if (!token) {
    console.error('TELEGRAM_CHAT_SUPPORT_BOT_TOKEN not set')
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('Telegram send failed:', err)
      return false
    }
    return true
  } catch (error) {
    console.error('Telegram send error:', error)
    return false
  }
}

function formatWelcomeMessage(
  propertyName: string,
  guestFirstName: string,
  checkIn: string,
  checkOut: string,
): string {
  return (
    `Welcome to *${propertyName}*, ${guestFirstName}! 🏠\n\n` +
    `Your reservation:\n` +
    `📅 Check-in: ${checkIn}\n` +
    `📅 Check-out: ${checkOut}\n\n` +
    `I'm your AI concierge — ask me anything about:\n` +
    `• WiFi & check-in instructions\n` +
    `• Local tips & recommendations\n` +
    `• House rules & amenities\n\n` +
    `How can I help you?`
  )
}
