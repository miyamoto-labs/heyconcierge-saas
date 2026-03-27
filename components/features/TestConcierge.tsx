'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: number
  role: 'guest' | 'concierge'
  text: string
  images?: string[]
}

interface TestConciergeProps {
  property: any
  config: any
  onClose: () => void
}

const SAMPLE_QUESTIONS = [
  "What's the WiFi password?",
  "How do I check in?",
  "Any restaurant recommendations?",
  "What are the house rules?",
  "Where can I park?",
]

export default function TestConcierge({ property, config, onClose }: TestConciergeProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  let nextIdRef = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const guestMsg: Message = { id: nextIdRef.current++, role: 'guest', text: text.trim() }
    setMessages(prev => [...prev, guestMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/test-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), property, config }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const conciergeMsg: Message = { id: nextIdRef.current++, role: 'concierge', text: data.reply, images: data.images }
      setMessages(prev => [...prev, conciergeMsg])
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Unknown error'
      const errorMsg: Message = {
        id: nextIdRef.current++,
        role: 'concierge',
        text: `Oops! ${errorText}`
      }
      setMessages(prev => [...prev, errorMsg])
    }
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Chat window */}
      <div
        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-earth-border"
        style={{ height: 'min(680px, 85vh)', animation: 'chatSlideUp 0.4s ease-out' }}
      >
        {/* Header */}
        <div className="bg-white border-b border-earth-border px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="relative shrink-0">
            <img
              src="/mascot.png"
              alt="Concierge"
              className="w-10 h-10 rounded-full object-cover bg-grove-subtle"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-earth-dark font-medium text-sm truncate">{property.name || 'Your Property'}</h3>
            <p className="text-earth-muted text-xs">AI Concierge Preview</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-grove-subtle hover:bg-earth-border flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4 text-earth-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-grove-subtle/30" style={{ overscrollBehavior: 'contain' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <img
                src="/mascot.png"
                alt="Concierge"
                className="w-20 h-20 rounded-full object-cover bg-grove-subtle mb-4"
              />
              <p className="text-earth-dark font-medium text-sm">Try your AI concierge!</p>
              <p className="text-earth-muted text-xs mt-1 max-w-[260px]">
                Send a message to see how your concierge responds to guests
              </p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-[320px]">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full bg-white border border-earth-border text-xs font-medium text-earth-dark hover:border-grove hover:text-grove transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'guest' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'msgPop 0.3s ease-out' }}
            >
              {msg.role === 'concierge' && (
                <img
                  src="/mascot.png"
                  alt="Concierge"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mr-2 mt-1 bg-grove-subtle"
                />
              )}
              <div
                className={`max-w-[80%] rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'guest'
                    ? 'bg-grove text-white rounded-br-sm px-4 py-2.5'
                    : 'bg-white text-earth-dark shadow-saas-sm border border-earth-border rounded-bl-sm'
                }`}
              >
                {msg.role === 'concierge' && msg.images && msg.images.length > 0 && (
                  <div className="p-2 pb-0 flex gap-1.5 flex-wrap">
                    {msg.images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Property photo ${i + 1}`}
                        className="w-full rounded-xl object-cover max-h-48"
                      />
                    ))}
                  </div>
                )}
                <div className={msg.role === 'concierge' ? 'px-4 py-2.5 whitespace-pre-wrap' : 'whitespace-pre-wrap'}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start" style={{ animation: 'msgPop 0.3s ease-out' }}>
              <img
                src="/mascot.png"
                alt="Concierge"
                className="w-7 h-7 rounded-full object-cover shrink-0 mr-2 mt-1 bg-grove-subtle"
              />
              <div className="bg-white border border-earth-border px-4 py-3 rounded-2xl rounded-bl-sm shadow-saas-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-grove/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-grove/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-grove/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {messages.length > 0 && messages.length < 6 && !loading && (
          <div className="px-4 py-2 bg-white border-t border-earth-border flex gap-1.5 overflow-x-auto shrink-0">
            {SAMPLE_QUESTIONS.filter(q => !messages.some(m => m.text === q)).slice(0, 3).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-full bg-grove-subtle border border-earth-border text-xs font-medium text-earth-dark hover:border-grove hover:text-grove transition-all whitespace-nowrap shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 bg-white border-t border-earth-border flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your concierge something..."
            className="flex-1 px-4 py-2.5 rounded-full bg-grove-subtle/50 border border-earth-border text-sm outline-none focus:border-grove transition-all text-earth-dark"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-grove text-white flex items-center justify-center hover:bg-grove-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes msgPop {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
