'use client'
import Link from 'next/link'
import { useAuth } from './auth/AuthProvider'
import { UserMenu } from './auth/UserMenu'
import { Bot } from 'lucide-react'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Bot className="w-6 h-6 text-purple-500" /> AgentForge
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/builder" className="text-sm text-gray-400 hover:text-white transition">Builder</Link>
          <Link href="/templates" className="text-sm text-gray-400 hover:text-white transition">Templates</Link>
          {user && <Link href="/projects" className="text-sm text-gray-400 hover:text-white transition">Projects</Link>}
          <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</Link>
        </nav>
        <UserMenu />
      </div>
    </header>
  )
}
