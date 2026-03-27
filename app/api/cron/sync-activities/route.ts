// HeyConcierge OTA — Daily Activity Sync Cron Job
// Refreshes cached activities for all properties with OTA enabled
// Schedule: daily at 06:00 UTC (vercel.json)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchActivities, ActivityCache } from '@/lib/activities'
import type { ActivitySearchParams, PropertyOTAConfig } from '@/lib/activities'

export const maxDuration = 120 // Allow up to 2 minutes for syncing multiple properties

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  try {
    // 1. Clean stale cache entries
    const cache = new ActivityCache(supabase)
    const cleaned = await cache.clearStaleCache()
    console.log(`Cleaned ${cleaned} stale cache entries`)

    // 2. Get all properties with OTA enabled and location set
    const { data: properties, error: propErr } = await supabase
      .from('properties')
      .select(`
        id, name, latitude, longitude, city, country,
        property_ota_configs(*)
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (propErr || !properties) {
      console.error('Failed to load properties for sync:', propErr)
      return NextResponse.json({ error: 'Failed to load properties' }, { status: 500 })
    }

    // Filter to properties with OTA configs (or all if no config = defaults enabled)
    const syncResults: Array<{
      propertyId: string
      propertyName: string
      activitiesFound: number
      error?: string
    }> = []

    for (const property of properties) {
      const otaConfigRaw = Array.isArray(property.property_ota_configs)
        ? property.property_ota_configs[0]
        : property.property_ota_configs

      // Skip if explicitly disabled
      if (otaConfigRaw && !otaConfigRaw.getyourguide_enabled && !otaConfigRaw.viator_enabled) {
        continue
      }

      const otaConfig: PropertyOTAConfig | null = otaConfigRaw
        ? {
            id: otaConfigRaw.id,
            propertyId: otaConfigRaw.property_id,
            getyourguideEnabled: otaConfigRaw.getyourguide_enabled,
            viatorEnabled: otaConfigRaw.viator_enabled,
            autoRecommend: otaConfigRaw.auto_recommend,
            maxRecommendations: otaConfigRaw.max_recommendations,
            minRating: otaConfigRaw.min_rating,
            maxPriceEur: otaConfigRaw.max_price_eur,
            preferredCategories: otaConfigRaw.preferred_categories || [],
            customMessage: otaConfigRaw.custom_message,
          }
        : null

      try {
        const searchParams: ActivitySearchParams = {
          latitude: Number(property.latitude),
          longitude: Number(property.longitude),
          radiusKm: 25,
          currency: 'EUR',
          limit: 20, // Cache more than we show to guests
          minRating: otaConfig?.minRating ?? 4.0,
        }

        const result = await searchActivities(
          searchParams,
          otaConfig,
          supabase,
          property.id,
        )

        syncResults.push({
          propertyId: property.id,
          propertyName: property.name,
          activitiesFound: result.totalCount,
        })

        console.log(`Synced ${result.totalCount} activities for ${property.name}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        syncResults.push({
          propertyId: property.id,
          propertyName: property.name,
          activitiesFound: 0,
          error: message,
        })
        console.error(`Failed to sync activities for ${property.name}:`, err)
      }

      // Small delay between properties to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      ok: true,
      staleEntriesCleaned: cleaned,
      propertiesSynced: syncResults.length,
      results: syncResults,
    })
  } catch (error) {
    console.error('Activity sync cron error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
