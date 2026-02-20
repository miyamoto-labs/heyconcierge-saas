'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import AnimatedMascot from '@/components/brand/AnimatedMascot'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const TestConcierge = dynamic(() => import('@/components/features/TestConcierge'), { ssr: false })

const PLANS = [
  { id: 'starter', name: 'Starter', emoji: '🌱', price: '$49', period: '/mo', color: 'text-blue', border: 'border-blue', features: ['5 properties', '500 messages/mo', 'Basic analytics', 'Email support'] },
  { id: 'professional', name: 'Professional', emoji: '⚡', price: '$149', period: '/mo', color: 'text-primary', border: 'border-primary', features: ['20 properties', '2,000 messages/mo', 'Advanced analytics', 'Priority support', 'Custom branding'], popular: true },
  { id: 'premium', name: 'Premium', emoji: '👑', price: '$299', period: '/mo', color: 'text-accent', border: 'border-accent', features: ['40 properties', 'Unlimited messages', 'API access', 'Dedicated manager', 'White-label'] },
]

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Hotel', 'Hostel', 'B&B', 'Cabin', 'Other']

const COUNTRIES = [
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
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
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [existingOrg, setExistingOrg] = useState<any>(null)
  const [isAddProperty, setIsAddProperty] = useState(false)
  const [shouldCompleteSignup, setShouldCompleteSignup] = useState(false)
  
  const [form, setForm] = useState({
    name: '', email: '', phone: '', 
    isCompany: false,
    company: '',
    plan: 'professional',
    propertyName: '', 
    propertyAddress: '', 
    propertyPostalCode: '',
    propertyCity: '',
    propertyCountry: 'NO',
    propertyType: 'Apartment',
    propertyImages: [] as string[],
    icalUrl: '',
    wifi: '', checkin: '', localTips: '', houseRules: '',
    // PDF extraction state
    pdfDragActive: false,
    pdfExtracting: false,
    pdfExtractedFile: null as { name: string; fields: string[] } | null,
    pdfExtractError: null as string | null,
    showManualFields: false,
  })
  
  const [showTestChat, setShowTestChat] = useState(false)
  const [creatingCheckout, setCreatingCheckout] = useState(false)

  // Complete signup after Stripe payment
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

      // Use existing org or create new
      let org: any = existingOrg

      if (!org) {
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
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            })
            .eq('id', foundOrg.id)
          org = foundOrg
        }
      }

      if (!org) {
        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert({ 
            name: form.company || form.name, 
            email: userEmail || form.email, 
            plan: form.plan,
            user_id: userId, auth_user_id: userId,
            stripe_customer_id: stripeData.customerId || null,
            subscription_status: 'trialing',
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          })
          .select()
          .single()
        if (orgErr) throw orgErr
        org = newOrg
      }

      // Create property
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .insert({ 
          org_id: org.id, 
          name: form.propertyName, 
          address: form.propertyAddress,
          postal_code: form.propertyPostalCode,
          city: form.propertyCity,
          country: form.propertyCountry,
          property_type: form.propertyType,
          images: form.propertyImages,
          ical_url: form.icalUrl || null,
          whatsapp_number: ''
        })
        .select()
        .single()

      if (propErr) throw propErr

      // Create config sheet
      await supabase
        .from('property_config_sheets')
        .insert({
          property_id: prop.id,
          wifi_password: form.wifi,
          checkin_instructions: form.checkin,
          local_tips: form.localTips,
          house_rules: form.houseRules,
        })

      // Generate QR code
      const QRCode = (await import('qrcode')).default
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'HeyConciergeBot'
      const qrUrl = `https://t.me/${botUsername}?start=${prop.id}`
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2, color: { dark: '#2D2B55', light: '#FFFFFF' } })
      setQrDataUrl(dataUrl)
      setLoading(false)
      setStep(5)
    } catch (err: any) {
      console.error('Signup completion error:', err)
      const msg = err?.message || err?.error_description || JSON.stringify(err)
      alert(`Failed to complete setup: ${msg}`)
      setLoading(false)
      router.push('/signup?step=1') // Go back to start
    }
  }

  // Redirect to login if not authenticated
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

      // Check if user already has an org
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)
        .single()

      if (org) {
        setExistingOrg(org)
        // Existing user — skip to property step
        const paramStep = searchParams?.get('step')
        if (paramStep) {
          const targetStep = Math.max(2, parseInt(paramStep, 10))
          setStep(targetStep)
          setIsAddProperty(true)
        }
      }
    }
    checkAuth()

    // Handle return from Stripe
    const sessionId = searchParams?.get('session_id')
    const paramStep = searchParams?.get('step')
    if (sessionId && paramStep === '5') {
      // User returned from successful Stripe payment
      // Restore form data from localStorage
      const savedForm = localStorage.getItem('heyconcierge_signup_form')
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm)
          setForm(parsedForm)
          localStorage.removeItem('heyconcierge_signup_form') // Clean up
        } catch (e) {
          console.error('Failed to restore form data:', e)
        }
      }
      
      setIsAddProperty(false) // Make sure we show the correct steps
      setShouldCompleteSignup(true) // Trigger completion after form is restored
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams])

  // Complete signup after returning from Stripe (when form is restored)
  useEffect(() => {
    if (shouldCompleteSignup && form.propertyName) {
      setShouldCompleteSignup(false)
      completeSignupAfterPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCompleteSignup, form.propertyName])

  const update = (field: string, value: string | boolean | any) => setForm(f => ({ ...f, [field]: value }))

  const handlePdfUpload = async (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))

    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only')
      return
    }

    update('pdfExtracting', true)
    update('pdfExtractError', null)
    
    try {
      const formData = new FormData()
      pdfFiles.forEach(file => formData.append('pdfs', file))

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const extracted = await response.json()

      const filledFields: string[] = []
      const updates: Record<string, any> = {}

      if (extracted.wifi_password) { 
        updates.wifi = extracted.wifi_password
        filledFields.push('WiFi') 
      }
      if (extracted.checkin_instructions) { 
        updates.checkin = extracted.checkin_instructions
        filledFields.push('Check-in') 
      }
      if (extracted.local_tips) { 
        updates.localTips = extracted.local_tips
        filledFields.push('Local tips') 
      }
      if (extracted.house_rules) { 
        updates.houseRules = extracted.house_rules
        filledFields.push('House rules') 
      }

      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }))
      }

      const fileName = pdfFiles.length === 1 ? pdfFiles[0].name : `${pdfFiles.length} PDFs`
      update('pdfExtractedFile', { name: fileName, fields: filledFields })
      
      // Auto-expand manual fields so user can see what was filled
      update('showManualFields', true)
    } catch (err) {
      console.error('PDF extraction error:', err)
      update('pdfExtractError', err instanceof Error ? err.message : 'Extraction failed')
    }
    
    update('pdfExtracting', false)
  }

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
    if (step === 2) {
      return form.propertyName && form.propertyCity && form.propertyPostalCode && form.propertyCountry
    }
    if (step === 3) return true
    if (step === 4) return form.plan
    return true
  }

  // Check if guest knowledge has any data for Test Concierge button
  const hasGuestKnowledge = !!(form.wifi || form.checkin || form.localTips || form.houseRules)

  const handleStripeCheckout = async () => {
    setCreatingCheckout(true)
    try {
      // Save form data to localStorage before redirect
      localStorage.setItem('heyconcierge_signup_form', JSON.stringify(form))
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: form.plan,
          email: form.email,
          propertyId: null, // Will be set after property creation
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err instanceof Error ? err.message : 'Failed to start checkout')
      setCreatingCheckout(false)
    }
  }

  const handleNext = async () => {
    if (!canNext()) return
    
    // If on step 4 (payment), finalize onboarding
    if (step === 4) {
      setLoading(true)
      try {
        const { data: { user: authUser2 } } = await supabase.auth.getUser()
        const userEmail = authUser2?.email || form.email

        // Use existing org or create new
        let org: any = existingOrg

        if (!org) {
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
              })
              .eq('id', foundOrg.id)
            org = foundOrg
          }
        }

        if (!org) {
          const { data: newOrg, error: orgErr } = await supabase
            .from('organizations')
            .insert({ 
              name: form.company || form.name, 
              email: userEmail || form.email, 
              plan: form.plan,
              user_id: userId
            })
            .select()
            .single()
          if (orgErr) throw orgErr
          org = newOrg
        }

        // Create property
        const { data: prop, error: propErr } = await supabase
          .from('properties')
          .insert({ 
            org_id: org.id, 
            name: form.propertyName, 
            address: form.propertyAddress,
            postal_code: form.propertyPostalCode,
            city: form.propertyCity,
            country: form.propertyCountry,
            property_type: form.propertyType,
            images: form.propertyImages,
            ical_url: form.icalUrl || null,
            whatsapp_number: ''
          })
          .select()
          .single()

        if (propErr) throw propErr

        // Create config sheet
        await supabase
          .from('property_config_sheets')
          .insert({
            property_id: prop.id,
            wifi_password: form.wifi,
            checkin_instructions: form.checkin,
            local_tips: form.localTips,
            house_rules: form.houseRules,
          })

        // Generate QR code
        const QRCode = (await import('qrcode')).default
        const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'HeyConciergeBot'
        const qrUrl = `https://t.me/${botUsername}?start=${prop.id}`
        const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2, color: { dark: '#2D2B55', light: '#FFFFFF' } })
        setQrDataUrl(dataUrl)
      } catch (err: any) {
        console.error('Signup error:', err)
        const msg = err?.message || err?.error_description || JSON.stringify(err)
        alert(`Signup failed: ${msg}`)
        setLoading(false)
        return
      }
      setLoading(false)
      setStep(5)
    } else {
      setStep(s => s + 1)
    }
  }

  const allSteps = ['Account', 'Property', 'Config', 'Plan & Pay', 'Success']
  const addPropertySteps = ['Property', 'Config', 'Success']
  const steps = isAddProperty ? addPropertySteps : allSteps

  const visibleStep = isAddProperty ? step - 1 : step
  const totalSteps = steps.length

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href={isAddProperty ? "/dashboard" : "/"} className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <span className="text-sm text-muted font-semibold">
            Step {Math.min(visibleStep, totalSteps)} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-[800px] mx-auto w-full px-8 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className={`h-2 rounded-full flex-1 transition-all ${i + 1 <= visibleStep ? 'bg-primary' : 'bg-[#E8E4FF]'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted font-semibold mb-8">
          {steps.map((s, i) => (
            <span key={i} className={i + 1 <= visibleStep ? 'text-primary' : ''}>{s}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[600px] mx-auto w-full px-8 flex-1 pb-12">
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Let&apos;s get started! 👋</h2>
                <p className="text-muted">Tell us about yourself.</p>
              </div>
              {/* Progress circle */}
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
                  <p className="text-muted">{steps.slice(step).join(' → ')}</p>
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
                    👤 Private
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
                    🏢 Company
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

        {step === 2 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">{isAddProperty ? 'Add a property 🏠' : 'Your property 🏠'}</h2>
                <p className="text-muted">{isAddProperty ? 'Tell us about your new property.' : 'Add your first property. You can add more later.'}</p>
              </div>
              {/* Progress circle */}
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-5 py-3">
                <div className="relative w-11 h-11">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={step === totalSteps ? '#55EFC4' : '#6C5CE7'} strokeWidth="3" strokeDasharray={`${(step / totalSteps) * 100}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-dark">{step}/{totalSteps}</span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-dark">Step {step}: Property</p>
                  <p className="text-muted">{steps.slice(step).join(' → ')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Input label="Property Name *" value={form.propertyName} onChange={v => update('propertyName', v)} placeholder="Aurora Haven Beach Villa" />
              <Input label="Street Address" value={form.propertyAddress} onChange={v => update('propertyAddress', v)} placeholder="123 Sunset Blvd" />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Postal Code *" value={form.propertyPostalCode} onChange={v => update('propertyPostalCode', v)} placeholder="0150" />
                <Input label="City/Town *" value={form.propertyCity} onChange={v => update('propertyCity', v)} placeholder="Oslo" />
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Country *</label>
                <select
                  value={form.propertyCountry}
                  onChange={e => update('propertyCountry', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium focus:border-primary focus:outline-none transition-colors"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Property Type</label>
                <select
                  value={form.propertyType}
                  onChange={e => update('propertyType', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium focus:border-primary focus:outline-none transition-colors"
                >
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Property Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    const urls: string[] = []
                    for (const file of files) {
                      const reader = new FileReader()
                      const url = await new Promise<string>((resolve) => {
                        reader.onload = () => resolve(reader.result as string)
                        reader.readAsDataURL(file)
                      })
                      urls.push(url)
                    }
                    setForm(f => ({ ...f, propertyImages: [...f.propertyImages, ...urls] }))
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium focus:border-primary focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-[#5847D9]"
                />
                {form.propertyImages.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {form.propertyImages.map((img, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-[#E8E4FF]">
                        <img src={img} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setForm(f => ({ ...f, propertyImages: f.propertyImages.filter((_, idx) => idx !== i) }))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted mt-2">Upload up to 10 photos of your property</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Guest Knowledge ⚙️</h2>
                <p className="text-muted">What should HeyConcierge know about your property?</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress circle */}
                <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-5 py-3">
                  <div className="relative w-11 h-11">
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={step === totalSteps ? '#55EFC4' : '#6C5CE7'} strokeWidth="3" strokeDasharray={`${(step / totalSteps) * 100}, 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-dark">{step}/{totalSteps}</span>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-dark">Step {step}: Config</p>
                    <p className="text-muted">{steps.slice(step).join(' → ')}</p>
                  </div>
                </div>
                {/* Test Concierge button - only show if at least one field is filled */}
                {hasGuestKnowledge && (
                  <button
                    onClick={() => setShowTestChat(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-[#A29BFE] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-card-hover transition-all group"
                  >
                    <AnimatedMascot mood="happy" size={24} />
                    <span>Test Concierge</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-5">
              {/* Calendar Sync - Always visible */}
              <div className="bg-[#F5F3FF] border-2 border-[#E8E4FF] rounded-xl p-4">
                <p className="text-sm font-bold text-dark mb-2">📅 Calendar Sync (Optional)</p>
                <Input 
                  label="iCal URL" 
                  value={form.icalUrl} 
                  onChange={v => update('icalUrl', v)} 
                  placeholder="https://www.airbnb.com/calendar/ical/..." 
                />
                <p className="text-xs text-muted mt-2">
                  Airbnb → Calendar → Export | Booking.com → Extranet → Calendar → Export
                </p>
              </div>
              {/* PDF Upload Zone */}
              <div
                className={`relative rounded-2xl border-2 border-dashed p-5 transition-all ${
                  form.pdfDragActive ? 'border-primary bg-[rgba(108,92,231,0.05)]'
                  : form.pdfExtractError ? 'border-red-300 bg-red-50'
                  : form.pdfExtractedFile ? 'border-green-300 bg-green-50'
                  : 'border-[rgba(108,92,231,0.2)] hover:border-primary/50 bg-[rgba(108,92,231,0.02)]'
                } ${form.pdfExtracting ? 'opacity-60 pointer-events-none' : ''}`}
                onDragEnter={(e) => { e.preventDefault(); update('pdfDragActive', true); }}
                onDragLeave={(e) => { e.preventDefault(); update('pdfDragActive', false); }}
                onDragOver={(e) => { e.preventDefault(); update('pdfDragActive', true); }}
                onDrop={(e) => {
                  e.preventDefault();
                  update('pdfDragActive', false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handlePdfUpload(Array.from(e.dataTransfer.files));
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handlePdfUpload(Array.from(e.target.files));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={form.pdfExtracting}
                />
                {form.pdfExtracting ? (
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-dark font-bold text-sm">Reading your PDF and filling in the fields below...</span>
                  </div>
                ) : form.pdfExtractError ? (
                  <div className="flex items-center gap-3 py-1">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-red-600">Extraction failed</p>
                      <p className="text-xs text-red-500 truncate">{form.pdfExtractError}</p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); update('pdfExtractedFile', null); update('pdfExtractError', null); }} className="shrink-0 text-red-400 hover:text-red-600 pointer-events-auto z-10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : form.pdfExtractedFile ? (
                  <div className="flex items-center gap-3 py-1">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-700">Extracted from {form.pdfExtractedFile.name}</p>
                      <p className="text-xs text-green-600">
                        {form.pdfExtractedFile.fields.length > 0
                          ? `Filled: ${form.pdfExtractedFile.fields.join(', ')}`
                          : 'No matching info found — try a different PDF or type manually below'}
                      </p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); update('pdfExtractedFile', null); update('pdfExtractError', null); }} className="shrink-0 text-gray-400 hover:text-gray-600 pointer-events-auto z-10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <svg className="w-8 h-8 mx-auto mb-2 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-dark font-bold text-sm">Drop your property guide PDF here</p>
                    <p className="text-xs text-muted mt-0.5">AI will auto-fill WiFi, check-in, tips & rules from one document</p>
                  </div>
                )}
              </div>

              {/* Toggle for manual fields */}
              <button
                type="button"
                onClick={() => update('showManualFields', !form.showManualFields)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-muted hover:text-dark transition-colors"
              >
                <div className="flex-1 h-px bg-[rgba(108,92,231,0.1)]"></div>
                <span className="flex items-center gap-2">
                  {form.showManualFields ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      Hide manual entry
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      Or type manually
                    </>
                  )}
                </span>
                <div className="flex-1 h-px bg-[rgba(108,92,231,0.1)]"></div>
              </button>

              {/* Manual fields (collapsible) */}
              {form.showManualFields && (
                <div className="space-y-4 animate-slide-up">
                  {/* WiFi */}
                  <AIField
                    label="WiFi"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg>}
                    color="primary"
                  >
                    <Input label="WiFi Password" value={form.wifi} onChange={v => update('wifi', v)} placeholder="MyWiFi_2024" />
                  </AIField>

                  {/* Check-in */}
                  <AIField
                    label="Check-in Instructions"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                    color="accent"
                  >
                    <TextArea value={form.checkin} onChange={v => update('checkin', v)} placeholder="Key location, door codes, arrival steps, parking..." />
                  </AIField>

                  {/* Local Tips */}
                  <AIField
                    label="Local Tips & Recommendations"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    color="yellow"
                  >
                    <TextArea value={form.localTips} onChange={v => update('localTips', v)} placeholder="Restaurants, attractions, transport, things to do..." />
                  </AIField>

                  {/* House Rules */}
                  <AIField
                    label="House Rules"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                    color="pink"
                  >
                    <TextArea value={form.houseRules} onChange={v => update('houseRules', v)} placeholder="Quiet hours, smoking policy, checkout, dos & don'ts..." />
                  </AIField>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Choose your plan ⚡</h2>
                <p className="text-muted">All plans include a 14-day free trial. Payment starts after trial.</p>
              </div>
              {/* Progress circle */}
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
                  <p className="text-muted">{steps.slice(step).join(' → ')}</p>
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
                      <span key={i} className="text-xs text-muted bg-[#F5F3FF] px-2.5 py-1 rounded-full">✓ {f}</span>
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
                    <p className="font-bold text-dark text-sm mb-1">✨ 14-day free trial included</p>
                    <p className="text-xs text-muted">You won't be charged until your trial ends. Cancel anytime.</p>
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
                  🔒 Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="animate-slide-up text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-nunito text-3xl font-black mb-2">You&apos;re all set!</h2>
            <p className="text-muted mb-8">Your AI concierge is ready. Place this QR code in your property — guests scan it to open Telegram and start chatting.</p>
            {qrDataUrl && (
              <div className="inline-block bg-white rounded-3xl p-8 shadow-card mb-8">
                <img src={qrDataUrl} alt="QR Code" className="w-[250px] h-[250px] mx-auto" />
                <p className="mt-4 font-nunito font-bold text-dark">{form.propertyName}</p>
                <p className="text-sm text-muted">Scan to chat with HeyConcierge</p>
              </div>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-nunito font-extrabold no-underline transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]">
                Go to Dashboard →
              </Link>
              {qrDataUrl && (
                <a href={qrDataUrl} download={`heyconcierge-qr-${form.propertyName}.png`} className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3 rounded-full font-nunito font-extrabold no-underline transition-all hover:-translate-y-0.5">
                  Download QR Code
                </a>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && step !== 4 && (
          <div className="flex justify-between mt-10">
            {isAddProperty && step === 2 ? (
              <Link href="/dashboard" className="text-muted font-bold no-underline hover:text-primary transition-colors">← Dashboard</Link>
            ) : step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="text-muted font-bold hover:text-primary transition-colors">
                ← Back
              </button>
            ) : (
              <Link href="/" className="text-muted font-bold no-underline hover:text-primary transition-colors">← Home</Link>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext() || loading}
              className={`px-8 py-3 rounded-full font-nunito font-extrabold text-white transition-all ${canNext() ? 'bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]' : 'bg-[#C4BFFF] cursor-not-allowed'}`}
            >
              {loading ? 'Setting up...' : 'Next →'}
            </button>
          </div>
        )}
        
        {/* Back button for step 4 (Plan selection) */}
        {step === 4 && (
          <div className="flex justify-start mt-10">
            <button onClick={() => setStep(s => s - 1)} className="text-muted font-bold hover:text-primary transition-colors">
              ← Back
            </button>
          </div>
        )}
      </div>

      {/* Test Concierge modal */}
      {showTestChat && (
        <TestConcierge
          property={{
            id: 'onboarding-preview',
            name: form.propertyName || 'Your Property',
            address: form.propertyAddress || 'Preview Address',
            property_type: form.propertyType || 'Property',
          }}
          config={{
            wifi_network: 'Preview Network',
            wifi_password: form.wifi || null,
            checkin_instructions: form.checkin || null,
            local_tips: form.localTips || null,
            house_rules: form.houseRules || null,
          }}
          onClose={() => setShowTestChat(false)}
        />
      )}
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

function TextArea({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-bold text-dark mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium placeholder:text-[#C4BFFF] focus:border-primary focus:outline-none transition-colors resize-none"
      />
    </div>
  )
}

// AI Field wrapper — adds a colored left accent + icon to each knowledge field
function AIField({ label, icon, color, children }: {
  label: string
  icon: React.ReactNode
  color: string
  children: React.ReactNode
}) {
  const colorMap: Record<string, string> = {
    primary: 'border-primary/30 bg-primary/5',
    accent: 'border-accent/30 bg-accent-soft/30',
    yellow: 'border-yellow/40 bg-yellow/5',
    pink: 'border-pink/30 bg-pink-soft/30',
  }
  const iconBg: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    yellow: 'bg-yellow/20 text-orange',
    pink: 'bg-pink/10 text-pink',
  }

  return (
    <div className={`rounded-2xl border-l-4 ${colorMap[color] || colorMap.primary} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg[color] || iconBg.primary}`}>
          {icon}
        </div>
        <label className="text-sm font-bold text-dark">{label}</label>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}
