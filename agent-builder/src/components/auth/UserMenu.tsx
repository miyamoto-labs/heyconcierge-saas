'use client'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import Link from 'next/link'
import { LogOut, User, FolderOpen, CreditCard } from 'lucide-react'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return (
    <Link href="/builder" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#8b5cf6' }}>
      Start Building →
    </Link>
  )

  const avatar = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
        {avatar ? <img src={avatar} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">{name[0].toUpperCase()}</div>}
        <span className="text-sm text-gray-300 hidden sm:block">{name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-gray-900 shadow-2xl py-2 z-50">
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">Free Plan</span>
          </div>
          <Link href="/projects" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"><FolderOpen className="w-4 h-4" /> My Projects</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"><CreditCard className="w-4 h-4" /> Upgrade Plan</Link>
          <button onClick={() => { signOut(); setOpen(false) }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      )}
    </div>
  )
}
