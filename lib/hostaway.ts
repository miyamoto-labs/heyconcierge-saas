// Hostaway PMS integration — types and helpers

export interface HostawayReservationPayload {
  id: number
  listingMapId: number
  channelId?: number
  channelName?: string
  guestName?: string
  guestFirstName?: string
  guestLastName?: string
  guestEmail?: string
  guestPhone?: string
  arrivalDate: string       // 'YYYY-MM-DD'
  departureDate: string     // 'YYYY-MM-DD'
  status: string
  totalPrice?: number
  currency?: string
  confirmationCode?: string
  doorCode?: string
  source?: string
  numberOfGuests?: number
  comment?: string
}

export interface HostawayWebhookEvent {
  event: string
  data: HostawayReservationPayload
}

const VALID_EVENTS = [
  'reservation.created',
  'reservation.updated',
  'reservation.cancelled',
]

/**
 * Parse and validate a Hostaway webhook payload.
 * Returns null if the payload is malformed or an unrecognised event.
 */
export function parseHostawayPayload(body: unknown): HostawayWebhookEvent | null {
  if (!body || typeof body !== 'object') return null

  const obj = body as Record<string, unknown>
  const event = obj.event as string | undefined
  const data = obj.data as HostawayReservationPayload | undefined

  if (!event || !VALID_EVENTS.includes(event)) return null
  if (!data || typeof data.id !== 'number' || typeof data.listingMapId !== 'number') return null
  if (!data.arrivalDate || !data.departureDate) return null

  return { event, data }
}

/**
 * Map Hostaway reservation status to HeyConcierge booking status.
 */
export function mapHostawayStatus(haStatus: string): 'confirmed' | 'cancelled' | 'completed' {
  const s = haStatus.toLowerCase()
  if (s === 'cancelled' || s === 'declined' || s === 'rejected') return 'cancelled'
  if (s === 'completed' || s === 'checkedout' || s === 'checked_out') return 'completed'
  return 'confirmed'
}

/**
 * Map Hostaway channel name to HeyConcierge platform enum.
 */
export function mapHostawayPlatform(channelName?: string): string {
  if (!channelName) return 'other'
  const ch = channelName.toLowerCase()
  if (ch.includes('airbnb')) return 'airbnb'
  if (ch.includes('booking')) return 'booking'
  if (ch.includes('vrbo') || ch.includes('homeaway')) return 'vrbo'
  if (ch === 'direct' || ch === 'manual' || ch === 'website') return 'direct'
  return 'other'
}

/**
 * Build a full guest name from Hostaway fields.
 */
export function buildGuestName(data: HostawayReservationPayload): string {
  if (data.guestFirstName || data.guestLastName) {
    return [data.guestFirstName, data.guestLastName].filter(Boolean).join(' ')
  }
  return data.guestName || 'Guest'
}

/**
 * Verify Basic Auth header against expected credentials.
 */
export function verifyBasicAuth(authHeader: string | null): boolean {
  if (!authHeader?.startsWith('Basic ')) return false

  const login = process.env.HOSTAWAY_WEBHOOK_LOGIN
  const password = process.env.HOSTAWAY_WEBHOOK_PASSWORD
  if (!login || !password) return false

  try {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [l, p] = decoded.split(':')
    return l === login && p === password
  } catch {
    return false
  }
}
