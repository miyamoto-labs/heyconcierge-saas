'use client'

import { useEffect, useRef } from 'react'

type MessageItem = {
  role: 'guest' | 'ai'
  text?: string
  time: string
  cards?: {
    type: 'restaurant' | 'activity'
    name: string
    desc: string
    rating?: string
    price?: string
    bookable?: boolean
  }[]
  image?: {
    caption: string
  }
}

const conversation: MessageItem[] = [
  { role: 'guest', text: 'Any good restaurants nearby?', time: '9:38' },
  {
    role: 'ai',
    text: 'Here are my top 3 picks! 🍽️',
    time: '9:38',
    cards: [
      { type: 'restaurant', name: 'Emma\'s Drømmekjøkken', desc: 'Arctic fine dining, stunning views', rating: '4.8' },
      { type: 'restaurant', name: 'Mathallen Tromsø', desc: 'Casual bites, local favorites', rating: '4.6' },
      { type: 'restaurant', name: 'Fiskekompaniet', desc: 'Fresh seafood by the harbour', rating: '4.7' },
    ],
  },
  { role: 'guest', text: "We'd love to see the Northern Lights!", time: '9:41' },
  {
    role: 'ai',
    text: 'Great choice! Here are the best experiences:',
    time: '9:41',
    cards: [
      { type: 'activity', name: 'Arctic Explorer Tours', desc: 'Northern Lights chase, 4 hours', price: 'From 1,290 NOK', bookable: true },
      { type: 'activity', name: 'Tromsø Safari', desc: 'Lights & reindeer combo, 5 hours', price: 'From 1,690 NOK', bookable: true },
      { type: 'activity', name: 'Pukka Travels', desc: 'Small group aurora hunt, 6 hours', price: 'From 1,490 NOK', bookable: true },
    ],
  },
  { role: 'guest', text: "I can't find the keybox 😅", time: '23:12' },
  {
    role: 'ai',
    text: "No worries! Here's exactly where it is:",
    time: '23:12',
    image: {
      caption: "The main key is placed in a key box attached on the railing on the north side of the building. This is the side of the building that is towards the city center 🔑",
    },
  },
]

function renderCard(card: MessageItem['cards'][0]) {
  const div = document.createElement('div')
  div.className = 'mockup-card'

  if (card.type === 'restaurant') {
    div.innerHTML = `
      <div class="mockup-card-header">
        <span class="mockup-card-name">${card.name}</span>
        <span class="mockup-card-rating">⭐ ${card.rating}</span>
      </div>
      <div class="mockup-card-desc">${card.desc}</div>
      <div class="mockup-card-action mockup-card-maps">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#ea4335"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        View on Maps
      </div>
    `
  } else {
    div.innerHTML = `
      <div class="mockup-card-header">
        <span class="mockup-card-name">${card.name}</span>
      </div>
      <div class="mockup-card-desc">${card.desc}</div>
      <div class="mockup-card-price">${card.price}</div>
      <div class="mockup-card-action mockup-card-book">Book Now →</div>
    `
  }

  return div
}

export default function PhoneMockup() {
  const messagesRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return

    const addMessage = (msg: MessageItem) => {
      const isGuest = msg.role === 'guest'
      const row = document.createElement('div')
      row.className = `mockup-bubble-row ${msg.role}`

      const bubble = document.createElement('div')
      bubble.className = `mockup-bubble ${isGuest ? 'mockup-guest-bubble' : 'mockup-ai-bubble'}`

      if (msg.text) {
        const textSpan = document.createElement('span')
        textSpan.textContent = msg.text
        bubble.appendChild(textSpan)
      }

      // Add image if present
      if (msg.image) {
        const imgWrap = document.createElement('div')
        imgWrap.className = 'mockup-image-wrap'
        imgWrap.innerHTML = `
          <div class="mockup-image-placeholder">
            <img src="/Keybox.png" alt="Keybox location" />
          </div>
          <div class="mockup-image-caption">${msg.image.caption}</div>
        `
        bubble.appendChild(imgWrap)
      }

      // Add cards if present
      if (msg.cards && msg.cards.length > 0) {
        const cardsContainer = document.createElement('div')
        cardsContainer.className = 'mockup-cards-container'
        msg.cards.forEach((card) => {
          cardsContainer.appendChild(renderCard(card))
        })
        bubble.appendChild(cardsContainer)
      }

      const meta = document.createElement('span')
      meta.className = 'mockup-bubble-meta'
      meta.innerHTML = msg.time + (isGuest ? ' <svg viewBox="0 0 16 11" width="16" height="11"><path d="M11.07 0.73l-7.02 7.51L1.48 5.37 0 6.79l3.05 3.19.49.52.49-.52 7.56-8.09z" fill="#53bdeb"/><path d="M15.07 0.73l-7.02 7.51-0.6-0.64-1.48 1.58 2.08 2.19.49.52.49-.52 7.56-8.09z" fill="#53bdeb"/></svg>' : '')

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
        const totalClicks = Math.floor((msg.text?.length || 20) * 0.6)

        timeoutRef.current = setTimeout(() => {
          addMessage(msg)
          timeoutRef.current = setTimeout(next, 900 + Math.floor(Math.random() * 600))
        }, totalClicks * 130 + 100)
      } else {
        const typingEl = showTyping()
        const thinkTime = 1200 + (msg.text?.length || 30) * 18
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
