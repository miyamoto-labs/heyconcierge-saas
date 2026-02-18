'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'hc_cookie_consent'
const RESET_EVENT = 'hc:cookie-reset'

export type CookieConsent = 'all' | 'necessary' | null

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(STORAGE_KEY) as CookieConsent) || null
}

export function openCookieSettings() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(RESET_EVENT))
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)

    const handler = () => setVisible(true)
    window.addEventListener(RESET_EVENT, handler)
    return () => window.removeEventListener(RESET_EVENT, handler)
  }, [])

  function accept(choice: 'all' | 'necessary') {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1 text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
          <span className="text-white font-semibold">🍪 Vi bruker cookies</span>{' '}
          for å holde deg innlogget og forstå hvordan nettsiden brukes. Les mer i vår{' '}
          <Link href="/legal/cookies" className="text-[#a78bfa] hover:underline">
            Cookie Policy
          </Link>
          .
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => accept('necessary')}
            className="text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)]"
          >
            Kun nødvendige
          </button>
          <button
            onClick={() => accept('all')}
            className="text-sm font-semibold bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2 rounded-lg transition"
          >
            Godta alle
          </button>
        </div>
      </div>
    </div>
  )
}
