import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    // Get chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', params.id)
      .single()

    if (chatError) throw chatError

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', params.id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    return NextResponse.json({ chat, messages })
  } catch (error) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get chat' },
      { status: 500 }
    )
  }
}
