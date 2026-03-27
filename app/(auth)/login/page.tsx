'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: 'google' | 'azure' | 'facebook') => {
    setLoading(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'azure' ? 'openid profile email User.Read' : undefined,
      },
    })
    if (error) {
      console.error('OAuth error:', error.message)
      setError(error.message)
      setLoading(null)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading('email')
    setError(null)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
        setLoading(null)
        return
      }
      // Auto sign in after signup (works when email confirmation is disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(null)
        return
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(null)
        return
      }
    }

    router.push('/auth/callback')
  }

  return (
    <div className="earth-page min-h-screen flex items-center justify-center px-4" style={{ background: '#FAFAF7' }}>
      <div className="bg-white rounded-xl border border-earth-border p-10 max-w-[460px] w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-grove rounded-xl flex items-center justify-center"><svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" /><path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" /><rect x="5" y="17" width="22" height="4" rx="1.5" /></svg></div>
        </div>
        <h1 className="font-serif text-3xl text-earth-dark mb-2">HeyConcierge</h1>
        <p className="text-earth-muted mb-8 text-sm">Sign in to manage your properties</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3 mb-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-earth-border rounded-lg px-4 py-3 text-earth-dark focus:border-grove focus:outline-none transition-colors text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-earth-border rounded-lg px-4 py-3 text-earth-dark focus:border-grove focus:outline-none transition-colors text-sm"
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={!!loading}
            className="w-full bg-grove hover:bg-grove-dark text-white px-8 py-3 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {loading === 'email' ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
          <p className="text-sm text-earth-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
              className="text-grove font-medium hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-earth-border" /></div>
          <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-earth-light">or continue with</span></div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={!!loading}
            className="w-full bg-white border border-earth-border text-earth-text px-8 py-3 rounded-lg font-medium text-sm hover:border-grove hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading === 'google' ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <button
            onClick={() => handleOAuthLogin('facebook')}
            disabled={!!loading}
            className="w-full bg-[#1877F2] border-2 border-[#1877F2] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#0C63D4] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {loading === 'facebook' ? 'Redirecting...' : 'Continue with Facebook'}
          </button>

          <button
            onClick={() => handleOAuthLogin('azure')}
            disabled={!!loading}
            className="w-full bg-white border border-earth-border text-earth-text px-8 py-3 rounded-lg font-medium text-sm hover:border-grove hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#F35325" d="M1 1h10v10H1z"/>
              <path fill="#81BC06" d="M13 1h10v10H13z"/>
              <path fill="#05A6F0" d="M1 13h10v10H1z"/>
              <path fill="#FFBA08" d="M13 13h10v10H13z"/>
            </svg>
            {loading === 'azure' ? 'Redirecting...' : 'Continue with Microsoft'}
          </button>
        </div>

        <p className="text-xs text-earth-light mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
