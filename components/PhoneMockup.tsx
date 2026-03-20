'use client'

import { useEffect, useRef } from 'react'

const conversation = [
  { role: 'guest' as const, text: 'Hi! What time is check-in?', time: '9:38' },
  { role: 'ai' as const, text: 'Welcome! Check-in is from 3PM. Your door code is 4821. Need early access? I can check with the host!', time: '9:38' },
  { role: 'guest' as const, text: 'Perfect. Is there parking nearby?', time: '9:39' },
  { role: 'ai' as const, text: 'Yes! Free street parking right outside. Paid garage on Storgata is a 2 min walk (~80 NOK/day). Location sent to your phone.', time: '9:39' },
  { role: 'guest' as const, text: 'Amazing! Any restaurant recommendations?', time: '9:41' },
  { role: 'ai' as const, text: "Absolutely! Try Emma's Drommekjokken for Arctic cuisine with stunning views, or Mathallen for casual bites. Both are walkable!", time: '9:41' },
]

export default function PhoneMockup() {
  const messagesRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return

    const addMessage = (msg: typeof conversation[0]) => {
      const isGuest = msg.role === 'guest'
      const row = document.createElement('div')
      row.className = `mockup-bubble-row ${msg.role}`

      const bubble = document.createElement('div')
      bubble.className = `mockup-bubble ${isGuest ? 'mockup-guest-bubble' : 'mockup-ai-bubble'}`

      const textSpan = document.createElement('span')
      textSpan.textContent = msg.text

      const meta = document.createElement('span')
      meta.className = 'mockup-bubble-meta'
      meta.innerHTML = msg.time + (isGuest ? ' <svg viewBox="0 0 16 11" width="16" height="11"><path d="M11.07 0.73l-7.02 7.51L1.48 5.37 0 6.79l3.05 3.19.49.52.49-.52 7.56-8.09z" fill="#53bdeb"/><path d="M15.07 0.73l-7.02 7.51-0.6-0.64-1.48 1.58 2.08 2.19.49.52.49-.52 7.56-8.09z" fill="#53bdeb"/></svg>' : '')

      bubble.appendChild(textSpan)
      bubble.appendChild(meta)
      row.appendChild(bubble)
      el.appendChild(row)

      requestAnimationFrame(() => {
        row.classList.add('visible')
        el.scrollTop = el.scrollHeight
      })
    }

    const showTyping = () => {
      const row = document.createElement('div')
      row.className = 'mockup-typing-indicator'

      const dots = document.createElement('div')
      dots.className = 'mockup-typing-dots'
      dots.innerHTML = '<span></span><span></span><span></span>'

      row.appendChild(dots)
      el.appendChild(row)

      requestAnimationFrame(() => {
        row.classList.add('visible')
        el.scrollTop = el.scrollHeight
      })
      return row
    }

    const removeTyping = (typingEl: HTMLElement) => {
      typingEl.classList.remove('visible')
      setTimeout(() => {
        if (typingEl.parentNode) typingEl.parentNode.removeChild(typingEl)
      }, 300)
    }

    const next = () => {
      if (idxRef.current >= conversation.length) {
        return
      }

      const msg = conversation[idxRef.current++]

      if (msg.role === 'guest') {
        const totalClicks = Math.floor(msg.text.length * 0.6)

        timeoutRef.current = setTimeout(() => {
          addMessage(msg)
          timeoutRef.current = setTimeout(next, 900 + Math.floor(Math.random() * 600))
        }, totalClicks * 130 + 100)
      } else {
        const typingEl = showTyping()
        const thinkTime = 1200 + msg.text.length * 18
        timeoutRef.current = setTimeout(() => {
          removeTyping(typingEl)
          timeoutRef.current = setTimeout(() => {
            addMessage(msg)
            timeoutRef.current = setTimeout(next, 1200 + Math.floor(Math.random() * 500))
          }, 200)
        }, thinkTime)
      }
    }

    timeoutRef.current = setTimeout(next, 1200)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="relative">
      <div className="mockup-phone">
        <div className="mockup-island">
          <div className="mockup-island-cam" />
        </div>
        <div className="mockup-screen">
          <div className="mockup-status-bar mockup-wa-status">
            <span>9:41</span>
            <div className="mockup-status-right">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="white" opacity="0.8">
                <rect x="0" y="5" width="3" height="5" rx="0.5" />
                <rect x="4" y="3" width="3" height="7" rx="0.5" />
                <rect x="8" y="1" width="3" height="9" rx="0.5" />
                <rect x="12" y="0" width="2" height="10" rx="0.5" opacity="0.4" />
              </svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="white" opacity="0.8">
                <path d="M7 1.5C9.2 1.5 11.2 2.5 12.5 4.1L13.7 2.9C12 1.1 9.6 0 7 0S2 1.1.3 2.9L1.5 4.1C2.8 2.5 4.8 1.5 7 1.5z" />
                <path d="M7 4C8.4 4 9.7 4.6 10.6 5.6L11.8 4.4C10.5 3.1 8.8 2.3 7 2.3S3.5 3.1 2.2 4.4L3.4 5.6C4.3 4.6 5.6 4 7 4z" />
                <circle cx="7" cy="8" r="1.5" />
              </svg>
              <div className="mockup-battery" />
            </div>
          </div>
          <div className="mockup-wa-header">
            <svg className="mockup-wa-back" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <div className="mockup-wa-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div className="mockup-wa-header-info">
              <h3>HeyConcierge</h3>
              <p>online</p>
            </div>
            <div className="mockup-wa-header-icons">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
          </div>
          <div className="mockup-wa-messages" ref={messagesRef}>
            <div className="mockup-wa-date-chip">Today</div>
          </div>
          <div className="mockup-wa-input-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8696a0">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
            <div className="mockup-wa-input">Type a message</div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#8696a0">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
            </svg>
            <div className="mockup-wa-mic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="mockup-label">
        <div className="mockup-label-dot" style={{ background: '#25D366' }} />
        <span>Live AI Concierge via WhatsApp</span>
      </div>
    </div>
  )
}
