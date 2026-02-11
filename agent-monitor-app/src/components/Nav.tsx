'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Nav() {
  const path = usePathname()
  const links = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/docs', label: 'Docs' },
    { href: '/pricing', label: 'Pricing' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-healthy/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-healthy pulse-dot" />
          </div>
          <span className="font-bold text-lg text-white">AgentWatch</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                path === l.href
                  ? 'text-healthy bg-healthy/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-healthy text-black hover:bg-healthy/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
