import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GDPR Article 15 & 20 — Right of Access + Data Portability
// Returns all personal data held for a guest as JSON.
// Requires authenticated user who owns the property.

export async function GET(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user || !org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const phone = searchParams.get('phone')
    const telegram_chat_id = searchParams.get('telegram_chat_id')
    const property_id = searchParams.get('property_id')

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

    const data: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      subject: { phone, telegram_chat_id },
    }

    if (phone) {
      const { data: messages } = await supabase
        .from('goconcierge_messages')
        .select('role, content, channel, created_at')
        .eq('guest_phone', phone)
        .eq('property_id', property_id)
        .order('created_at', { ascending: true })
      data.messages = messages || []

      const { data: sessions } = await supabase
        .from('guest_sessions')
        .select('property_id, created_at, last_message_at')
        .eq('guest_phone', phone)
        .eq('property_id', property_id)
      data.sessions = sessions || []

      const { data: escalations } = await supabase
        .from('escalations')
        .select('message, ai_response, reason, status, created_at')
        .eq('guest_phone', phone)
        .eq('property_id', property_id)
      data.escalations = escalations || []
    }

    if (telegram_chat_id) {
      const tgPhone = `tg:${telegram_chat_id}`
      const { data: messages } = await supabase
        .from('goconcierge_messages')
        .select('role, content, channel, created_at')
        .eq('guest_phone', tgPhone)
        .eq('property_id', property_id)
        .order('created_at', { ascending: true })
      data.telegram_messages = messages || []
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': `attachment; filename="heyconcierge-data-export-${Date.now()}.json"`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('GDPR export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
