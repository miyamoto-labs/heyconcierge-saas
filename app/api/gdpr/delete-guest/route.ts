import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// GDPR Article 17 — Right to Erasure
// Deletes all personal data for a guest identified by phone or Telegram chat ID.
// Requires authenticated user who owns the property.

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user || !org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone, telegram_chat_id, property_id } = await request.json()

    if (!phone && !telegram_chat_id) {
      return NextResponse.json(
        { error: 'Must provide phone or telegram_chat_id' },
        { status: 400 }
      )
    }

    if (!property_id) {
      return NextResponse.json(
        { error: 'Must provide property_id' },
        { status: 400 }
      )
    }

    // Verify user owns this property
    const supabase = createAdminClient()
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', property_id)
      .eq('org_id', org.id)
      .single()

    if (!property) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 403 })
    }

    const deleted: Record<string, number> = {}

    if (phone) {
      // Delete messages
      const { count: msgCount } = await supabase
        .from('goconcierge_messages')
        .delete({ count: 'exact' })
        .eq('guest_phone', phone)
        .eq('property_id', property_id)
      deleted.messages = msgCount || 0

      // Delete guest session
      const { count: sessionCount } = await supabase
        .from('guest_sessions')
        .delete({ count: 'exact' })
        .eq('guest_phone', phone)
        .eq('property_id', property_id)
      deleted.sessions = sessionCount || 0

      // Delete escalations
      const { count: escCount } = await supabase
        .from('escalations')
        .delete({ count: 'exact' })
        .eq('guest_phone', phone)
        .eq('property_id', property_id)
      deleted.escalations = escCount || 0
    }

    if (telegram_chat_id) {
      const tgPhone = `tg:${telegram_chat_id}`

      const { count: msgCount } = await supabase
        .from('goconcierge_messages')
        .delete({ count: 'exact' })
        .eq('guest_phone', tgPhone)
        .eq('property_id', property_id)
      deleted.telegram_messages = msgCount || 0

      const { count: sessionCount } = await supabase
        .from('guest_sessions')
        .delete({ count: 'exact' })
        .eq('telegram_chat_id', telegram_chat_id)
        .eq('property_id', property_id)
      deleted.telegram_sessions = sessionCount || 0
    }

    return NextResponse.json({
      ok: true,
      deleted,
      message: 'All personal data for this guest has been erased.',
    })
  } catch (error) {
    console.error('GDPR delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deletion failed' },
      { status: 500 }
    )
  }
}
