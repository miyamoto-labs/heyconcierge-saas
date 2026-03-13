// HeyConcierge OTA Integration — GetYourGuide Integrator API Client
// Docs: https://api.getyourguide.com/doc
// Sandbox: https://api.sandbox.getyourguide.com
// Production: https://api.getyourguide.com

import type {
  Activity,
  ActivityProviderClient,
  ActivitySearchParams,
  AvailabilityParams,
  AvailabilityResult,
  AvailabilitySlot,
  BookingParams,
  BookingResult,
  CancellationResult,
} from './types'
import { getRateLimiter } from './rate-limiter'

const GYG_API_URL = process.env.GYG_API_URL || 'https://api.sandbox.getyourguide.com'
const GYG_API_KEY = process.env.GYG_API_KEY || ''
const GYG_PARTNER_ID = process.env.GYG_PARTNER_ID || ''

interface GYGActivity {
  activity_id: number
  title: string
  abstract?: string
  description?: string
  duration?: { value: number; unit: string }
  price?: { values?: { amount: number; currency: string }; startingPrice?: number }
  overall_rating?: number
  number_of_ratings?: number
  pictures?: Array<{ url: string }>
  url?: string
  categories?: Array<{ category_id: number; name: string }>
  meeting_point?: { latitude?: number; longitude?: number }
  highlights?: string[]
  inclusions?: string[]
  cancellation_policy?: { type: string; description?: string }
}

interface GYGSearchResponse {
  data?: {
    activities?: GYGActivity[]
    total_count?: number
  }
  status?: string
}

export class GetYourGuideClient implements ActivityProviderClient {
  provider = 'getyourguide' as const
  private limiter = getRateLimiter('getyourguide')

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!GYG_API_KEY) {
      console.warn('GYG_API_KEY not set — returning empty results')
      return (Array.isArray(options) ? [] : {}) as T
    }

    return this.limiter.execute(async () => {
      const url = `${GYG_API_URL}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Access-Token': GYG_API_KEY,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`GYG API ${response.status}: ${errorBody}`)
      }

      return response.json()
    })
  }

  async search(params: ActivitySearchParams): Promise<Activity[]> {
    if (!GYG_API_KEY) return []

    try {
      // Build query parameters
      const queryParams = new URLSearchParams()

      if (params.query) {
        queryParams.set('q', params.query)
      }

      queryParams.set('coordinates[lat]', String(params.latitude))
      queryParams.set('coordinates[long]', String(params.longitude))
      queryParams.set('coordinates[radius]', String((params.radiusKm ?? 25) * 1000)) // meters
      queryParams.set('currency', params.currency || 'EUR')
      queryParams.set('limit', String(params.limit ?? 10))
      queryParams.set('offset', String(params.offset ?? 0))
      queryParams.set('sortBy', 'rating')
      queryParams.set('sortDirection', 'DESC')

      if (params.startDate) queryParams.set('date[from]', params.startDate)
      if (params.endDate) queryParams.set('date[to]', params.endDate)
      if (params.minRating) queryParams.set('rating[min]', String(params.minRating))

      if (params.categories?.length) {
        params.categories.forEach((cat) => queryParams.append('category_ids[]', cat))
      }

      const data = await this.request<GYGSearchResponse>(
        `/1/activities?${queryParams.toString()}`,
      )

      return (data.data?.activities || []).map((a) => this.normalizeActivity(a, params))
    } catch (err) {
      console.error('GYG search error:', err)
      return []
    }
  }

  async getProduct(externalId: string): Promise<Activity | null> {
    if (!GYG_API_KEY) return null

    try {
      const data = await this.request<{ data?: { activity?: GYGActivity } }>(
        `/1/activities/${externalId}`,
      )

      if (!data.data?.activity) return null

      return this.normalizeActivity(data.data.activity, {
        latitude: 0,
        longitude: 0,
        currency: 'EUR',
      })
    } catch {
      return null
    }
  }

  // Generate affiliate deep link with tracking
  getAffiliateUrl(externalId: string, propertyId?: string): string {
    const baseUrl = `https://www.getyourguide.com/activity-${externalId}`
    const params = new URLSearchParams()
    if (GYG_PARTNER_ID) params.set('partner_id', GYG_PARTNER_ID)
    if (propertyId) params.set('cmp', `hc_${propertyId}`) // campaign for property tracking
    params.set('utm_medium', 'api')
    params.set('utm_source', 'heyconcierge')
    const qs = params.toString()
    return qs ? `${baseUrl}?${qs}` : baseUrl
  }

  // --- Phase 2 methods (not active in MVP, kept for future) ---

  async checkAvailability(params: AvailabilityParams): Promise<AvailabilityResult> {
    if (!GYG_API_KEY) {
      return {
        provider: 'getyourguide',
        externalId: params.externalId,
        date: params.date,
        slots: [],
        available: false,
      }
    }

    try {
      const queryParams = new URLSearchParams({
        date: params.date,
        adults: String(params.participants),
      })

      const data = await this.request<{
        data?: {
          availabilities?: Array<{
            start_time?: string
            end_time?: string
            available: boolean
            max_travelers?: number
            retail_price?: { amount: number; currency: string }
            option_id?: number
          }>
        }
      }>(`/1/activities/${params.externalId}/availabilities?${queryParams.toString()}`)

      const slots: AvailabilitySlot[] = (data.data?.availabilities || []).map((slot) => ({
        startTime: slot.start_time || '00:00',
        endTime: slot.end_time,
        available: slot.available,
        remainingSpots: slot.max_travelers,
        price: {
          amount: slot.retail_price?.amount ?? 0,
          currency: slot.retail_price?.currency ?? 'EUR',
          formatted: `€${(slot.retail_price?.amount ?? 0).toFixed(2)}`,
        },
        optionId: slot.option_id ? String(slot.option_id) : undefined,
      }))

      return {
        provider: 'getyourguide',
        externalId: params.externalId,
        date: params.date,
        slots,
        available: slots.some((s) => s.available),
      }
    } catch (err) {
      console.error('GYG availability error:', err)
      return {
        provider: 'getyourguide',
        externalId: params.externalId,
        date: params.date,
        slots: [],
        available: false,
      }
    }
  }

  async createBooking(params: BookingParams): Promise<BookingResult> {
    if (!GYG_API_KEY) {
      return {
        success: false,
        bookingId: null,
        externalBookingId: null,
        activityName: '',
        date: params.date,
        participants: params.participants,
        totalPrice: { amount: 0, currency: 'EUR', formatted: '€0.00' },
        voucherUrl: null,
        confirmationMessage: 'GetYourGuide API key not configured',
        error: 'API key missing',
      }
    }

    try {
      // Step 1: Add to cart
      const cartBody = {
        activity_id: parseInt(params.externalId, 10),
        option_id: params.optionId ? parseInt(params.optionId, 10) : undefined,
        date: params.date,
        start_time: params.startTime,
        categories: [
          { category: 'adult', number_of_participants: params.participants },
        ],
      }

      const cartData = await this.request<{
        data?: { shopping_cart?: { shopping_cart_id: number; shopping_cart_hash: string } }
      }>('/1/carts', { method: 'POST', body: JSON.stringify(cartBody) })

      const cartId = cartData.data?.shopping_cart?.shopping_cart_id
      const cartHash = cartData.data?.shopping_cart?.shopping_cart_hash

      if (!cartId || !cartHash) {
        throw new Error('Failed to create shopping cart')
      }

      // Step 2: Complete booking
      const bookingBody = {
        shopping_cart_id: cartId,
        shopping_cart_hash: cartHash,
        traveler: {
          first_name: params.guestName.split(' ')[0] || params.guestName,
          last_name: params.guestName.split(' ').slice(1).join(' ') || 'Guest',
          email: params.guestEmail,
          phone_number: params.guestPhone,
        },
        payment: {
          type: 'PARTNER_PAYMENT',
        },
      }

      const data = await this.request<{
        data?: {
          booking?: {
            booking_id: number
            status: string
            voucher_url?: string
            total_price?: { amount: number; currency: string }
            items?: Array<{ title: string }>
          }
        }
      }>('/1/bookings', { method: 'POST', body: JSON.stringify(bookingBody) })

      const booking = data.data?.booking
      const price = booking?.total_price?.amount ?? 0
      const currency = booking?.total_price?.currency ?? 'EUR'

      return {
        success: true,
        bookingId: null,
        externalBookingId: booking?.booking_id ? String(booking.booking_id) : null,
        activityName: booking?.items?.[0]?.title ?? params.externalId,
        date: params.date,
        participants: params.participants,
        totalPrice: {
          amount: price,
          currency,
          formatted: `€${price.toFixed(2)}`,
        },
        commissionAmount: price * 0.08,
        voucherUrl: booking?.voucher_url ?? null,
        confirmationMessage: `Booking confirmed! Reference: ${booking?.booking_id}`,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        bookingId: null,
        externalBookingId: null,
        activityName: '',
        date: params.date,
        participants: params.participants,
        totalPrice: { amount: 0, currency: 'EUR', formatted: '€0.00' },
        voucherUrl: null,
        confirmationMessage: 'Booking failed',
        error: message,
      }
    }
  }

  async cancelBooking(externalBookingId: string): Promise<CancellationResult> {
    if (!GYG_API_KEY) {
      return { success: false, message: 'GYG API key not configured' }
    }

    try {
      await this.request(`/1/bookings/${externalBookingId}`, {
        method: 'DELETE',
      })
      return { success: true, message: 'Booking cancelled successfully' }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Cancellation failed' }
    }
  }

  // --- Normalize GYG activity to our Activity type ---

  private normalizeActivity(activity: GYGActivity, params: ActivitySearchParams): Activity {
    const price = activity.price?.startingPrice
      ?? activity.price?.values?.amount
      ?? 0
    const currency = activity.price?.values?.currency ?? params.currency ?? 'EUR'

    // Duration: GYG returns { value, unit } where unit = "hour", "minute", "day"
    let durationMinutes: number | null = null
    if (activity.duration) {
      switch (activity.duration.unit) {
        case 'minute':
          durationMinutes = activity.duration.value
          break
        case 'hour':
          durationMinutes = activity.duration.value * 60
          break
        case 'day':
          durationMinutes = activity.duration.value * 60 * 24
          break
      }
    }

    return {
      id: '', // set by cache layer
      provider: 'getyourguide',
      externalId: String(activity.activity_id),
      name: activity.title,
      description: activity.description || activity.abstract || '',
      shortDescription: activity.abstract,
      category: activity.categories?.[0]?.name ?? 'activity',
      durationMinutes,
      price: {
        amount: price,
        currency,
        formatted: `€${price.toFixed(2)}`,
      },
      rating: activity.overall_rating ?? null,
      reviewCount: activity.number_of_ratings ?? 0,
      imageUrl: activity.pictures?.[0]?.url ?? null,
      bookingUrl: this.getAffiliateUrl(String(activity.activity_id)),
      location: {
        latitude: activity.meeting_point?.latitude ?? params.latitude,
        longitude: activity.meeting_point?.longitude ?? params.longitude,
        city: '',
        country: '',
      },
      highlights: activity.highlights,
      inclusions: activity.inclusions,
      cancellationPolicy: activity.cancellation_policy?.description
        ?? activity.cancellation_policy?.type,
      rawData: activity as unknown as Record<string, unknown>,
    }
  }
}
