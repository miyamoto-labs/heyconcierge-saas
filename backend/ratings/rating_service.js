/**
 * Guest Rating Service for HeyConcierge
 * Schedules and sends rating requests to guests after checkout via Telegram/WhatsApp.
 * Handles inline keyboard callbacks (Telegram) and text responses (WhatsApp).
 *
 * Lifecycle: scheduled → sent → completed/expired
 * Guest phone is NOT stored in guest_ratings — looked up from bookings table.
 */

const { createClient } = require('@supabase/supabase-js');
const { sendTelegram } = require('../whatsapp/telegram_service');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Twilio for WhatsApp
let twilioClient = null;
try {
  twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} catch (e) {
  console.log('Twilio not configured — WhatsApp ratings disabled');
}

const RATING_DELAY_HOURS = 2;
const RATING_EXPIRY_HOURS = 24;

/**
 * Scan bookings for today's checkouts and schedule rating requests.
 * Runs on the 15-min cron interval.
 */
async function scanAndScheduleRatings() {
  const today = new Date().toISOString().split('T')[0];

  // Get today's checkouts that have a guest_phone
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, property_id, guest_phone, check_out')
    .eq('check_out', today)
    .not('guest_phone', 'is', null);

  if (error || !bookings || bookings.length === 0) return { scheduled: 0 };

  let scheduled = 0;

  for (const booking of bookings) {
    if (!booking.guest_phone) continue;

    // Check if rating already exists for this booking
    const { data: existing } = await supabase
      .from('guest_ratings')
      .select('id')
      .eq('booking_id', booking.id)
      .limit(1)
      .single();

    if (existing) continue;

    // Schedule 2 hours after checkout (checkout date at noon + 2h = 14:00)
    const scheduledAt = new Date(booking.check_out);
    scheduledAt.setHours(14, 0, 0, 0); // Assume noon checkout + 2h

    const channel = booking.guest_phone.startsWith('tg:') ? 'telegram' : 'whatsapp';

    const { error: insertErr } = await supabase
      .from('guest_ratings')
      .insert({
        property_id: booking.property_id,
        booking_id: booking.id,
        channel,
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
      });

    if (!insertErr) {
      scheduled++;
    } else {
      console.error(`Failed to schedule rating for booking ${booking.id}:`, insertErr.message);
    }
  }

  if (scheduled > 0) {
    console.log(`⭐ Scheduled ${scheduled} rating request(s)`);
  }
  return { scheduled };
}

/**
 * Send all due rating requests (scheduled_at <= now, status = scheduled)
 */
async function sendDueRatings() {
  const { data: ratings, error } = await supabase
    .from('guest_ratings')
    .select('*, bookings(guest_phone, guest_name), properties(name)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  if (error || !ratings || ratings.length === 0) return { sent: 0 };

  let sent = 0;

  for (const rating of ratings) {
    const guestPhone = rating.bookings?.guest_phone;
    const propertyName = rating.properties?.name || 'your property';

    if (!guestPhone) continue;

    let success = false;

    if (rating.channel === 'telegram') {
      const chatId = guestPhone.replace('tg:', '');
      success = await sendTelegramRatingRequest(chatId, propertyName, rating.id);
    } else {
      success = await sendWhatsAppRatingRequest(guestPhone, propertyName);
    }

    if (success) {
      await supabase
        .from('guest_ratings')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + RATING_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', rating.id);
      sent++;
    }
  }

  if (sent > 0) {
    console.log(`⭐ Sent ${sent} rating request(s)`);
  }
  return { sent };
}

/**
 * Send Telegram rating request with inline keyboard buttons
 */
async function sendTelegramRatingRequest(chatId, propertyName, ratingId) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `⭐ <b>How well did your concierge take care of you during your stay at ${propertyName}?</b>\n\nTap a rating below:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1 ⭐', callback_data: `rating_${ratingId}_1` },
              { text: '2 ⭐', callback_data: `rating_${ratingId}_2` },
              { text: '3 ⭐', callback_data: `rating_${ratingId}_3` },
              { text: '4 ⭐', callback_data: `rating_${ratingId}_4` },
              { text: '5 ⭐', callback_data: `rating_${ratingId}_5` },
            ]
          ]
        }
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram rating send error:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Telegram rating send failed:', err.message);
    return false;
  }
}

/**
 * Send WhatsApp rating request (text-based, no inline buttons)
 */
async function sendWhatsAppRatingRequest(guestPhone, propertyName) {
  if (!twilioClient) return false;
  try {
    const formattedTo = guestPhone.startsWith('whatsapp:') ? guestPhone : `whatsapp:${guestPhone}`;
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: formattedTo,
      body: `⭐ How well did your concierge take care of you during your stay at ${propertyName}?\n\nPlease reply with a number from 1 to 5:\n1 = Poor\n2 = Below average\n3 = Average\n4 = Good\n5 = Excellent`
    });
    return true;
  } catch (err) {
    console.error('WhatsApp rating send failed:', err.message);
    return false;
  }
}

/**
 * Handle Telegram callback query for rating buttons.
 * callback_data format: rating_{ratingId}_{score}
 * Returns a response message or null if not a rating callback.
 */
async function handleRatingCallback(callbackData, chatId) {
  const match = callbackData.match(/^rating_([a-f0-9-]+)_(\d)$/);
  if (!match) return null;

  const ratingId = match[1];
  const score = parseInt(match[2]);

  if (score < 1 || score > 5) return null;

  // Verify the rating exists and is in 'sent' status
  const { data: rating, error } = await supabase
    .from('guest_ratings')
    .select('id, status')
    .eq('id', ratingId)
    .eq('status', 'sent')
    .single();

  if (error || !rating) {
    return 'This rating request has expired or was already submitted.';
  }

  // Store the rating
  await supabase
    .from('guest_ratings')
    .update({
      rating: score,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', ratingId);

  console.log(`⭐ Rating received: ${score}/5 for rating ${ratingId}`);

  const stars = '⭐'.repeat(score);
  return `${stars}\n\nThank you for your ${score}-star rating! Would you like to add a comment? Just type your thoughts, or send "skip" to finish.`;
}

/**
 * Handle a text message that might be a rating comment.
 * Check if the guest has a recently completed rating without a comment.
 * Returns a response message or null if not a rating comment.
 */
async function handleRatingComment(guestPhone, text) {
  const normalized = text.trim().toLowerCase();

  // Find a recently completed rating without a comment for this guest
  // Look up via booking → guest_phone
  const { data: ratings, error } = await supabase
    .from('guest_ratings')
    .select('id, booking_id, completed_at, comment, bookings(guest_phone)')
    .eq('status', 'completed')
    .is('comment', null)
    .order('completed_at', { ascending: false })
    .limit(10);

  if (error || !ratings) return null;

  // Find the one matching this guest
  const match = ratings.find(r => r.bookings?.guest_phone === guestPhone);
  if (!match) return null;

  // Check if completed recently (within 1 hour)
  const completedAt = new Date(match.completed_at);
  if (Date.now() - completedAt.getTime() > 60 * 60 * 1000) return null;

  // Guest wants to skip
  if (/^(skip|no|nei|nope|pass)$/i.test(normalized)) {
    // Mark as done by setting empty comment
    await supabase
      .from('guest_ratings')
      .update({ comment: '' })
      .eq('id', match.id);
    return '👍 No problem! Thank you for your rating.';
  }

  // Store the comment
  await supabase
    .from('guest_ratings')
    .update({ comment: text.trim() })
    .eq('id', match.id);

  console.log(`💬 Rating comment received for ${match.id}`);
  return '🙏 Thank you for your feedback! It really helps.';
}

/**
 * Handle WhatsApp text response for rating (1-5 number).
 * Returns a response message or null if not a rating response.
 */
async function handleWhatsAppRatingResponse(guestPhone, text) {
  const normalized = text.trim();

  // Check if it's a 1-5 number
  if (/^[1-5]$/.test(normalized)) {
    const score = parseInt(normalized);

    // Find most recent sent rating for this guest via booking
    const { data: ratings } = await supabase
      .from('guest_ratings')
      .select('id, bookings(guest_phone)')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(10);

    if (!ratings) return null;

    const match = ratings.find(r => r.bookings?.guest_phone === guestPhone);
    if (!match) return null;

    await supabase
      .from('guest_ratings')
      .update({
        rating: score,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    console.log(`⭐ WhatsApp rating received: ${score}/5 for rating ${match.id}`);

    const stars = '⭐'.repeat(score);
    return `${stars}\n\nThank you for your ${score}-star rating! Would you like to add a comment? Just type your thoughts, or send "skip" to finish.`;
  }

  return null;
}

/**
 * Expire stale ratings (sent but no response after 24h)
 */
async function expireStaleRatings() {
  const { data, error } = await supabase
    .from('guest_ratings')
    .update({ status: 'expired' })
    .eq('status', 'sent')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`⏰ Expired ${count} stale rating request(s)`);
  }
  return { expired: count };
}

module.exports = {
  scanAndScheduleRatings,
  sendDueRatings,
  handleRatingCallback,
  handleRatingComment,
  handleWhatsAppRatingResponse,
  expireStaleRatings,
};
