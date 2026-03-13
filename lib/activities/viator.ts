// HeyConcierge OTA Integration — Viator Partner API v2 Client
// Docs: https://docs.viator.com/partner-api/technical/
// Sandbox: https://api.sandbox.viator.com/partner
// Production: https://api.viator.com/partner

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

const VIATOR_API_URL = process.env.VIATOR_API_URL || 'https://api.sandbox.viator.com/partner'
const VIATOR_API_KEY = process.env.VIATOR_API_KEY || ''
const VIATOR_PARTNER_ID = process.env.VIATOR_PARTNER_ID || ''

interface ViatorProduct {
  productCode: string
  title: string
  description: string
  shortDescription?: string
  duration?: { fixedDurationInMinutes?: number; variableDurationFromMinutes?: number }
  pricing?: { summary?: { fromPrice: number; fromPriceBeforeDiscount?: number }; currency?: string }
  reviews?: { combinedAverageRating?: number; totalReviews?: number }
  images?: Array<{ variants?: Array<{ url: string; width: number }> }>
  productUrl?: string
  tags?: Array<{ tagId: number; allNamesByLocale?: Record<string, string> }>
  bookingInfo?: { cancellationType?: string }
  destinations?: Array<{ ref: string; primary: boolean }>
  itinerary?: { itineraryItems?: Array<{ pointOfInterestLocation?: { location?: { latitude: number; longitude: number } } }> }
}

export class ViatorClient implements ActivityProviderClient {
  provider = 'viator' as const
  private limiter = getRateLimiter('viator')

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!VIATOR_API_KEY) {
      console.warn('VIATOR_API_KEY not set — returning empty results')
      return (Array.isArray(options) ? [] : {}) as T
    }

    return this.limiter.execute(async () => {
      const url = `${VIATOR_API_URL}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json;version=2.0',
          'Content-Type': 'application/json',
          'exp-api-key': VIATOR_API_KEY,
          'Accept-Language': 'en-US',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Viator API ${response.status}: ${errorBody}`)
      }

      return response.json()
    })
  }

  async search(params: ActivitySearchParams): Promise<Activity[]> {
    if (!VIATOR_API_KEY) return []

    // Viator uses /products/search with filtering
    const body: Record<string, unknown> = {
      filtering: {
        destination: undefined, // filled below if we have coordinates
        tags: params.categories?.length ? params.categories.map(Number).filter(Boolean) : undefined,
        rating: params.minRating ? { from: params.minRating } : undefined,
        price: params.maxPriceAmount
          ? { from: 0, to: params.maxPriceAmount, currency: params.currency || 'EUR' }
          : undefined,
      },
      sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
      pagination: { start: params.offset ?? 1, count: params.limit ?? 10 },
      currency: params.currency || 'EUR',
    }

    // For location-based search, Viator uses destination IDs or freetext search
    // We'll use the freetext search endpoint for flexibility
    if (params.query) {
      const searchBody = {
        searchTerm: params.query,
        currency: params.currency || 'EUR',
        filtering: body.filtering,
        sorting: body.sorting,
        pagination: body.pagination,
      }

      try {
        const data = await this.request<{ products?: ViatorProduct[]; totalCount?: number }>(
          '/products/search',
          { method: 'POST', body: JSON.stringify(searchBody) },
        )
        return (data.products || []).map((p) => this.normalizeProduct(p, params))
      } catch (err) {
        console.error('Viator search error:', err)
        return []
      }
    }

    // Location-based: use /products/search with coordinates
    try {
      const locationBody = {
        topX: `${params.longitude}`,
        topY: `${params.latitude + 0.25}`,
        bottomX: `${params.longitude}`,
        bottomY: `${params.latitude - 0.25}`,
        destId: undefined,
        startDate: params.startDate,
        endDate: params.endDate,
        currency: params.currency || 'EUR',
        pagination: { start: 1, count: params.limit ?? 10 },
        sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
      }

      const data = await this.request<{ products?: ViatorProduct[] }>(
        '/products/search',
        { method: 'POST', body: JSON.stringify(locationBody) },
      )
      return (data.products || []).map((p) => this.normalizeProduct(p, params))
    } catch (err) {
      console.error('Viator location search error:', err)
      return []
    }
  }

  async getProduct(externalId: string): Promise<Activity | null> {
    if (!VIATOR_API_KEY) return null

    try {
      const data = await this.request<ViatorProduct>(`/products/${externalId}`)
      return this.normalizeProduct(data, {
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
    const baseUrl = `https://www.viator.com/tours/${externalId}`
    const params = new URLSearchParams()
    if (VIATOR_PARTNER_ID) params.set('pid', VIATOR_PARTNER_ID)
    if (propertyId) params.set('mcid', `hc_${propertyId}`) // campaign ID for property tracking
    params.set('medium', 'api')
    params.set('campaign', 'heyconcierge')
    const qs = params.toString()
    return qs ? `${baseUrl}?${qs}` : baseUrl
  }

  // --- Phase 2 methods (not active in MVP, kept for future) ---

  async checkAvailability(params: AvailabilityParams): Promise<AvailabilityResult> {
    if (!VIATOR_API_KEY) {
      return { provider: 'viator', externalId: params.externalId, date: params.date, slots: [], available: false }
    }

    try {
      const body = {
        productCode: params.externalId,
        travelDate: params.date,
        currency: 'EUR',
        paxMix: [{ ageBand: 'ADULT', numberOfTravelers: params.participants }],
      }

      const data = await this.request<{
        bookableItems?: Array<{
          startTime?: string
          totalPrice?: { price: { recommendedRetailPrice: number }; currency: string }
          available?: boolean
          lineItems?: Array<{ ageBand: string; numberOfTravelers: number }>
        }>
      }>('/availability/check', { method: 'POST', body: JSON.stringify(body) })

      const slots: AvailabilitySlot[] = (data.bookableItems || []).map((item) => ({
        startTime: item.startTime || '00:00',
        available: item.available !== false,
        price: {
          amount: item.totalPrice?.price?.recommendedRetailPrice ?? 0,
          currency: item.totalPrice?.currency ?? 'EUR',
          formatted: `€${(item.totalPrice?.price?.recommendedRetailPrice ?? 0).toFixed(2)}`,
        },
      }))

      return {
        provider: 'viator',
        externalId: params.externalId,
        date: params.date,
        slots,
        available: slots.some((s) => s.available),
      }
    } catch (err) {
      console.error('Viator availability error:', err)
      return { provider: 'viator', externalId: params.externalId, date: params.date, slots: [], available: false }
    }
  }

  async createBooking(params: BookingParams): Promise<BookingResult> {
    if (!VIATOR_API_KEY) {
      return {
        success: false,
        bookingId: null,
        externalBookingId: null,
        activityName: '',
        date: params.date,
        participants: params.participants,
        totalPrice: { amount: 0, currency: 'EUR', formatted: '€0.00' },
        voucherUrl: null,
        confirmationMessage: 'Viator API key not configured',
        error: 'API key missing',
      }
    }

    try {
      const body = {
        productCode: params.externalId,
        travelDate: params.date,
        startTime: params.startTime,
        currency: params.currency || 'EUR',
        paxMix: [{ ageBand: 'ADULT', numberOfTravelers: params.participants }],
        bookerInfo: {
          firstName: params.guestName.split(' ')[0] || params.guestName,
          lastName: params.guestName.split(' ').slice(1).join(' ') || 'Guest',
          email: params.guestEmail,
          phone: params.guestPhone,
        },
        communication: { email: true },
      }

      const data = await this.request<{
        bookingRef?: string
        status?: string
        voucherUrl?: string
        totalPrice?: { price: { recommendedRetailPrice: number }; currency: string }
        lineItems?: Array<{ productCode: string; title: string }>
      }>('/bookings/book', { method: 'POST', body: JSON.stringify(body) })

      const price = data.totalPrice?.price?.recommendedRetailPrice ?? 0
      const currency = data.totalPrice?.currency ?? 'EUR'

      return {
        success: true,
        bookingId: null,
        externalBookingId: data.bookingRef ?? null,
        activityName: data.lineItems?.[0]?.title ?? params.externalId,
        date: params.date,
        participants: params.participants,
        totalPrice: {
          amount: price,
          currency,
          formatted: `€${price.toFixed(2)}`,
        },
        commissionAmount: price * 0.08,
        voucherUrl: data.voucherUrl ?? null,
        confirmationMessage: `Booking confirmed! Reference: ${data.bookingRef}`,
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
    if (!VIATOR_API_KEY) {
      return { success: false, message: 'Viator API key not configured' }
    }

    try {
      await this.request(`/bookings/${externalBookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reasonCode: 'CUSTOMER_REQUEST' }),
      })
      return { success: true, message: 'Booking cancelled successfully' }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Cancellation failed' }
    }
  }

  // --- Normalize Viator product to our Activity type ---

  private normalizeProduct(product: ViatorProduct, params: ActivitySearchParams): Activity {
    const price = product.pricing?.summary?.fromPrice ?? 0
    const currency = product.pricing?.currency ?? params.currency ?? 'EUR'
    const image = product.images?.[0]?.variants?.find((v) => v.width >= 400)
      ?? product.images?.[0]?.variants?.[0]

    // Extract location from itinerary if available
    const loc = product.itinerary?.itineraryItems?.[0]?.pointOfInterestLocation?.location

    return {
      id: '', // set by cache layer
      provider: 'viator',
      externalId: product.productCode,
      name: product.title,
      description: product.description || '',
      shortDescription: product.shortDescription,
      category: product.tags?.[0]?.allNamesByLocale?.['en'] ?? 'activity',
      durationMinutes: product.duration?.fixedDurationInMinutes
        ?? product.duration?.variableDurationFromMinutes
        ?? null,
      price: {
        amount: price,
        currency,
        formatted: `€${price.toFixed(2)}`,
      },
      rating: product.reviews?.combinedAverageRating ?? null,
      reviewCount: product.reviews?.totalReviews ?? 0,
      imageUrl: image?.url ?? null,
      bookingUrl: this.getAffiliateUrl(product.productCode),
      location: {
        latitude: loc?.latitude ?? params.latitude,
        longitude: loc?.longitude ?? params.longitude,
        city: '',
        country: '',
      },
      highlights: [],
      cancellationPolicy: product.bookingInfo?.cancellationType,
      rawData: product as unknown as Record<string, unknown>,
    }
  }
}
