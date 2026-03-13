// HeyConcierge OTA Integration — Shared Types

export type OTAProvider = 'getyourguide' | 'viator'

// --- Search ---

export interface ActivitySearchParams {
  query?: string
  latitude: number
  longitude: number
  radiusKm?: number        // default 25
  currency?: string        // default EUR
  startDate?: string       // ISO date
  endDate?: string         // ISO date
  participants?: number
  categories?: string[]
  minRating?: number
  maxPriceAmount?: number
  limit?: number           // default 10
  offset?: number
}

export interface Activity {
  id: string               // internal UUID (from activity_cache)
  provider: OTAProvider
  externalId: string       // provider's product ID
  name: string
  description: string
  shortDescription?: string
  category: string
  durationMinutes: number | null
  price: {
    amount: number
    currency: string
    formatted: string      // e.g. "€49.00"
  }
  rating: number | null
  reviewCount: number
  imageUrl: string | null
  bookingUrl: string       // affiliate deep link with tracking
  location: {
    latitude: number
    longitude: number
    city: string
    country: string
  }
  highlights?: string[]
  inclusions?: string[]
  cancellationPolicy?: string
  rawData?: Record<string, unknown>
}

export interface ActivitySearchResult {
  activities: Activity[]
  totalCount: number
  providers: {
    getyourguide: { count: number; available: boolean }
    viator: { count: number; available: boolean }
  }
  cached: boolean
  searchId?: string        // for analytics tracking
}

// --- Availability (kept for future use, not active in MVP) ---

export interface AvailabilityParams {
  provider: OTAProvider
  externalId: string
  date: string             // ISO date
  participants: number
}

export interface AvailabilitySlot {
  startTime: string        // ISO datetime or HH:mm
  endTime?: string
  available: boolean
  remainingSpots?: number
  price: {
    amount: number
    currency: string
    formatted: string
  }
  optionId?: string        // provider-specific booking option ID
}

export interface AvailabilityResult {
  provider: OTAProvider
  externalId: string
  date: string
  slots: AvailabilitySlot[]
  available: boolean
}

// --- Booking types (kept for future Phase 2, not used in MVP) ---

export interface BookingParams {
  provider: OTAProvider
  externalId: string
  optionId?: string
  date: string
  startTime?: string
  participants: number
  guestName: string
  guestEmail?: string
  guestPhone: string
  propertyId: string
  currency?: string
}

export interface BookingResult {
  success: boolean
  bookingId: string | null
  externalBookingId: string | null
  activityName: string
  date: string
  participants: number
  totalPrice: {
    amount: number
    currency: string
    formatted: string
  }
  commissionAmount?: number
  voucherUrl: string | null
  confirmationMessage: string
  cancellationPolicy?: string
  error?: string
}

export interface CancellationResult {
  success: boolean
  refundAmount?: number
  message: string
}

// --- Provider Interface (affiliate-first: search + deep links) ---

export interface ActivityProviderClient {
  provider: OTAProvider
  search(params: ActivitySearchParams): Promise<Activity[]>
  getProduct(externalId: string): Promise<Activity | null>
  getAffiliateUrl(externalId: string, propertyId?: string): string
  // Phase 2 (not active in MVP):
  checkAvailability?(params: AvailabilityParams): Promise<AvailabilityResult>
  createBooking?(params: BookingParams): Promise<BookingResult>
  cancelBooking?(externalBookingId: string): Promise<CancellationResult>
}

// --- Config ---

export interface PropertyOTAConfig {
  id: string
  propertyId: string
  getyourguideEnabled: boolean
  viatorEnabled: boolean
  autoRecommend: boolean
  maxRecommendations: number
  minRating: number
  maxPriceEur: number | null
  preferredCategories: string[]
  customMessage: string | null
}

// --- Cache ---

export interface CachedActivity {
  id: string
  provider: OTAProvider
  external_id: string
  name: string
  description: string | null
  category: string | null
  duration_minutes: number | null
  price_amount: number | null
  price_currency: string
  rating: number | null
  review_count: number
  image_url: string | null
  booking_url: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// --- Affiliate Tracking ---

export interface AffiliateClick {
  id: string
  propertyId: string
  activityProvider: OTAProvider
  activityExternalId: string
  activityName: string
  guestPhone?: string
  clickedAt: string
}

// --- Claude Tool Definitions (for function calling) ---

export const ACTIVITY_SEARCH_TOOL = {
  name: 'search_activities',
  description:
    'Search for activities, tours, and experiences near the property. Use this when a guest asks about things to do, tours, activities, experiences, sightseeing, or excursions. Returns top-rated options with prices and booking links.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'What the guest is looking for, e.g. "northern lights tour", "kayaking", "museum". Leave empty for general recommendations.',
      },
      date: {
        type: 'string',
        description: 'Preferred date in YYYY-MM-DD format, if the guest mentioned a specific date.',
      },
      participants: {
        type: 'number',
        description: 'Number of participants, if mentioned by the guest. Defaults to 2.',
      },
      max_price: {
        type: 'number',
        description: 'Maximum price per person in EUR, if the guest has a budget.',
      },
    },
    required: [] as string[],
  },
} as const

export const ACTIVITY_DETAILS_TOOL = {
  name: 'get_activity_details',
  description:
    'Get detailed information about a specific activity by its number from the previous search results. Use when a guest asks for more details about a specific option.',
  input_schema: {
    type: 'object' as const,
    properties: {
      activity_number: {
        type: 'number',
        description: 'The number of the activity from the search results (1, 2, 3, etc.)',
      },
    },
    required: ['activity_number'],
  },
} as const
