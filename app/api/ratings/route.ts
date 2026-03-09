import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { user, org } = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const propertyId = request.nextUrl.searchParams.get('propertyId')
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify property ownership
  const { data: property } = await supabase
    .from('properties')
    .select('id, org_id')
    .eq('id', propertyId)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  if (org && property.org_id && property.org_id !== org.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Fetch ratings for this property
  const { data: ratings, error } = await supabase
    .from('guest_ratings')
    .select('id, rating, comment, channel, status, completed_at, created_at')
    .eq('property_id', propertyId)
    .eq('status', 'completed')
    .not('rating', 'is', null)
    .order('completed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate stats
  const completedRatings = ratings || []
  const totalCount = completedRatings.length
  const averageRating = totalCount > 0
    ? completedRatings.reduce((sum, r) => sum + r.rating, 0) / totalCount
    : 0

  // Count by status (all ratings, not just completed)
  const { data: allRatings } = await supabase
    .from('guest_ratings')
    .select('status')
    .eq('property_id', propertyId)

  const statusCounts = {
    scheduled: 0,
    sent: 0,
    completed: totalCount,
    expired: 0,
  }
  if (allRatings) {
    for (const r of allRatings) {
      if (r.status in statusCounts) {
        statusCounts[r.status as keyof typeof statusCounts]++
      }
    }
  }

  return NextResponse.json({
    ratings: completedRatings,
    stats: {
      totalCompleted: totalCount,
      averageRating: Math.round(averageRating * 10) / 10,
      ...statusCounts,
    },
  })
}
