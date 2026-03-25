import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scanAndScheduleOffers, sendDueOffers, expireStaleOffers } from '@/lib/upsell'

export const maxDuration = 60

/**
 * Upsell cron endpoint — runs every 15 minutes via Vercel Cron
 * 1. Scans bookings and schedules offers based on property configs
 * 2. Sends due offers via Telegram
 * 3. Expires stale (24h+) unanswered offers
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    const scanResult = await scanAndScheduleOffers(supabase)
    const sendResult = await sendDueOffers(supabase)
    const expireResult = await expireStaleOffers(supabase)

    return NextResponse.json({
      success: true,
      scheduled: scanResult.scheduled,
      sent: sendResult.sent,
      expired: expireResult.expired,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Upsell cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron failed' },
      { status: 500 }
    )
  }
}
