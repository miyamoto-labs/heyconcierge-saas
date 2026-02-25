'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  sender_type: 'user' | 'ai' | 'human'
  content: string
  created_at: string
}

export default function SimpleChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load chat ID from localStorage on mount
  useEffect(() => {
    const savedChatId = localStorage.getItem('heyconcierge_chat_id')
    if (savedChatId) {
      setChatId(savedChatId)
      loadMessages(savedChatId)
    }
  }, [])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!chatId) return

    const interval = setInterval(() => {
      loadMessages(chatId)
    }, 5000)

    return () => clearInterval(interval)
  }, [chatId])

  const loadMessages = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) {
      console.log('SimpleChatWidget: Empty message, not sending')
      return
    }
    
    const messageText = input.trim()
    console.log('SimpleChatWidget: Sending message:', messageText)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId || 'new',
          message: messageText,
          userEmail: '',
          userName: ''
        })
      })

      console.log('SimpleChatWidget: Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('SimpleChatWidget: Response data:', data)
        
        // Save chat ID if new
        if (!chatId && data.chatId) {
          setChatId(data.chatId)
          localStorage.setItem('heyconcierge_chat_id', data.chatId)
        }

        // Reload messages to get both user message and AI reply
        if (data.chatId) {
          await loadMessages(data.chatId)
        }
      } else {
        console.error('SimpleChatWidget: API error:', await response.text())
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('SimpleChatWidget: Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-purple-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full h-[100dvh] sm:bottom-4 sm:right-4 sm:w-[360px] sm:h-[500px] sm:rounded-2xl bg-white shadow-2xl flex flex-col" style={{ zIndex: 9999 }}>
          {/* Header */}
          <div className="bg-purple-600 text-white px-6 py-4 sm:rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold">HeyConcierge</h3>
                <p className="text-xs text-gray-200">Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('Start a new chat? This will clear the current conversation.')) {
                    localStorage.removeItem('heyconcierge_chat_id')
                    setChatId(null)
                    setMessages([])
                  }
                }}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                title="New chat"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl max-w-[80%]">
                  <p className="text-sm">Hi! 👋 How can I help you today?</p>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                  msg.sender_type === 'user'
                    ? 'bg-purple-600 text-white' 
                    : msg.sender_type === 'human'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  {msg.sender_type !== 'user' && (
                    <p className="text-xs opacity-80 mb-1">
                      {msg.sender_type === 'human' ? 'Team' : 'AI'}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading && input.trim()) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => {
                  console.log('SimpleChatWidget: Send button clicked')
                  sendMessage()
                }}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
