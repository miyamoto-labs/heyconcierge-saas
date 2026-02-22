'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  { id: 'starter', name: 'Starter', emoji: '\u{1F331}', price: '$49', period: '/mo', color: 'text-blue', border: 'border-blue', features: ['5 properties', '500 messages/mo', 'Basic analytics', 'Email support'] },
  { id: 'professional', name: 'Professional', emoji: '\u26A1', price: '$149', period: '/mo', color: 'text-primary', border: 'border-primary', features: ['20 properties', '2,000 messages/mo', 'Advanced analytics', 'Priority support', 'Custom branding'], popular: true },
  { id: 'premium', name: 'Premium', emoji: '\u{1F451}', price: '$299', period: '/mo', color: 'text-accent', border: 'border-accent', features: ['40 properties', 'Unlimited messages', 'API access', 'Dedicated manager', 'White-label'] },
]

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-muted font-semibold">Loading...</div></div>}>
      <SignupPage />
    </Suspense>
  )
}

function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [shouldCompleteSignup, setShouldCompleteSignup] = useState(false)
  const [creatingCheckout, setCreatingCheckout] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    isCompany: false,
    company: '',
    plan: 'professional',
  })

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))

  // Complete signup after Stripe payment — creates organization only
  const completeSignupAfterPayment = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const userEmail = authUser?.email || form.email
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get('session_id')

      // Retrieve Stripe session data (customer ID, subscription ID)
      let stripeData: any = {}
      if (sessionId) {
        try {
          const sessionResponse = await fetch('/api/stripe-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          if (sessionResponse.ok) {
            stripeData = await sessionResponse.json()
            console.log('[Signup] Stripe session data:', stripeData)
          }
        } catch (err) {
          console.error('[Signup] Failed to retrieve Stripe session:', err)
        }
      }

      // Check for existing org
      const { data: foundOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', userEmail || form.email)
        .single()

      if (foundOrg) {
        await supabase
          .from('organizations')
          .update({
            user_id: userId, auth_user_id: userId,
            plan: form.plan,
            stripe_customer_id: stripeData.customerId || foundOrg.stripe_customer_id,
            subscription_status: 'trialing',
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', foundOrg.id)
      } else {
        const { error: orgErr } = await supabase
          .from('organizations')
          .insert({
            name: form.company || form.name,
            email: userEmail || form.email,
            plan: form.plan,
            user_id: userId, auth_user_id: userId,
            stripe_customer_id: stripeData.customerId || null,
            subscription_status: 'trialing',
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single()
        if (orgErr) throw orgErr
      }

      setLoading(false)
      setStep(3)
    } catch (err: any) {
      console.error('Signup completion error:', err)
      const msg = err?.message || err?.error_description || JSON.stringify(err)
      alert(`Failed to complete setup: ${msg}`)
      setLoading(false)
      router.push('/signup?step=1')
    }
  }

  // Auth check + handle Stripe return
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // Pre-fill form with OAuth data
      if (user.email && !form.email) {
        setForm(f => ({ ...f, email: user.email! }))
      }
      const oauthName = user.user_metadata?.full_name || user.user_metadata?.name
      if (oauthName && !form.name) {
        setForm(f => ({ ...f, name: oauthName }))
      }

      // If user already has an org, redirect to dashboard
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)
        .single()

      if (org) {
        // User already completed signup — send them to dashboard
        const sessionId = searchParams?.get('session_id')
        if (!sessionId) {
          router.push('/dashboard')
          return
        }
      }
    }
    checkAuth()

    // Handle return from Stripe
    const sessionId = searchParams?.get('session_id')
    const paramStep = searchParams?.get('step')
    if (sessionId && paramStep === '3') {
      // User returned from successful Stripe payment
      const savedForm = localStorage.getItem('heyconcierge_signup_form')
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm)
          setForm(parsedForm)
          localStorage.removeItem('heyconcierge_signup_form')
        } catch (e) {
          console.error('Failed to restore form data:', e)
        }
      }
      setShouldCompleteSignup(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams])

  // Complete signup after form is restored from localStorage
  useEffect(() => {
    if (shouldCompleteSignup) {
      setShouldCompleteSignup(false)
      completeSignupAfterPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCompleteSignup])

  const canNext = () => {
    if (step === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const phoneRegex = /^\+?[0-9\s\-()]+$/
      const emailValid = form.email && emailRegex.test(form.email)
      const phoneValid = !form.phone || phoneRegex.test(form.phone)
      const nameValid = form.name && form.name.length > 0
      const companyValid = !form.isCompany || (form.company && form.company.length > 0)
      return nameValid && emailValid && phoneValid && companyValid
    }
    if (step === 2) return !!form.plan
    return true
  }

  const handleStripeCheckout = async () => {
    setCreatingCheckout(true)
    try {
      // Save form data to localStorage before redirect
      localStorage.setItem('heyconcierge_signup_form', JSON.stringify(form))

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: form.plan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err instanceof Error ? err.message : 'Failed to start checkout')
      setCreatingCheckout(false)
    }
  }

  const handleNext = () => {
    if (!canNext()) return
    setStep(s => s + 1)
  }

  const steps = ['Account', 'Plan & Pay', 'Success']
  const totalSteps = steps.length

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <span className="text-sm text-muted font-semibold">
            Step {Math.min(step, totalSteps)} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-[800px] mx-auto w-full px-8 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className={`h-2 rounded-full flex-1 transition-all ${i + 1 <= step ? 'bg-primary' : 'bg-[#E8E4FF]'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted font-semibold mb-8">
          {steps.map((s, i) => (
            <span key={i} className={i + 1 <= step ? 'text-primary' : ''}>{s}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[600px] mx-auto w-full px-8 flex-1 pb-12">
        {/* Step 1: Account */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Let&apos;s get started!</h2>
                <p className="text-muted">Tell us about yourself.</p>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-5 py-3">
                <div className="relative w-11 h-11">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={step === totalSteps ? '#55EFC4' : '#6C5CE7'} strokeWidth="3" strokeDasharray={`${(step / totalSteps) * 100}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-dark">{step}/{totalSteps}</span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-dark">Step {step}: Account</p>
                  <p className="text-muted">{steps.slice(step).join(' \u2192 ')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Input
                label="Full Name *"
                value={form.name}
                onChange={v => update('name', v)}
                placeholder="John Smith"
              />
              <Input
                label="Email *"
                value={form.email}
                onChange={v => update('email', v)}
                placeholder="john@example.com"
                type="email"
              />
              {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                <p className="text-xs text-red-500 -mt-2">Please enter a valid email address</p>
              )}
              <Input
                label="Phone (optional)"
                value={form.phone}
                onChange={v => update('phone', v)}
                placeholder="+47 555 123 456"
                type="tel"
              />
              {form.phone && !(/^\+?[0-9\s\-()]+$/.test(form.phone)) && (
                <p className="text-xs text-red-500 -mt-2">Please enter a valid phone number</p>
              )}

              {/* Company or Private toggle */}
              <div>
                <label className="block text-sm font-bold text-dark mb-2">Account Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => update('isCompany', false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      !form.isCompany
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white text-muted border-2 border-[#E8E4FF]'
                    }`}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => update('isCompany', true)}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      form.isCompany
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white text-muted border-2 border-[#E8E4FF]'
                    }`}
                  >
                    Company
                  </button>
                </div>
              </div>

              {form.isCompany && (
                <div className="animate-slide-up">
                  <Input
                    label="Company Name *"
                    value={form.company}
                    onChange={v => update('company', v)}
                    placeholder="Sunshine Rentals AS"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Plan & Pay */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Choose your plan</h2>
                <p className="text-muted">All plans include a 14-day free trial. Payment starts after trial.</p>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-5 py-3">
                <div className="relative w-11 h-11">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={step === totalSteps ? '#55EFC4' : '#6C5CE7'} strokeWidth="3" strokeDasharray={`${(step / totalSteps) * 100}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-dark">{step}/{totalSteps}</span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-dark">Step {step}: Plan & Pay</p>
                  <p className="text-muted">{steps.slice(step).join(' \u2192 ')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {PLANS.map(p => (
                <button
                  key={p.id}
                  onClick={() => update('plan', p.id)}
                  disabled={creatingCheckout}
                  className={`w-full text-left rounded-2xl p-6 border-2 transition-all ${
                    form.plan === p.id
                      ? `${p.border} shadow-card-hover`
                      : 'border-transparent shadow-card'
                  } bg-white hover:-translate-y-0.5 ${creatingCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <span className={`font-nunito font-extrabold text-lg ${p.color}`}>{p.name}</span>
                      {p.popular && <span className="bg-primary text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-nunito font-black text-2xl text-dark">{p.price}<span className="text-sm text-muted font-normal">{p.period}</span></div>
                      {form.plan === p.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.features.map((f, i) => (
                      <span key={i} className="text-xs text-muted bg-[#F5F3FF] px-2.5 py-1 rounded-full">{'\u2713'} {f}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {form.plan && (
              <div className="mt-6 bg-gradient-to-r from-[rgba(108,92,231,0.06)] to-transparent rounded-2xl p-5 border-2 border-[#E8E4FF]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-dark text-sm mb-1">14-day free trial included</p>
                    <p className="text-xs text-muted">You won&apos;t be charged until your trial ends. Cancel anytime.</p>
                  </div>
                </div>
                <button
                  onClick={handleStripeCheckout}
                  disabled={creatingCheckout}
                  className="w-full mt-4 bg-gradient-to-r from-primary to-[#A29BFE] text-white px-8 py-4 rounded-full font-nunito font-extrabold text-base transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingCheckout ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Loading Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-muted mt-3">
                  Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="animate-slide-up text-center">
            <div className="text-6xl mb-4">&#127881;</div>
            <h2 className="font-nunito text-3xl font-black mb-2">Welcome aboard!</h2>
            <p className="text-muted mb-8">Your account is all set. Head to your dashboard to add your first property.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-nunito font-extrabold no-underline transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]"
            >
              Go to Dashboard &#8594;
            </Link>
          </div>
        )}

        {/* Navigation Buttons */}
        {step === 1 && (
          <div className="flex justify-between mt-10">
            <Link href="/" className="text-muted font-bold no-underline hover:text-primary transition-colors">&#8592; Home</Link>
            <button
              onClick={handleNext}
              disabled={!canNext() || loading}
              className={`px-8 py-3 rounded-full font-nunito font-extrabold text-white transition-all ${canNext() ? 'bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]' : 'bg-[#C4BFFF] cursor-not-allowed'}`}
            >
              Next &#8594;
            </button>
          </div>
        )}

        {/* Back button for step 2 (Plan & Pay) */}
        {step === 2 && (
          <div className="flex justify-start mt-10">
            <button onClick={() => setStep(1)} className="text-muted font-bold hover:text-primary transition-colors">
              &#8592; Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-bold text-dark mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium placeholder:text-[#C4BFFF] focus:border-primary focus:outline-none transition-colors"
      />
    </div>
  )
}
