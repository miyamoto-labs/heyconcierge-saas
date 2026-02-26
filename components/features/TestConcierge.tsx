'use client'

import { useState, useRef, useEffect } from 'react'
import AnimatedMascot from '@/components/brand/AnimatedMascot'

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
  const [mascotMood, setMascotMood] = useState<'idle' | 'thinking' | 'happy' | 'waving'>('waving')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  let nextIdRef = useRef(0)

  useEffect(() => {
    // Start with a wave, then go idle
    const timer = setTimeout(() => setMascotMood('idle'), 2000)
    inputRef.current?.focus()
    return () => clearTimeout(timer)
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
    setMascotMood('thinking')

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
      setMascotMood('happy')
      setTimeout(() => setMascotMood('idle'), 2000)
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Unknown error'
      const errorMsg: Message = {
        id: nextIdRef.current++,
        role: 'concierge',
        text: `Oops! ${errorText}`
      }
      setMessages(prev => [...prev, errorMsg])
      setMascotMood('idle')
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
        className="relative w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ height: 'min(680px, 85vh)', animation: 'chatSlideUp 0.4s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="relative">
            <AnimatedMascot mood={mascotMood} size={44} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#55EFC4] rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-black text-base truncate">{property.name || 'Your Property'}</h3>
            <p className="text-white/70 text-xs font-medium">AI Concierge Preview</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F8F6FF]" style={{ overscrollBehavior: 'contain' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <AnimatedMascot mood={mascotMood} size={80} />
              <p className="text-dark font-bold mt-3 text-sm">Try your AI concierge!</p>
              <p className="text-muted text-xs mt-1 max-w-[260px]">
                Send a message to see how your concierge responds to guests
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center max-w-[320px]">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full bg-white border border-[rgba(108,92,231,0.15)] text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all hover:-translate-y-0.5"
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
                <div className="shrink-0 mr-2 mt-1">
                  <AnimatedMascot mood="idle" size={28} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'guest'
                    ? 'bg-primary text-white rounded-br-md px-4 py-2.5'
                    : 'bg-white text-dark shadow-sm border border-[rgba(108,92,231,0.08)] rounded-bl-md'
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
              <div className="shrink-0 mr-2 mt-1">
                <AnimatedMascot mood="thinking" size={28} />
              </div>
              <div className="bg-white text-dark shadow-sm border border-[rgba(108,92,231,0.08)] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies (shown after first message) */}
        {messages.length > 0 && messages.length < 6 && !loading && (
          <div className="px-4 py-2 bg-[#F8F6FF] border-t border-[rgba(108,92,231,0.06)] flex gap-1.5 overflow-x-auto shrink-0">
            {SAMPLE_QUESTIONS.filter(q => !messages.some(m => m.text === q)).slice(0, 3).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-full bg-white border border-[rgba(108,92,231,0.15)] text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all whitespace-nowrap shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 bg-white border-t border-[rgba(108,92,231,0.08)] flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your concierge something..."
            className="flex-1 px-4 py-2.5 rounded-full bg-[#F8F6FF] border border-[rgba(108,92,231,0.12)] text-sm outline-none focus:border-primary transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-[#5A4BD1] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
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
