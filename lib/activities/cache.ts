// HeyConcierge OTA Integration — Supabase-backed Activity Cache
// Caches API results to avoid hitting rate limits and speed up responses
// TTL: 24 hours per destination

import type { Activity, CachedActivity } from './types'

const CACHE_TTL_HOURS = 24 // Refresh activities daily

export class ActivityCache {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  // Get cached activities near a location (within radius)
  async getCachedActivities(
    latitude: number,
    longitude: number,
    radiusKm: number = 25,
  ): Promise<Activity[]> {
    // Simple bounding box filter (good enough for city-level cache)
    const latDelta = radiusKm / 111 // ~111km per degree latitude
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - CACHE_TTL_HOURS)

    const { data, error } = await this.supabase
      .from('activity_cache')
      .select('*')
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lonDelta)
      .lte('longitude', longitude + lonDelta)
      .gte('updated_at', cutoff.toISOString())
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(50)

    if (error || !data) return []

    return (data as CachedActivity[]).map(this.cachedToActivity)
  }

  // Store activities in cache (upsert by provider + external_id)
  async cacheActivities(activities: Activity[]): Promise<void> {
    if (activities.length === 0) return

    const rows = activities.map((a) => ({
      provider: a.provider,
      external_id: a.externalId,
      name: a.name,
      description: a.description || null,
      category: a.category || null,
      duration_minutes: a.durationMinutes,
      price_amount: a.price.amount,
      price_currency: a.price.currency,
      rating: a.rating,
      review_count: a.reviewCount,
      image_url: a.imageUrl,
      booking_url: a.bookingUrl,
      latitude: a.location.latitude || null,
      longitude: a.location.longitude || null,
      city: a.location.city || null,
      country: a.location.country || null,
      raw_data: a.rawData || {},
      updated_at: new Date().toISOString(),
    }))

    const { error } = await this.supabase
      .from('activity_cache')
      .upsert(rows, { onConflict: 'provider,external_id' })

    if (error) {
      console.error('Cache upsert error:', error)
    }
  }

  // Get a single cached activity by provider + external ID
  async getCachedActivity(provider: string, externalId: string): Promise<Activity | null> {
    const { data } = await this.supabase
      .from('activity_cache')
      .select('*')
      .eq('provider', provider)
      .eq('external_id', externalId)
      .single()

    if (!data) return null
    return this.cachedToActivity(data as CachedActivity)
  }

  // Clear stale cache entries (older than TTL)
  async clearStaleCache(): Promise<number> {
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - CACHE_TTL_HOURS * 2) // Clear entries 2x older than TTL

    const { data, error } = await this.supabase
      .from('activity_cache')
      .delete()
      .lt('updated_at', cutoff.toISOString())
      .select('id')

    if (error) {
      console.error('Cache cleanup error:', error)
      return 0
    }

    return data?.length ?? 0
  }

  // Convert cached DB row (snake_case) to Activity type (camelCase)
  private cachedToActivity(cached: CachedActivity): Activity {
    return {
      id: cached.id,
      provider: cached.provider,
      externalId: cached.external_id,
      name: cached.name,
      description: cached.description || '',
      category: cached.category || 'activity',
      durationMinutes: cached.duration_minutes,
      price: {
        amount: cached.price_amount ?? 0,
        currency: cached.price_currency || 'EUR',
        formatted: `€${(cached.price_amount ?? 0).toFixed(2)}`,
      },
      rating: cached.rating,
      reviewCount: cached.review_count || 0,
      imageUrl: cached.image_url,
      bookingUrl: cached.booking_url || '',
      location: {
        latitude: cached.latitude ?? 0,
        longitude: cached.longitude ?? 0,
        city: cached.city || '',
        country: cached.country || '',
      },
      rawData: cached.raw_data,
    }
  }
}
