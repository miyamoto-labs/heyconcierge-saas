'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Chat {
  id: string
  user_email: string | null
  user_name: string | null
  status: 'active' | 'escalated' | 'resolved'
  created_at: string
  escalated_at: string | null
}

interface Message {
  id: string
  sender_type: 'user' | 'ai' | 'human'
  content: string
  created_at: string
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    loadChats()
    
    // Poll for new chats every 10 seconds
    const chatsPollInterval = setInterval(() => {
      loadChats()
    }, 10000)

    return () => clearInterval(chatsPollInterval)
  }, [])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
    }
  }, [selectedChat])

  // Poll for new messages every 3 seconds when chat is selected
  useEffect(() => {
    if (!selectedChat) return

    const pollInterval = setInterval(() => {
      loadMessages(selectedChat.id)
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [selectedChat?.id])

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setChats(data || [])
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChat || !replyText.trim()) return

    setIsSending(true)

    try {
      const response = await fetch('/api/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: replyText.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send reply')
      }

      const data = await response.json()

      // Add to local messages immediately for instant feedback
      setMessages(prev => [...prev, {
        id: data.message.id,
        sender_type: 'human',
        content: data.message.content,
        created_at: data.message.created_at
      }])

      setReplyText('')
      
      // Trigger immediate poll to sync
      loadMessages(selectedChat.id)
    } catch (error) {
      console.error('Failed to send reply:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const deleteChat = async (chatId: string, chatName: string) => {
    if (!confirm(`Delete chat with "${chatName}"? This will permanently remove all messages.`)) return

    try {
      const response = await fetch(`/api/chat/${chatId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete chat')

      // Clear selection if we deleted the selected chat
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
        setMessages([])
      }

      // Remove from list
      setChats(prev => prev.filter(c => c.id !== chatId))
    } catch (error) {
      console.error('Failed to delete chat:', error)
      alert('Failed to delete chat. Please try again.')
    }
  }

  const resolveChat = async () => {
    if (!selectedChat) return

    try {
      await supabase
        .from('chats')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', selectedChat.id)

      setSelectedChat({ ...selectedChat, status: 'resolved' })
      loadChats()
    } catch (error) {
      console.error('Failed to resolve chat:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escalated': return 'bg-red-100 text-red-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-950 p-6 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Customer Chats</h1>
            <p className="text-slate-400 mt-1">
              {chats.filter(c => c.status === 'escalated').length} escalated • {chats.filter(c => c.status === 'active').length} active
            </p>
          </div>
          <Link
            href="/admin"
            className="text-slate-400 hover:text-white transition"
          >
            ← Back to Admin
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0 h-full overflow-hidden">
          {/* Chat List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex-shrink-0">
              <h2 className="font-semibold text-white">All Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 text-left hover:bg-slate-800/60 transition ${
                    selectedChat?.id === chat.id ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">
                        {chat.user_name || chat.user_email || 'Anonymous'}
                      </p>
                      {chat.user_email && chat.user_name && (
                        <p className="text-xs text-slate-400">{chat.user_email}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(chat.status)}`}>
                      {chat.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(chat.created_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="col-span-2 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="font-semibold text-white">
                      {selectedChat.user_name || selectedChat.user_email || 'Anonymous'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Started {new Date(selectedChat.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedChat.status !== 'resolved' && (
                      <button
                        onClick={resolveChat}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => deleteChat(selectedChat.id, selectedChat.user_name || selectedChat.user_email || 'Anonymous')}
                      className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-600 hover:text-white transition border border-red-600/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-400px)]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          msg.sender_type === 'user'
                            ? 'bg-blue-600 text-white'
                            : msg.sender_type === 'human'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {msg.sender_type !== 'user' && (
                          <p className="text-xs opacity-80 mb-1">
                            {msg.sender_type === 'human' ? 'You (Team)' : 'AI'}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <form onSubmit={sendReply} className="p-4 border-t border-slate-800 flex-shrink-0">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none resize-none text-white placeholder-slate-500"
                      disabled={isSending || selectedChat.status === 'resolved'}
                    />
                    <button
                      type="submit"
                      disabled={isSending || !replyText.trim() || selectedChat.status === 'resolved'}
                      className="px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <p>Select a chat to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
