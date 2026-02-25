'use client'

import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    setIsStandalone(standalone)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    }

    // For iOS, show prompt after a delay if not already installed
    if (iOS && !standalone) {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed')
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }

    // Listen for install prompt (Android/Chrome)
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

  const handleDismiss = () => {
    setShowPrompt(false)
    if (isIOS) {
      localStorage.setItem('pwa-prompt-dismissed', 'true')
    }
  }

  if (!showPrompt || isStandalone) return null

  // iOS-specific prompt
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
        <div className="pr-6">
          <p className="font-semibold mb-2">📱 Install HeyConcierge</p>
          <p className="text-sm text-gray-300 mb-3">Add to your home screen for quick access:</p>
          <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
            <li>Tap the Share button <span className="inline-block">⎋</span></li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add"</li>
          </ol>
        </div>
      </div>
    )
  }

  // Android/Chrome prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md mx-auto">
      <div className="flex-1">
        <p className="font-semibold">Install HeyConcierge</p>
        <p className="text-sm text-gray-300">Add to your home screen for quick access</p>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={handleDismiss}
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
