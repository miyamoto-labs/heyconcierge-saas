import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/ui/CookieBanner'

export const metadata: Metadata = {
  title: 'HeyConcierge — Your Friendly AI Concierge',
  description: 'AI-powered guest concierge for vacation rentals. Answers questions instantly via Telegram, WhatsApp, or SMS. Speaks every language and knows your property inside out.',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HeyConcierge',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-quicksand">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
