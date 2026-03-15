/**
 * Upsell Engine for HeyConcierge
 * Ported from backend/whatsapp/upsell_service.js to TypeScript for Vercel/Next.js
 *
 * Scans bookings, schedules offers, sends via Telegram, handles YES/NO responses
 * Offer types: late_checkout, early_checkin, gap_night, stay_extension, review_request, activity_recommendation
 * Lifecycle: scheduled → sent → accepted/declined/expired
 */

import { SupabaseClient } from '@supabase/supabase-js'

// Types matching the database schema and frontend interfaces
interface UpsellConfig {
  id: string
  property_id: string
  enabled: boolean
  late_checkout_enabled: boolean
  late_checkout_price_per_hour: number
  late_checkout_max_hours: number
  late_checkout_standard_time: string
  late_checkout_send_hours_before: number
  early_checkin_enabled: boolean
  early_checkin_price_per_hour: number
  early_checkin_max_hours: number
  early_checkin_standard_time: string
  early_checkin_send_hours_before: number
  gap_night_enabled: boolean
  gap_night_discount_pct: number
  gap_night_base_price: number
  gap_night_max_gap: number
  gap_night_send_days_before: number
  stay_extension_enabled: boolean
  stay_extension_discount_pct: number
  stay_extension_send_hours_before: number
  review_request_enabled: boolean
  review_request_send_hours_after: number
  review_request_platform_urls: Record<string, string>
  activity_recommendation_enabled: boolean
  activity_recommendation_send_hours_after_checkin: number
  activity_recommendation_max_activities: number
  activity_recommendation_category_preference: string | null
  activity_recommendation_radius_km: number
  auto_send: boolean
  message_language: string
  properties?: { id: string; name: string; property_code: string }
}

interface Booking {
  id: string
  property_id: string
  guest_name: string
  guest_phone: string | null
  check_in: string
  check_out: string
  platform: string
  status: string
}

interface UpsellOffer {
  id: string
  property_id: string
  booking_id: string | null
  offer_type: string
  status: string
  price: number
  currency: string
  offer_details: Record<string, any>
  guest_phone: string
  channel: string
  message_text: string | null
  scheduled_at: string | null
  sent_at: string | null
  responded_at: string | null
  expires_at: string | null
  guest_response: string | null
  properties?: { name: string; property_code: string }
}

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

// ==========================================
// Telegram Helpers
// ==========================================

/**
 * Send a Telegram message to a chat
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
    return res.ok
  } catch (error) {
    console.error('Telegram send failed:', error)
    return false
  }
}

// ==========================================
// Core Upsell Functions
// ==========================================

/**
 * Scan bookings and schedule upsell offers based on property configs
 */
export async function scanAndScheduleOffers(supabase: SupabaseClient): Promise<{ scheduled: number }> {
  console.log('Scanning bookings for upsell opportunities...')

  const { data: configs, error: cfgErr } = await supabase
    .from('upsell_configs')
    .select('*, properties(id, name, property_code)')
    .eq('enabled', true)

  if (cfgErr || !configs) {
    console.error('Failed to fetch upsell configs:', cfgErr?.message)
    return { scheduled: 0 }
  }

  let totalScheduled = 0

  for (const config of configs as UpsellConfig[]) {
    const propertyId = config.property_id

    // Get upcoming bookings with guest contact info
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'confirmed')
      .gte('check_in', new Date().toISOString().split('T')[0])

    if (bErr || !bookings) continue

    for (const booking of bookings as Booking[]) {
      if (!booking.guest_phone) continue

      const channel = booking.guest_phone.startsWith('tg:') ? 'telegram' : 'whatsapp'

      // Late checkout offer
      if (config.late_checkout_enabled) {
        const sendAt = new Date(booking.check_out)
        sendAt.setHours(sendAt.getHours() - config.late_checkout_send_hours_before)
        if (sendAt > new Date()) {
          const scheduled = await scheduleOffer(supabase, {
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
              standard_time: config.late_checkout_standard_time,
            },
          })
          if (scheduled) totalScheduled++
        }
      }

      // Early check-in offer
      if (config.early_checkin_enabled) {
        const sendAt = new Date(booking.check_in)
        sendAt.setHours(sendAt.getHours() - config.early_checkin_send_hours_before)
        if (sendAt > new Date()) {
          const scheduled = await scheduleOffer(supabase, {
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
              standard_time: config.early_checkin_standard_time,
            },
          })
          if (scheduled) totalScheduled++
        }
      }

      // Stay extension offer
      if (config.stay_extension_enabled) {
        const sendAt = new Date(booking.check_out)
        sendAt.setHours(sendAt.getHours() - config.stay_extension_send_hours_before)
        if (sendAt > new Date()) {
          const scheduled = await scheduleOffer(supabase, {
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'stay_extension',
            price: 0, // Dynamic based on availability
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              discount_pct: config.stay_extension_discount_pct,
            },
          })
          if (scheduled) totalScheduled++
        }
      }

      // Review request (after checkout)
      if (config.review_request_enabled) {
        const sendAt = new Date(booking.check_out)
        sendAt.setHours(sendAt.getHours() + config.review_request_send_hours_after)
        if (sendAt > new Date()) {
          const scheduled = await scheduleOffer(supabase, {
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'review_request',
            price: 0,
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              platform_urls: config.review_request_platform_urls,
            },
          })
          if (scheduled) totalScheduled++
        }
      }

      // Activity recommendation (after check-in)
      if (config.activity_recommendation_enabled) {
        const sendAt = new Date(booking.check_in)
        sendAt.setHours(sendAt.getHours() + (config.activity_recommendation_send_hours_after_checkin || 24))
        if (sendAt > new Date()) {
          const scheduled = await scheduleOffer(supabase, {
            property_id: propertyId,
            booking_id: booking.id,
            offer_type: 'activity_recommendation',
            price: 0,
            guest_phone: booking.guest_phone,
            channel,
            scheduled_at: sendAt.toISOString(),
            offer_details: {
              max_activities: config.activity_recommendation_max_activities || 3,
              category_preference: config.activity_recommendation_category_preference || null,
              radius_km: config.activity_recommendation_radius_km || 25,
            },
          })
          if (scheduled) totalScheduled++
        }
      }
    }

    // Gap night offers — check for gaps between bookings
    if (config.gap_night_enabled) {
      const gapScheduled = await scheduleGapNightOffers(supabase, config)
      totalScheduled += gapScheduled
    }
  }

  console.log(`Scheduled ${totalScheduled} upsell offers`)
  return { scheduled: totalScheduled }
}

/**
 * Schedule a single offer (skip if duplicate exists)
 */
async function scheduleOffer(
  supabase: SupabaseClient,
  offer: {
    property_id: string
    booking_id: string
    offer_type: string
    price: number
    guest_phone: string
    channel: string
    scheduled_at: string
    offer_details: Record<string, any>
  }
): Promise<boolean> {
  // Check for existing offer of same type for same booking
  const { data: existing } = await supabase
    .from('upsell_offers')
    .select('id')
    .eq('booking_id', offer.booking_id)
    .eq('offer_type', offer.offer_type)
    .in('status', ['scheduled', 'draft', 'sent'])
    .limit(1)
    .maybeSingle()

  if (existing) return false // Already scheduled

  const { error } = await supabase.from('upsell_offers').insert({
    ...offer,
    status: 'scheduled',
    currency: 'EUR',
  })

  if (error) {
    console.error(`Failed to schedule ${offer.offer_type}:`, error.message)
    return false
  }
  return true
}

/**
 * Schedule gap night offers by finding gaps between consecutive bookings
 */
async function scheduleGapNightOffers(supabase: SupabaseClient, config: UpsellConfig): Promise<number> {
  const propertyId = config.property_id
  let scheduled = 0

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'confirmed')
    .gte('check_out', new Date().toISOString().split('T')[0])
    .order('check_in', { ascending: true })

  if (!bookings || bookings.length < 2) return 0

  for (let i = 0; i < bookings.length - 1; i++) {
    const current = bookings[i] as Booking
    const next = bookings[i + 1] as Booking

    const gapStart = new Date(current.check_out)
    const gapEnd = new Date(next.check_in)
    const gapNights = Math.round((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60 * 24))

    if (gapNights >= 1 && gapNights <= config.gap_night_max_gap) {
      if (current.guest_phone) {
        const sendAt = new Date(current.check_out)
        sendAt.setDate(sendAt.getDate() - config.gap_night_send_days_before)
        if (sendAt > new Date()) {
          const channel = current.guest_phone.startsWith('tg:') ? 'telegram' : 'whatsapp'
          const discountedPrice = config.gap_night_base_price * (1 - config.gap_night_discount_pct / 100)

          const didSchedule = await scheduleOffer(supabase, {
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
              gap_end: next.check_in,
            },
          })
          if (didSchedule) scheduled++
        }
      }
    }
  }

  return scheduled
}

/**
 * Send all due offers (scheduled_at <= now, status = scheduled)
 */
export async function sendDueOffers(supabase: SupabaseClient): Promise<{ sent: number; total: number }> {
  console.log('Checking for due upsell offers...')

  const { data: offers, error } = await supabase
    .from('upsell_offers')
    .select('*, properties(name, property_code)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (error || !offers || offers.length === 0) {
    return { sent: 0, total: 0 }
  }

  let sent = 0

  for (const offer of offers as UpsellOffer[]) {
    const message = formatOfferMessage(offer)
    let success = false

    if (offer.channel === 'telegram' && offer.guest_phone?.startsWith('tg:')) {
      const chatId = offer.guest_phone.replace('tg:', '')
      success = await sendTelegramMessage(chatId, message)
    }
    // WhatsApp support can be added later when WhatsApp Business is set up

    if (success) {
      await supabase
        .from('upsell_offers')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_text: message,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', offer.id)
      sent++
    }
  }

  console.log(`Sent ${sent}/${offers.length} upsell offers`)
  return { sent, total: offers.length }
}

/**
 * Format offer message based on type
 */
export function formatOfferMessage(offer: UpsellOffer): string {
  const propertyName = offer.properties?.name || 'your property'
  const details = offer.offer_details || {}

  switch (offer.offer_type) {
    case 'late_checkout':
      return (
        `*Late Checkout Available!*\n\n` +
        `Enjoy a relaxed morning at ${propertyName}! ` +
        `Check out up to ${details.max_hours}h later (until ${formatTime(details.standard_time, details.max_hours)}) ` +
        `for just EUR ${offer.price}.\n\n` +
        `Reply *YES* to book or *NO* to decline.`
      )

    case 'early_checkin':
      return (
        `*Early Check-in Available!*\n\n` +
        `Arrive early at ${propertyName}! ` +
        `Check in up to ${details.max_hours}h earlier (from ${formatTime(details.standard_time, -details.max_hours)}) ` +
        `for just EUR ${offer.price}.\n\n` +
        `Reply *YES* to book or *NO* to decline.`
      )

    case 'gap_night':
      return (
        `*Special Offer: Extra Night(s)!*\n\n` +
        `We have ${details.gap_nights} night(s) available ` +
        `right after your stay at ${propertyName}. ` +
        `Get ${details.discount_pct}% off at just EUR ${details.price_per_night}/night ` +
        `(total: EUR ${offer.price}).\n\n` +
        `Reply *YES* to extend your stay or *NO* to decline.`
      )

    case 'stay_extension':
      return (
        `*Extend Your Stay?*\n\n` +
        `Loving ${propertyName}? ` +
        `We can offer you ${details.discount_pct}% off extra nights. ` +
        `Reply *YES* if you're interested or *NO* to decline.`
      )

    case 'review_request': {
      const urls = details.platform_urls || {}
      let reviewLinks = ''
      if (urls.google) reviewLinks += `\nGoogle: ${urls.google}`
      if (urls.airbnb) reviewLinks += `\nAirbnb: ${urls.airbnb}`
      if (urls.tripadvisor) reviewLinks += `\nTripAdvisor: ${urls.tripadvisor}`
      return (
        `*How was your stay at ${propertyName}?*\n\n` +
        `We hope you had a wonderful time! A review would mean the world to us.` +
        (reviewLinks ? `\n${reviewLinks}` : '') +
        `\n\nThank you!`
      )
    }

    case 'activity_recommendation': {
      const storedActivities = details.activities_sent || []
      if (storedActivities.length === 0) {
        return `*Things To Do Near ${propertyName}!*\n\nAsk me about local activities and I'll find great options for you!`
      }
      let msg = `*Things To Do Near ${propertyName}!*\n\n`
      storedActivities.forEach((a: any, i: number) => {
        const price = a.price?.formatted || `EUR ${a.price?.amount || 0}`
        msg += `${i + 1}. *${a.name}*\n`
        if (a.rating) msg += `   ${a.rating}/5 (${a.review_count || 0} reviews)\n`
        msg += `   From ${price}\n`
        msg += `   ${a.booking_url}\n\n`
      })
      msg += `Tap any link to book directly!`
      return msg
    }

    default:
      return `You have a new offer from ${propertyName}. Reply YES or NO.`
  }
}

/**
 * Helper: offset a time string by hours
 */
function formatTime(timeStr: string | undefined, offsetHours: number): string {
  if (!timeStr) return '?'
  const [h, m] = timeStr.split(':').map(Number)
  const newH = Math.max(0, Math.min(23, h + offsetHours))
  return `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`
}

/**
 * Handle guest response to an upsell offer (YES/NO in multiple languages)
 */
export async function handleUpsellResponse(
  supabase: SupabaseClient,
  guestPhone: string,
  responseText: string
): Promise<string | null> {
  const normalized = responseText.trim().toUpperCase()
  const isAccept = /^(YES|JA|SI|OUI|YEAH|OK|ACCEPT|BOOK)$/i.test(normalized)
  const isDecline = /^(NO|NEI|NON|NEIN|DECLINE|REJECT|NOPE)$/i.test(normalized)

  if (!isAccept && !isDecline) return null // Not an upsell response

  // Find the most recent sent offer for this guest
  const { data: offer, error } = await supabase
    .from('upsell_offers')
    .select('*')
    .eq('guest_phone', guestPhone)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !offer) return null // No pending offer

  // Activity recommendations don't have an accept/decline flow
  if (offer.offer_type === 'activity_recommendation') return null

  const newStatus = isAccept ? 'accepted' : 'declined'

  await supabase
    .from('upsell_offers')
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
      guest_response: normalized,
    })
    .eq('id', offer.id)

  console.log(`Upsell ${offer.offer_type} ${newStatus} by ${guestPhone}`)

  const offerTypeLabels: Record<string, string> = {
    late_checkout: 'late checkout',
    early_checkin: 'early check-in',
    gap_night: 'extra night(s)',
    stay_extension: 'stay extension',
    review_request: 'review request',
    activity_recommendation: 'activity recommendations',
  }
  const offerLabel = offerTypeLabels[offer.offer_type] || offer.offer_type

  if (isAccept) {
    return (
      `Great! Your ${offerLabel} has been confirmed. ` +
      (offer.price > 0 ? `Total: EUR ${offer.price}. ` : '') +
      `The host will follow up with details. Thank you!`
    )
  } else {
    return `No problem! We hope you enjoy your stay.`
  }
}

/**
 * Expire stale offers (sent but no response after 24h)
 */
export async function expireStaleOffers(supabase: SupabaseClient): Promise<{ expired: number }> {
  const { data, error } = await supabase
    .from('upsell_offers')
    .update({ status: 'expired' })
    .eq('status', 'sent')
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('Failed to expire offers:', error.message)
    return { expired: 0 }
  }

  const count = data?.length || 0
  if (count > 0) {
    console.log(`Expired ${count} stale upsell offers`)
  }
  return { expired: count }
}
