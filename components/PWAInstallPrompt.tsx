'use client'

import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User response to install prompt: ${outcome}`)
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md mx-auto">
      <div className="flex-1">
        <p className="font-semibold">Install HeyConcierge</p>
        <p className="text-sm text-gray-300">Add to your home screen for quick access</p>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={() => setShowPrompt(false)}
          className="px-4 py-2 text-sm text-gray-300 hover:text-white"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-white text-black rounded font-semibold text-sm hover:bg-gray-200"
        >
          Install
        </button>
      </div>
    </div>
  )
}
