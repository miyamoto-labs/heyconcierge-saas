'use client'
import { openCookieSettings } from './CookieBanner'

export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button onClick={openCookieSettings} className={className}>
      Cookie-innstillinger
    </button>
  )
}
