import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'AgentWatch — AI Agent Monitoring',
  description: 'Never let your AI agents fail silently. Real-time monitoring, alerts, and performance tracking for AI agents in production.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface antialiased">
        <Nav />
        {children}
      </body>
    </html>
  )
}
