import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const supabase = createAdminClient()

    // Get properties for this org
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('org_id', org.id)

    const propertyIds = properties?.map(p => p.id) || []
    const propertyCount = propertyIds.length

    // Count messages this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    let messageCount = 0
    if (propertyIds.length > 0) {
      const { count } = await supabase
        .from('goconcierge_messages')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('role', 'assistant')
        .gte('created_at', monthStart)

      messageCount = count || 0
    }

    // Count unique guests this month
    let guestCount = 0
    if (propertyIds.length > 0) {
      const { data: sessions } = await supabase
        .from('guest_sessions')
        .select('id')
        .in('property_id', propertyIds)
        .gte('created_at', monthStart)

      guestCount = sessions?.length || 0
    }

    return NextResponse.json({
      properties: propertyCount,
      messages: messageCount,
      guests: guestCount,
      period: {
        start: monthStart,
        end: now.toISOString(),
        label: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      },
    })
  } catch (error) {
    console.error('Billing usage error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}
