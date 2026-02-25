'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  HeadphonesIcon,
  MessageSquare,
  LogOut,
} from 'lucide-react'

interface AdminUser {
  name: string
  email: string
  role: string
}

interface Props {
  user: AdminUser
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/customers', label: 'Customers', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/support', label: 'Support', icon: HeadphonesIcon },
  { href: '/admin/chats', label: 'Chats', icon: MessageSquare },
]

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-900 text-purple-300',
  admin: 'bg-blue-900 text-blue-300',
  support: 'bg-slate-700 text-slate-300',
  finance: 'bg-emerald-900 text-emerald-300',
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">HeyConcierge</p>
            <p className="text-slate-500 text-xs mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-start gap-2.5 mb-3 px-1">
          <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-slate-300 text-xs font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-xs font-medium truncate">{user.name}</p>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
            <span
              className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                roleColors[user.role] || roleColors.support
              }`}
            >
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors text-sm"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
