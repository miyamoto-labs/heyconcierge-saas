import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  parseHostawayPayload,
  verifyBasicAuth,
  mapHostawayStatus,
  mapHostawayPlatform,
  buildGuestName,
  type HostawayReservationPayload,
} from '@/lib/hostaway'
import { sendWelcomeMessage } from '@/lib/messaging'

export const maxDuration = 30

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Basic Auth
    if (!verifyBasicAuth(request.headers.get('authorization'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse webhook payload
    const body = await request.json()
    const webhook = parseHostawayPayload(body)

    if (!webhook) {
      console.warn('Hostaway webhook: unrecognised or malformed payload', JSON.stringify(body).slice(0, 200))
      return NextResponse.json({ ok: true, skipped: true })
    }

    const { event, data } = webhook
    const supabase = getSupabase()

    // 3. Resolve property via hostaway_connections
    const { data: connection } = await supabase
      .from('hostaway_connections')
      .select('property_id')
      .eq('hostaway_listing_id', data.listingMapId)
      .eq('sync_enabled', true)
      .single()

    if (!connection) {
      console.warn(`Hostaway webhook: unmapped listing ${data.listingMapId}`)
      return NextResponse.json({ ok: true, skipped: true, reason: 'unmapped listing' })
    }

    const propertyId = connection.property_id

    // 4. Upsert booking
    const guestName = buildGuestName(data)
    const bookingData = {
      property_id: propertyId,
      hostaway_reservation_id: data.id,
      hostaway_listing_id: data.listingMapId,
      guest_name: guestName,
      guest_first_name: data.guestFirstName || null,
      guest_last_name: data.guestLastName || null,
      guest_email: data.guestEmail || null,
      guest_phone: data.guestPhone || null,
      check_in: data.arrivalDate,
      check_out: data.departureDate,
      platform: mapHostawayPlatform(data.channelName),
      status: mapHostawayStatus(data.status),
      hostaway_status: data.status,
      channel_name: data.channelName || null,
      confirmation_code: data.confirmationCode || null,
      booking_reference: data.confirmationCode || null,
      total_price: data.totalPrice || null,
      currency: data.currency || 'EUR',
      door_code: data.doorCode || null,
      source: 'hostaway',
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .upsert(bookingData, { onConflict: 'hostaway_reservation_id' })
      .select('id')
      .single()

    if (bookingError) {
      console.error('Hostaway webhook: booking upsert failed', bookingError)
      return NextResponse.json({ ok: true, error: 'booking upsert failed' })
    }

    // 5. Handle event-specific logic
    if (event === 'reservation.created') {
      await handleReservationCreated(supabase, propertyId, booking.id, data)
    } else if (event === 'reservation.cancelled') {
      await handleReservationCancelled(supabase, booking.id)
    }

    // Update last sync timestamp on the connection
    await supabase
      .from('hostaway_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .eq('hostaway_listing_id', data.listingMapId)

    console.log(`Hostaway webhook: ${event} processed for reservation ${data.id} → property ${propertyId}`)
    return NextResponse.json({ ok: true, event, reservationId: data.id })
  } catch (error) {
    console.error('Hostaway webhook error:', error)
    // Always return 200 to prevent Hostaway retries on logic errors
    return NextResponse.json({ ok: true, error: 'internal error' })
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleReservationCreated(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
  bookingId: string,
  data: HostawayReservationPayload,
) {
  const guestName = buildGuestName(data)

  // Upsert guest session so the guest is linked to the property
  if (data.guestPhone) {
    await supabase
      .from('guest_sessions')
      .upsert(
        {
          guest_phone: data.guestPhone,
          property_id: propertyId,
          guest_email: data.guestEmail || null,
          guest_name: guestName,
          booking_id: bookingId,
        },
        { onConflict: 'guest_phone,property_id' }
      )
      .select()
      .single()
  }

  // Try sending a welcome message via Telegram if the guest already has a chat_id
  if (data.guestPhone) {
    const { data: session } = await supabase
      .from('guest_sessions')
      .select('telegram_chat_id')
      .eq('guest_phone', data.guestPhone)
      .eq('property_id', propertyId)
      .not('telegram_chat_id', 'is', null)
      .single()

    if (session?.telegram_chat_id) {
      // Fetch property name for the welcome message
      const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', propertyId)
        .single()

      await sendWelcomeMessage(
        String(session.telegram_chat_id),
        property?.name || 'your property',
        data.guestFirstName || guestName,
        data.arrivalDate,
        data.departureDate,
      )

      // Log the welcome message
      await supabase.from('goconcierge_messages').insert({
        property_id: propertyId,
        guest_phone: data.guestPhone,
        guest_name: guestName,
        role: 'assistant',
        content: `Welcome message sent for reservation ${data.confirmationCode || data.id}`,
        channel: 'telegram',
      })
    }
  }
}

async function handleReservationCancelled(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
) {
  // Expire any pending upsell offers for this booking
  await supabase
    .from('upsell_offers')
    .update({ status: 'expired' })
    .eq('booking_id', bookingId)
    .in('status', ['scheduled', 'sent'])
}
