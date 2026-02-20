/**
 * Telegram Bot Service for HeyConcierge
 * Handles sending messages and managing webhooks via Telegram Bot API
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Send a Telegram message
 */
async function sendTelegram(chatId, text) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram send error:', data.description);
      return false;
    }
    console.log(`✅ Telegram sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error('Telegram send failed:', error.message);
    return false;
  }
}

/**
 * Extract property code from Telegram /start deep link or message
 * Deep link format: /start HC-ABCD or just HC-ABCD in message
 */
function extractTelegramPropertyCode(text) {
  if (!text) return null;
  // Match /start CODE or just CODE (e.g. HC-ABCD, THO-0001, SUNSET-42)
  const match = text.match(/(?:\/start\s+)?(\b[A-Z]{2,}-[A-Z0-9]{2,}\b)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Resolve Telegram guest to property (similar to WhatsApp resolveGuestProperty)
 * Uses tg:chatId as the guest identifier
 */
async function resolveTelegramGuestProperty(chatId, messageText) {
  const guestPhone = `tg:${chatId}`;

  // 1. Check existing session
  const { data: session } = await supabase
    .from('guest_sessions')
    .select('property_id')
    .eq('guest_phone', guestPhone)
    .single();

  if (session) {
    await supabase
      .from('guest_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('guest_phone', guestPhone);
    return { propertyId: session.property_id, isNew: false, guestPhone };
  }

  // 2. Try to extract property code
  const code = extractTelegramPropertyCode(messageText);
  if (code) {
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('property_code', code)
      .single();

    if (property) {
      await supabase.from('guest_sessions').insert({
        guest_phone: guestPhone,
        property_id: property.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log(`✅ Created Telegram session: ${guestPhone} → ${property.id}`);
      return { propertyId: property.id, isNew: true, guestPhone };
    }
  }

  return { propertyId: null, isNew: false, guestPhone };
}

/**
 * Set Telegram webhook URL
 */
async function setWebhook(url) {
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return res.json();
}

/**
 * Get current webhook info
 */
async function getWebhookInfo() {
  const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  return res.json();
}

module.exports = {
  sendTelegram,
  extractTelegramPropertyCode,
  resolveTelegramGuestProperty,
  setWebhook,
  getWebhookInfo
};
