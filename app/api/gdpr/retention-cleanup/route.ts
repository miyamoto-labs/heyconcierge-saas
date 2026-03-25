import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GDPR Data Minimisation — Auto-delete guest data older than retention period.
// Run this via a cron job (e.g. Erik's Railway cron) once per day.
// Default retention: 90 days for messages, 90 days for inactive sessions.
//
// Trigger manually: POST /api/gdpr/retention-cleanup
// Secure with CRON_SECRET header in production.

const RETENTION_DAYS = 90

export async function POST(request: NextRequest) {
  // Basic auth for cron jobs
  const cronSecret = process.env.CRON_SECRET
  const secret = request.headers.get('x-cron-secret')
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffIso = cutoff.toISOString()

  const results: Record<string, number> = {}

  // Delete old messages
  const { count: msgCount } = await supabase
    .from('goconcierge_messages')
    .delete({ count: 'exact' })
    .lt('created_at', cutoffIso)
  results.messages_deleted = msgCount || 0

  // Delete inactive guest sessions
  const { count: sessionCount } = await supabase
    .from('guest_sessions')
    .delete({ count: 'exact' })
    .lt('last_message_at', cutoffIso)
  results.sessions_deleted = sessionCount || 0

  // Delete old resolved escalations
  const { count: escCount } = await supabase
    .from('escalations')
    .delete({ count: 'exact' })
    .eq('status', 'resolved')
    .lt('created_at', cutoffIso)
  results.escalations_deleted = escCount || 0

  console.log(`GDPR retention cleanup (${RETENTION_DAYS}d):`, results)

  return NextResponse.json({
    ok: true,
    retention_days: RETENTION_DAYS,
    cutoff: cutoffIso,
    deleted: results,
  })
}
