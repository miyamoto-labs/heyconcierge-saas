'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_type: 'user' | 'ai' | 'human'
  content: string
  created_at: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [showContactForm, setShowContactForm] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Poll for new messages from team every 5 seconds
  useEffect(() => {
    if (!chatId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > messages.length) {
            setMessages(data.messages)
          }
        }
      } catch (error) {
        console.error('Poll error:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [chatId, messages.length])

  useEffect(() => {
    // Check if chat ID exists in localStorage
    const savedChatId = localStorage.getItem('heyconcierge_chat_id')
    if (savedChatId) {
      setChatId(savedChatId)
      setShowContactForm(false)
      loadChatHistory(savedChatId)
    }
  }, [])

  const loadChatHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/chat/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const startChat = async () => {
    if (!userEmail && !userName) {
      setShowContactForm(false)
      return
    }

    try {
      const response = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, userName })
      })

      if (response.ok) {
        const data = await response.json()
        setChatId(data.chatId)
        localStorage.setItem('heyconcierge_chat_id', data.chatId)
        setShowContactForm(false)
        
        // Send welcome message
        setMessages([
          {
            id: '0',
            sender_type: 'ai',
            content: `Hi${userName ? ` ${userName}` : ''}! 👋 I'm here to help you with HeyConcierge. Ask me anything!`,
            created_at: new Date().toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Failed to create chat:', error)
      setShowContactForm(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender_type: 'user',
      content: inputValue.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId || 'new',
          message: userMessage.content,
          userEmail,
          userName
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Save chat ID if new
        if (!chatId && data.chatId) {
          setChatId(data.chatId)
          localStorage.setItem('heyconcierge_chat_id', data.chatId)
        }

        // Add AI response
        if (data.reply) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender_type: 'ai',
            content: data.reply,
            created_at: new Date().toISOString()
          }])
        }

        // If escalated (and not already escalated before), show notification
        if (data.escalated && data.reply && data.reply.includes("I'll connect you")) {
          // Only show escalation message if it's the first time (API will send the message)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender_type: 'ai',
        content: "Sorry, I'm having trouble connecting. Please try again.",
        created_at: new Date().toISOString()
      }])
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
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-50"
          aria-label="Open chat"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 max-md:w-full max-md:h-full max-md:bottom-0 max-md:right-0 max-md:rounded-none">
          {/* Header */}
          <div className="bg-primary text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold">HeyConcierge</h3>
                <p className="text-xs text-gray-200">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {showContactForm ? (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="font-bold text-lg mb-2">Welcome! 👋</h4>
                <p className="text-sm text-gray-600 mb-4">
                  We'd love to know who we're chatting with (optional):
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={startChat}
                    className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-dark transition"
                  >
                    Start Chat
                  </button>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-800"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.sender_type === 'user'
                          ? 'bg-primary text-white'
                          : msg.sender_type === 'human'
                          ? 'bg-accent text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {msg.sender_type === 'human' && (
                        <p className="text-xs opacity-80 mb-1">Team</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {!showContactForm && (
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  )
}
