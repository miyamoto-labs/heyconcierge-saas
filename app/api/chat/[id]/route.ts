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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete messages first (foreign key constraint)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', params.id)

    if (messagesError) throw messagesError

    // Delete the chat
    const { error: chatError } = await supabase
      .from('chats')
      .delete()
      .eq('id', params.id)

    if (chatError) throw chatError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chat error:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}
