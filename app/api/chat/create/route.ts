import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 chat creations per minute per IP
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(ip, 'chat-create', { limit: 5, windowSeconds: 60 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = createAdminClient()
    const { userEmail, userName } = await request.json()

    // Create new chat
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        user_email: userEmail || null,
        user_name: userName || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ chatId: chat.id })
  } catch (error) {
    console.error('Create chat error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}
