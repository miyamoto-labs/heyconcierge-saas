// HeyConcierge OTA Integration — Unified Provider Layer
// Searches both GetYourGuide and Viator in parallel, normalizes + ranks results
// Affiliate-first: deep links with tracking, no own booking flow

import type {
  Activity,
  ActivitySearchParams,
  ActivitySearchResult,
  AvailabilityParams,
  AvailabilityResult,
  BookingParams,
  BookingResult,
  CancellationResult,
  OTAProvider,
  PropertyOTAConfig,
} from './types'
import { ViatorClient } from './viator'
import { GetYourGuideClient } from './getyourguide'
import { ActivityCache } from './cache'
import { rankActivities } from './ranking'

// Activity intent detection — multi-language
export const ACTIVITY_INTENT_REGEX =
  /\b(activit|tour|thing.*to.*do|what.*do|what.*see|experience|excursion|sightseeing|museum|hik|adventure|boat|kayak|snorkel|div|safari|walk|bike|climb|ski|northern.?light|aurora|whale|fjord|glacier|fishing|tur|opplevelse|utflukt|hva.*gjøre|was.*machen|que.*hacer|cosa.*fare|activité|que.*faire|что.*делать|vad.*göra)\b/i

// Booking intent detection (kept for future use — MVP uses affiliate links)
export const BOOKING_INTENT_REGEX =
  /\b(book|reserve|buy|purchase|bestill|buche|réserve|prenota|boka)\b.*\b(#?\d|option|nummer|number|nr)\b/i

export function detectActivityIntent(message: string): boolean {
  return ACTIVITY_INTENT_REGEX.test(message)
}

export function detectBookingIntent(message: string): { detected: boolean; optionNumber?: number } {
  const match = message.match(/\b(?:book|reserve|bestill|buche|réserve|prenota|boka)\b.*?#?(\d)/i)
  if (match) {
    return { detected: true, optionNumber: parseInt(match[1], 10) }
  }
  return { detected: false }
}

// --- Unified search across both providers ---

export async function searchActivities(
  params: ActivitySearchParams,
  config: PropertyOTAConfig | null,
  supabase: any,
  propertyId: string,
): Promise<ActivitySearchResult> {
  const cache = new ActivityCache(supabase)

  // Apply config filters
  const searchParams: ActivitySearchParams = {
    ...params,
    minRating: config?.minRating ?? params.minRating ?? 4.0,
    maxPriceAmount: config?.maxPriceEur ?? params.maxPriceAmount,
    categories: config?.preferredCategories?.length ? config.preferredCategories : params.categories,
    limit: params.limit ?? 10,
  }

  // Check cache first (location-based, refreshed daily)
  const cached = await cache.getCachedActivities(
    searchParams.latitude,
    searchParams.longitude,
    searchParams.radiusKm ?? 25,
  )

  if (cached.length > 0) {
    const filtered = filterAndRank(cached, searchParams)
    await logSearch(supabase, propertyId, params, filtered.length, 'cache')
    return {
      activities: filtered.slice(0, searchParams.limit),
      totalCount: filtered.length,
      providers: countByProvider(filtered),
      cached: true,
    }
  }

  // Parallel API calls to enabled providers
  const providers: Promise<Activity[]>[] = []

  if (!config || config.viatorEnabled) {
    const viator = new ViatorClient()
    providers.push(
      viator.search(searchParams).catch((err) => {
        console.error('Viator search error:', err)
        return [] as Activity[]
      }),
    )
  } else {
    providers.push(Promise.resolve([]))
  }

  if (!config || config.getyourguideEnabled) {
    const gyg = new GetYourGuideClient()
    providers.push(
      gyg.search(searchParams).catch((err) => {
        console.error('GYG search error:', err)
        return [] as Activity[]
      }),
    )
  } else {
    providers.push(Promise.resolve([]))
  }

  const [viatorResults, gygResults] = await Promise.all(providers)
  const allResults = [...viatorResults, ...gygResults]

  // Cache results
  if (allResults.length > 0) {
    await cache.cacheActivities(allResults)
  }

  const filtered = filterAndRank(allResults, searchParams)
  await logSearch(supabase, propertyId, params, filtered.length, 'api')

  return {
    activities: filtered.slice(0, searchParams.limit),
    totalCount: filtered.length,
    providers: countByProvider(filtered),
    cached: false,
  }
}

// --- Availability check (Phase 2 — not active in MVP) ---

export async function checkAvailability(params: AvailabilityParams): Promise<AvailabilityResult> {
  const client = getProviderClient(params.provider)
  if (!client.checkAvailability) {
    return { provider: params.provider, externalId: params.externalId, date: params.date, slots: [], available: false }
  }
  return client.checkAvailability(params)
}

// --- Create booking (Phase 2 — not active in MVP) ---

export async function createBooking(
  params: BookingParams,
  supabase: any,
): Promise<BookingResult> {
  const client = getProviderClient(params.provider)
  if (!client.createBooking) {
    return {
      success: false,
      bookingId: null,
      externalBookingId: null,
      activityName: '',
      date: params.date,
      participants: params.participants,
      totalPrice: { amount: 0, currency: 'EUR', formatted: '€0.00' },
      voucherUrl: null,
      confirmationMessage: 'Booking not supported in MVP — use affiliate link',
    }
  }
  const result = await client.createBooking(params)

  if (result.success && result.bookingId) {
    await supabase.from('activity_bookings').insert({
      property_id: params.propertyId,
      guest_phone: params.guestPhone,
      guest_name: params.guestName,
      provider: params.provider,
      external_booking_id: result.externalBookingId,
      activity_external_id: params.externalId,
      activity_name: result.activityName,
      booking_date: params.date,
      participants: params.participants,
      total_price: result.totalPrice.amount,
      currency: result.totalPrice.currency,
      commission_amount: result.commissionAmount ?? null,
      status: 'confirmed',
      voucher_url: result.voucherUrl,
      raw_response: result,
    })
  }

  return result
}

// --- Cancel booking (Phase 2 — not active in MVP) ---

export async function cancelBooking(
  bookingId: string,
  supabase: any,
): Promise<CancellationResult> {
  const { data: booking } = await supabase
    .from('activity_bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, message: 'Booking not found' }
  }

  const client = getProviderClient(booking.provider)
  if (!client.cancelBooking) {
    return { success: false, message: 'Cancellation not supported' }
  }
  const result = await client.cancelBooking(booking.external_booking_id)

  if (result.success) {
    await supabase
      .from('activity_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
  }

  return result
}

// --- Format activities for Claude tool response ---

export function formatActivitiesForPrompt(activities: Activity[], maxItems: number = 5): string {
  if (activities.length === 0) return 'No activities found matching the search criteria.'

  const items = activities.slice(0, maxItems).map((a, i) => {
    const parts = [
      `${i + 1}. ${a.name}`,
      `   Provider: ${a.provider === 'getyourguide' ? 'GetYourGuide' : 'Viator'}`,
      `   Price: ${a.price.formatted}`,
    ]
    if (a.rating) parts.push(`   Rating: ${a.rating}/5 (${a.reviewCount} reviews)`)
    if (a.durationMinutes) parts.push(`   Duration: ${formatDuration(a.durationMinutes)}`)
    if (a.shortDescription) parts.push(`   ${a.shortDescription}`)
    if (a.cancellationPolicy) parts.push(`   Cancellation: ${a.cancellationPolicy}`)
    parts.push(`   Book here: ${a.bookingUrl}`)
    return parts.join('\n')
  })

  return items.join('\n\n')
}

// --- Log affiliate click (for tracking conversions per property) ---

export async function logAffiliateClick(
  supabase: any,
  propertyId: string,
  activity: Activity,
  guestPhone?: string,
): Promise<void> {
  try {
    await supabase.from('activity_clicks').insert({
      property_id: propertyId,
      activity_provider: activity.provider,
      activity_external_id: activity.externalId,
      activity_name: activity.name,
      guest_phone: guestPhone ?? null,
      booking_url: activity.bookingUrl,
    })
  } catch (err) {
    console.error('Failed to log affiliate click:', err)
  }
}

// --- Helpers ---

function getProviderClient(provider: OTAProvider) {
  switch (provider) {
    case 'viator':
      return new ViatorClient()
    case 'getyourguide':
      return new GetYourGuideClient()
  }
}

function filterAndRank(activities: Activity[], params: ActivitySearchParams): Activity[] {
  let filtered = activities

  if (params.minRating) {
    filtered = filtered.filter((a) => !a.rating || a.rating >= params.minRating!)
  }
  if (params.maxPriceAmount) {
    filtered = filtered.filter((a) => a.price.amount <= params.maxPriceAmount!)
  }
  if (params.categories?.length) {
    const cats = new Set(params.categories.map((c) => c.toLowerCase()))
    filtered = filtered.filter((a) => !a.category || cats.has(a.category.toLowerCase()))
  }

  return rankActivities(filtered, params.query)
}

function countByProvider(activities: Activity[]) {
  const gyg = activities.filter((a) => a.provider === 'getyourguide')
  const viator = activities.filter((a) => a.provider === 'viator')
  return {
    getyourguide: { count: gyg.length, available: true },
    viator: { count: viator.length, available: true },
  }
}

async function logSearch(
  supabase: any,
  propertyId: string,
  params: ActivitySearchParams,
  resultsCount: number,
  source: string,
) {
  try {
    await supabase.from('activity_searches').insert({
      property_id: propertyId,
      query: params.query ?? null,
      location: `${params.latitude},${params.longitude}`,
      results_count: resultsCount,
      provider: source,
    })
  } catch (err) {
    console.error('Failed to log search:', err)
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`
}
