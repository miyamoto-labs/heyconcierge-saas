'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function MfaSetupPage() {
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/admin/auth/mfa-setup')
      .then((r) => r.json())
      .then((data) => {
        setQrCode(data.qrCode)
        setSecret(data.secret)
      })
      .catch(() => setError('Failed to load QR code'))
      .finally(() => setFetching(false))
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/mfa-setup', {
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
          <h1 className="text-white text-xl font-semibold mb-1">Set up two-factor auth</h1>
          <p className="text-slate-400 text-sm mb-6">
            Scan the QR code with Google Authenticator or Authy.
          </p>

          {fetching ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
            </div>
          ) : qrCode ? (
            <>
              <div className="bg-white rounded-xl p-3 flex justify-center mb-4">
                <Image src={qrCode} alt="TOTP QR Code" width={180} height={180} />
              </div>

              {secret && (
                <div className="mb-6">
                  <p className="text-slate-500 text-xs mb-1 text-center">
                    Or enter this code manually:
                  </p>
                  <p className="text-slate-300 text-xs font-mono text-center bg-slate-800 rounded-lg px-3 py-2 break-all">
                    {secret}
                  </p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">
                    Verification code
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
                  {loading ? 'Verifying…' : 'Verify & continue'}
                </button>
              </form>
            </>
          ) : (
            <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-3 py-2.5">
              {error || 'Failed to generate QR code'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
