'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MfaPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      router.push('/admin')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">H</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              HeyConcierge
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Admin Portal</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-white text-xl font-semibold mb-1">Two-factor authentication</h1>
          <p className="text-slate-400 text-sm mb-6">
            Enter the 6-digit code from your authenticator app.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Authentication code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm text-center tracking-[0.5em] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-white text-slate-900 font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>

          <p className="mt-4 text-center">
            <a
              href="/admin/login"
              className="text-slate-500 text-xs hover:text-slate-300 transition"
            >
              ← Back to login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
