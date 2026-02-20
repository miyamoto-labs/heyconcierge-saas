'use client'

import { useState } from 'react'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: 'google' | 'azure' | 'facebook') => {
    setLoading(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('OAuth error:', error.message)
      setLoading(null)
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

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={!!loading}
            className="w-full bg-white border-2 border-[#E8E4FF] text-dark px-8 py-4 rounded-full font-nunito font-extrabold text-lg hover:border-primary hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
            className="w-full bg-[#1877F2] border-2 border-[#1877F2] text-white px-8 py-4 rounded-full font-nunito font-extrabold text-lg hover:bg-[#0C63D4] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {loading === 'facebook' ? 'Redirecting...' : 'Continue with Facebook'}
          </button>

          <button
            onClick={() => handleOAuthLogin('azure')}
            disabled={!!loading}
            className="w-full bg-white border-2 border-[#E8E4FF] text-dark px-8 py-4 rounded-full font-nunito font-extrabold text-lg hover:border-primary hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#F35325" d="M1 1h10v10H1z"/>
              <path fill="#81BC06" d="M13 1h10v10H13z"/>
              <path fill="#05A6F0" d="M1 13h10v10H1z"/>
              <path fill="#FFBA08" d="M13 13h10v10H13z"/>
            </svg>
            {loading === 'azure' ? 'Redirecting...' : 'Continue with Microsoft'}
          </button>
        </div>

        <p className="text-xs text-muted mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
