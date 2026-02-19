/**
 * Upsell Service for HeyConcierge
 * Scans bookings, schedules offers, sends via WhatsApp/Telegram, handles responses
 *
 * Offer types: late_checkout, early_checkin, gap_night, stay_extension, review_request
 * Lifecycle: scheduled → draft → sent → accepted/declined/expired
 */

const { createClient } = require('@supabase/supabase-js');
const { sendTelegram } = require('./telegram_service');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Twilio for WhatsApp
const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Scan bookings and schedule upsell offers based on property configs
 */
async function scanAndScheduleOffers() {
  console.log('🔍 Scanning bookings for upsell opportunities...');

  // Get all enabled upsell configs with their properties
  const { data: configs, error: cfgErr } = await supabase
    .from('upsell_configs')
    .select('*, properties(id, name, property_code)')
    .eq('enabled', true);

  if (cfgErr || !configs) {
    console.error('Failed to fetch upsell configs:', cfgErr?.message);
    return { scheduled: 0 };
  }

  let totalScheduled = 0;

  for (const config of configs) {
    const propertyId = config.property_id;

    // Get upcoming bookings with guest contact info
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'confirmed')
      .gte('check_in', new Date().toISOString().split('T')[0]);

    if (bErr || !bookings) continue;

    for (const booking of bookings) {
      if (!booking.guest_phone) continue;

      const channel = booking.guest_phone.startsWith('tg:') ? 'telegram' : 'whatsapp';

      // Late checkout offer
      if (config.late_checkout_enabled) {
        const sendAt = new Date(booking.check_out);
        sendAt.setHours(sendAt.getHours() - config.late_checkout_send_hours_before);
        if (sendAt > new Date()) {
          await scheduleOffer({
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'late_checkout',
            price: config.late_checkout_price_per_hour * config.late_checkout_max_hours,
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              price_per_hour: config.late_checkout_price_per_hour,
              max_hours: config.late_checkout_max_hours,
              standard_time: config.late_checkout_standard_time
            }
          });
          totalScheduled++;
        }
      }

      // Early check-in offer
      if (config.early_checkin_enabled) {
        const sendAt = new Date(booking.check_in);
        sendAt.setHours(sendAt.getHours() - config.early_checkin_send_hours_before);
        if (sendAt > new Date()) {
          await scheduleOffer({
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'early_checkin',
            price: config.early_checkin_price_per_hour * config.early_checkin_max_hours,
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              price_per_hour: config.early_checkin_price_per_hour,
              max_hours: config.early_checkin_max_hours,
              standard_time: config.early_checkin_standard_time
            }
          });
          totalScheduled++;
        }
      }

      // Stay extension offer
      if (config.stay_extension_enabled) {
        const sendAt = new Date(booking.check_out);
        sendAt.setHours(sendAt.getHours() - config.stay_extension_send_hours_before);
        if (sendAt > new Date()) {
          await scheduleOffer({
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'stay_extension',
            price: null, // Dynamic based on availability
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              discount_pct: config.stay_extension_discount_pct
            }
          });
          totalScheduled++;
        }
      }

      // Review request (after checkout)
      if (config.review_request_enabled) {
        const sendAt = new Date(booking.check_out);
        sendAt.setHours(sendAt.getHours() + config.review_request_send_hours_after);
        if (sendAt > new Date()) {
          await scheduleOffer({
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'review_request',
            price: 0,
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              platform_urls: config.review_request_platform_urls
            }
          });
          totalScheduled++;
        }
      }
    }

    // Gap night offers — check for gaps between bookings
    if (config.gap_night_enabled) {
      const scheduled = await scheduleGapNightOffers(config);
      totalScheduled += scheduled;
    }
  }

  console.log(`✅ Scheduled ${totalScheduled} upsell offers`);
  return { scheduled: totalScheduled };
}

/**
 * Schedule a single offer (skip if duplicate exists)
 */
async function scheduleOffer(offer) {
  // Check for existing offer of same type for same booking
  const { data: existing } = await supabase
    .from('upsell_offers')
    .select('id')
    .eq('booking_id', offer.booking_id)
    .eq('offer_type', offer.offer_type)
    .in('status', ['scheduled', 'draft', 'sent'])
    .single();

  if (existing) return; // Already scheduled

  const { error } = await supabase.from('upsell_offers').insert({
    ...offer,
    status: 'scheduled'
  });

  if (error) {
    console.error(`Failed to schedule ${offer.offer_type}:`, error.message);
  }
}

/**
 * Schedule gap night offers by finding gaps between consecutive bookings
 */
async function scheduleGapNightOffers(config) {
  const propertyId = config.property_id;
  let scheduled = 0;

  // Get confirmed upcoming bookings ordered by check_in
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'confirmed')
    .gte('check_out', new Date().toISOString().split('T')[0])
    .order('check_in', { ascending: true });

  if (!bookings || bookings.length < 2) return 0;

  for (let i = 0; i < bookings.length - 1; i++) {
    const current = bookings[i];
    const next = bookings[i + 1];

    const gapStart = new Date(current.check_out);
    const gapEnd = new Date(next.check_in);
    const gapNights = Math.round((gapEnd - gapStart) / (1000 * 60 * 60 * 24));

    if (gapNights >= 1 && gapNights <= config.gap_night_max_gap) {
      // Offer to the departing guest to extend
      if (current.guest_phone) {
        const sendAt = new Date(current.check_out);
        sendAt.setDate(sendAt.getDate() - config.gap_night_send_days_before);
        if (sendAt > new Date()) {
          const channel = current.guest_phone.startsWith('tg:') ? 'telegram' : 'whatsapp';
          const discountedPrice = config.gap_night_base_price * (1 - config.gap_night_discount_pct / 100);

          await scheduleOffer({
            property_id: propertyId,
            booking_id: current.id,
            offer_type: 'gap_night',
            price: discountedPrice * gapNights,
            guest_phone: current.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              gap_nights: gapNights,
              price_per_night: discountedPrice,
              discount_pct: config.gap_night_discount_pct,
              gap_start: current.check_out,
              gap_end: next.check_in
            }
          });
          scheduled++;
        }
      }
    }
  }

  return scheduled;
}

/**
 * Send all due offers (scheduled_at <= now, status = scheduled)
 */
async function sendDueOffers() {
  console.log('📤 Checking for due upsell offers...');

  const { data: offers, error } = await supabase
    .from('upsell_offers')
    .select('*, properties(name, property_code)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  if (error || !offers || offers.length === 0) {
    console.log('No due offers to send');
    return { sent: 0 };
  }

  let sent = 0;

  for (const offer of offers) {
    const message = formatOfferMessage(offer);

    let success = false;
    if (offer.channel === 'telegram') {
      const chatId = offer.guest_phone.replace('tg:', '');
      success = await sendTelegram(chatId, message);
    } else {
      success = await sendWhatsAppMessage(offer.guest_phone, message);
    }

    if (success) {
      await supabase
        .from('upsell_offers')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_text: message,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', offer.id);
      sent++;
    }
  }

  console.log(`✅ Sent ${sent}/${offers.length} upsell offers`);
  return { sent, total: offers.length };
}

/**
 * Format offer message based on type
 */
function formatOfferMessage(offer) {
  const propertyName = offer.properties?.name || 'your property';
  const details = offer.offer_details || {};

  switch (offer.offer_type) {
    case 'late_checkout':
      return `🕐 *Late Checkout Available!*\n\nEnjoy a relaxed morning at ${propertyName}! ` +
        `Check out up to ${details.max_hours}h later (until ${formatTime(details.standard_time, details.max_hours)}) ` +
        `for just €${offer.price}.\n\n` +
        `Reply *YES* to book or *NO* to decline.`;

    case 'early_checkin':
      return `🌅 *Early Check-in Available!*\n\nArrive early at ${propertyName}! ` +
        `Check in up to ${details.max_hours}h earlier (from ${formatTime(details.standard_time, -details.max_hours)}) ` +
        `for just €${offer.price}.\n\n` +
        `Reply *YES* to book or *NO* to decline.`;

    case 'gap_night':
      return `🌙 *Special Offer: Extra Night(s)!*\n\nWe have ${details.gap_nights} night(s) available ` +
        `right after your stay at ${propertyName}. ` +
        `Get ${details.discount_pct}% off at just €${details.price_per_night}/night ` +
        `(total: €${offer.price}).\n\n` +
        `Reply *YES* to extend your stay or *NO* to decline.`;

    case 'stay_extension':
      return `✨ *Extend Your Stay?*\n\nLoving ${propertyName}? ` +
        `We can offer you ${details.discount_pct}% off extra nights. ` +
        `Reply *YES* if you're interested or *NO* to decline.`;

    case 'review_request':
      const urls = details.platform_urls || {};
      let reviewLinks = '';
      if (urls.google) reviewLinks += `\n📍 Google: ${urls.google}`;
      if (urls.airbnb) reviewLinks += `\n🏠 Airbnb: ${urls.airbnb}`;
      if (urls.tripadvisor) reviewLinks += `\n✈️ TripAdvisor: ${urls.tripadvisor}`;
      return `⭐ *How was your stay at ${propertyName}?*\n\n` +
        `We hope you had a wonderful time! A review would mean the world to us.` +
        (reviewLinks ? `\n${reviewLinks}` : '') +
        `\n\nThank you! 🙏`;

    default:
      return `You have a new offer from ${propertyName}. Reply YES or NO.`;
  }
}

/**
 * Helper: offset a time string by hours
 */
function formatTime(timeStr, offsetHours) {
  if (!timeStr) return '?';
  const [h, m] = timeStr.split(':').map(Number);
  const newH = Math.max(0, Math.min(23, h + offsetHours));
  return `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppMessage(to, message) {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: formattedTo,
      body: message
    });
    return true;
  } catch (error) {
    console.error('WhatsApp send failed:', error.message);
    return false;
  }
}

/**
 * Handle guest response to an upsell offer (YES/NO)
 */
async function handleUpsellResponse(guestPhone, responseText) {
  const normalized = responseText.trim().toUpperCase();
  const isAccept = /^(YES|JA|SI|OUI|YEAH|OK|ACCEPT|BOOK)$/i.test(normalized);
  const isDecline = /^(NO|NEI|NON|NEIN|DECLINE|REJECT|NOPE)$/i.test(normalized);

  if (!isAccept && !isDecline) return null; // Not an upsell response

  // Find the most recent sent offer for this guest
  const { data: offer, error } = await supabase
    .from('upsell_offers')
    .select('*')
    .eq('guest_phone', guestPhone)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !offer) return null;

  const newStatus = isAccept ? 'accepted' : 'declined';

  await supabase
    .from('upsell_offers')
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
      guest_response: normalized
    })
    .eq('id', offer.id);

  console.log(`📬 Upsell ${offer.offer_type} ${newStatus} by ${guestPhone}`);

  // Return confirmation message
  if (isAccept) {
    return `✅ Great! Your ${formatOfferType(offer.offer_type)} has been confirmed. ` +
      (offer.price > 0 ? `Total: €${offer.price}. ` : '') +
      `The host will follow up with details. Thank you!`;
  } else {
    return `👍 No problem! We hope you enjoy your stay.`;
  }
}

/**
 * Format offer type for display
 */
function formatOfferType(type) {
  const labels = {
    late_checkout: 'late checkout',
    early_checkin: 'early check-in',
    gap_night: 'extra night(s)',
    stay_extension: 'stay extension',
    review_request: 'review request'
  };
  return labels[type] || type;
}

/**
 * Expire stale offers (sent but no response after 24h)
 */
async function expireStaleOffers() {
  const { data, error } = await supabase
    .from('upsell_offers')
    .update({ status: 'expired' })
    .eq('status', 'sent')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  const count = data?.length || 0;
  if (count > 0) {
    console.log(`⏰ Expired ${count} stale upsell offers`);
  }
  return { expired: count };
}

/**
 * Get upsell dashboard data for a property
 */
async function getUpsellDashboard(propertyId) {
  const { data: config } = await supabase
    .from('upsell_configs')
    .select('*')
    .eq('property_id', propertyId)
    .single();

  const { data: offers } = await supabase
    .from('upsell_offers')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate stats
  const stats = {
    total: offers?.length || 0,
    sent: offers?.filter(o => ['sent', 'accepted', 'declined', 'expired'].includes(o.status)).length || 0,
    accepted: offers?.filter(o => o.status === 'accepted').length || 0,
    declined: offers?.filter(o => o.status === 'declined').length || 0,
    revenue: offers?.filter(o => o.status === 'accepted').reduce((sum, o) => sum + (o.price || 0), 0) || 0,
    conversionRate: 0
  };
  if (stats.sent > 0) {
    stats.conversionRate = Math.round((stats.accepted / stats.sent) * 100);
  }

  return { config, offers, stats };
}

module.exports = {
  scanAndScheduleOffers,
  sendDueOffers,
  handleUpsellResponse,
  expireStaleOffers,
  getUpsellDashboard
};
