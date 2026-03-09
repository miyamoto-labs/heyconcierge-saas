import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { user } = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const propertyId = request.nextUrl.searchParams.get('propertyId')
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch completed ratings and all status counts in parallel
  const [completedResult, allResult] = await Promise.all([
    supabase
      .from('guest_ratings')
      .select('id, rating, comment, channel, status, completed_at, created_at')
      .eq('property_id', propertyId)
      .eq('status', 'completed')
      .not('rating', 'is', null)
      .order('completed_at', { ascending: false }),
    supabase
      .from('guest_ratings')
      .select('status')
      .eq('property_id', propertyId),
  ])

  if (completedResult.error) {
    return NextResponse.json({ error: completedResult.error.message }, { status: 500 })
  }

  const completedRatings = completedResult.data || []
  const totalCount = completedRatings.length
  const averageRating = totalCount > 0
    ? completedRatings.reduce((sum, r) => sum + r.rating, 0) / totalCount
    : 0

  const allRatings = allResult.data

  const statusCounts = {
    scheduled: 0,
    sent: 0,
    completed: 0,
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
