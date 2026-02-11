import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Header } from '@/components/Header'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'AgentForge — Build AI Agents Without Code',
  description: 'Visual no-code builder for AI agents. Drag, drop, deploy.',
  openGraph: {
    title: 'AgentForge — Build AI Agents Without Code',
    description: 'Visual no-code builder for AI agents. Drag, drop, deploy.',
    url: 'https://agent-builder-gamma.vercel.app',
    siteName: 'AgentForge by Miyamoto Labs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentForge — Build AI Agents Without Code',
    description: 'Visual no-code builder for AI agents. Drag, drop, deploy.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
