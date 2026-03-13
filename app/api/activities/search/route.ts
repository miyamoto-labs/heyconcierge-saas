// HeyConcierge OTA — Activity Search API
// Used by both the dashboard and the AI concierge (via tool calling)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchActivities } from '@/lib/activities'
import type { ActivitySearchParams, PropertyOTAConfig } from '@/lib/activities'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  try {
    const body = await request.json()
    const { propertyId, query, date, participants, maxPrice, limit } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    // Load property for location
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('id, name, latitude, longitude, city, country')
      .eq('id', propertyId)
      .single()

    if (propErr || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (!property.latitude || !property.longitude) {
      return NextResponse.json({
        error: 'Property location not configured. Set latitude/longitude in property settings.',
      }, { status: 400 })
    }

    // Load OTA config for this property
    const { data: otaConfig } = await supabase
      .from('property_ota_configs')
      .select('*')
      .eq('property_id', propertyId)
      .single()

    const config: PropertyOTAConfig | null = otaConfig
      ? {
          id: otaConfig.id,
          propertyId: otaConfig.property_id,
          getyourguideEnabled: otaConfig.getyourguide_enabled,
          viatorEnabled: otaConfig.viator_enabled,
          autoRecommend: otaConfig.auto_recommend,
          maxRecommendations: otaConfig.max_recommendations,
          minRating: otaConfig.min_rating,
          maxPriceEur: otaConfig.max_price_eur,
          preferredCategories: otaConfig.preferred_categories || [],
          customMessage: otaConfig.custom_message,
        }
      : null

    // Build search params
    const searchParams: ActivitySearchParams = {
      query: query || undefined,
      latitude: Number(property.latitude),
      longitude: Number(property.longitude),
      radiusKm: 25,
      currency: 'EUR',
      startDate: date || undefined,
      participants: participants || 2,
      maxPriceAmount: maxPrice || undefined,
      limit: limit || config?.maxRecommendations || 5,
    }

    const result = await searchActivities(searchParams, config, supabase, propertyId)

    return NextResponse.json({
      activities: result.activities,
      totalCount: result.totalCount,
      providers: result.providers,
      cached: result.cached,
      propertyName: property.name,
      propertyCity: property.city,
    })
  } catch (error) {
    console.error('Activity search error:', error)
    return NextResponse.json(
      { error: 'Failed to search activities' },
      { status: 500 },
    )
  }
}
