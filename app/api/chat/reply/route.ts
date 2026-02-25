import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')
    if (!adminSession?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, content } = await request.json()

    if (!chatId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing chatId or content' },
        { status: 400 }
      )
    }

    // Insert admin/human reply
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: 'human',
        content: content.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Insert message error:', error)
      throw error
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    )
  }
}
