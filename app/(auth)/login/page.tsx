'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  const router = useRouter()
  const [devEmail, setDevEmail] = useState('')
  const [devLoading, setDevLoading] = useState(false)

  const handleDevLogin = async () => {
    if (!devEmail) return
    setDevLoading(true)
    const res = await fetch('/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: devEmail }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      alert('Dev login failed')
      setDevLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-card p-12 max-w-[500px] w-full text-center">
        <div className="flex justify-center mb-6">
          <LogoSVG className="w-16 h-16" />
        </div>
        <h1 className="font-nunito text-4xl font-black mb-2">
          <span className="text-accent">Hey</span>
          <span className="text-dark">Concierge</span>
        </h1>
        <p className="text-muted mb-8">Sign in to manage your properties</p>

        <Link
          href="/api/auth/google"
          className="w-full bg-white border-2 border-[#E8E4FF] text-dark px-8 py-4 rounded-full font-nunito font-extrabold text-lg hover:border-primary hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 no-underline"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Link>

        {IS_DEV && (
          <div className="mt-8 pt-6 border-t border-[#E8E4FF]">
            <p className="text-xs text-muted mb-3 font-bold uppercase tracking-wide">🛠 Dev Login</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={devEmail}
                onChange={e => setDevEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDevLogin()}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#E8E4FF] text-dark text-sm font-medium focus:border-primary focus:outline-none transition-colors"
              />
              <button
                onClick={handleDevLogin}
                disabled={devLoading || !devEmail}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:-translate-y-0.5 transition-all"
              >
                {devLoading ? '...' : 'Go'}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
