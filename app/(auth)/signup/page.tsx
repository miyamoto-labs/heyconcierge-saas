'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AnimatedMascot from '@/components/brand/AnimatedMascot'
import PhotoUpload from '@/components/PhotoUpload'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import dynamic from 'next/dynamic'

const TestConcierge = dynamic(() => import('@/components/features/TestConcierge'), { ssr: false })

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Hotel', 'Hostel', 'B&B', 'Cabin', 'Other']

const COUNTRIES = [
  { code: 'NO', name: 'Norway', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'SE', name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'DK', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'FI', name: 'Finland', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'ES', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'IT', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
]

const AVAILABLE_TAGS = [
  { id: 'entry', label: 'Entry/Door', emoji: '\u{1F6AA}' },
  { id: 'keybox', label: 'Key Box', emoji: '\u{1F511}' },
  { id: 'checkin', label: 'Check-in', emoji: '\u2705' },
  { id: 'parking', label: 'Parking', emoji: '\u{1F17F}\uFE0F' },
  { id: 'exterior', label: 'Exterior', emoji: '\u{1F3E0}' },
  { id: 'interior', label: 'Interior', emoji: '\u{1F6CB}\uFE0F' },
  { id: 'view', label: 'View', emoji: '\u{1F304}' },
  { id: 'amenity', label: 'Amenities', emoji: '\u{1F3CA}' },
  { id: 'other', label: 'Other', emoji: '\u{1F4CE}' },
]

const TEST_CONFIG = {
  wifi: 'HeyConcierge-Guest / welcome2024',
  checkin: 'The key is in the lockbox by the front door. Code: 1234. Check-in after 15:00.',
  localTips: 'Great coffee at Cafe Latte (5 min walk). Best pizza at Napoli Express. The park behind the building is perfect for a morning walk.',
  houseRules: 'Quiet hours 22:00-07:00. No smoking indoors. Please sort recycling. Check-out by 11:00.',
}

const FALLBACK_PLANS = [
  { code: 'starter', name: 'Starter', price: '$9/property/mo', features: ['AI concierge (Telegram & WhatsApp)', 'Document extraction', 'Calendar sync', 'Basic analytics'] },
  { code: 'professional', name: 'Professional', price: '$19/property/mo', popular: true, features: ['Everything in Starter', 'Priority support', 'Advanced AI features', 'Upselling engine', 'Activity recommendations'] },
  { code: 'premium', name: 'Premium', price: '$25/property/mo', features: ['Everything in Professional', 'Custom branding', 'API access', 'Dedicated account manager', 'Unlimited messages'] },
]

interface PlanDisplay {
  code: string
  name: string
  price: string
  features: string[]
  popular?: boolean
}

// Steps 1-5 shown in progress bar; step 6 (welcome) is outside
const STEPS = ['Account', 'Property', 'Knowledge', 'Test', 'Finish']

export default function SignupPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
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
  const [initializing, setInitializing] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showTestChat, setShowTestChat] = useState(false)
  const [plans, setPlans] = useState<PlanDisplay[]>(FALLBACK_PLANS)
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [creatingCheckout, setCreatingCheckout] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testDataFilled, setTestDataFilled] = useState(false)

  // Account form
  const [account, setAccount] = useState({
    name: '',
    email: '',
    phone: '',
    isCompany: false,
    company: '',
  })

  // Property form (mirrors new property page)
  const [form, setForm] = useState({
    propertyName: '',
    propertyAddress: '',
    propertyPostalCode: '',
    propertyCity: '',
    propertyCountry: 'NO',
    propertyLat: null as number | null,
    propertyLng: null as number | null,
    propertyType: 'Apartment',
    propertyImages: [] as string[],
    icalUrl: '',
    wifi: '',
    checkin: '',
    localTips: '',
    houseRules: '',
    pdfDragActive: false,
    pdfExtracting: false,
    pdfExtractedFile: null as { name: string; fields: string[] } | null,
    pdfExtractError: null as string | null,
    showManualFields: false,
  })

  // Pending uploads
  const [pendingDocFiles, setPendingDocFiles] = useState<File[]>([])
  const [pendingImageCount, setPendingImageCount] = useState(0)
  const [pendingImages, setPendingImages] = useState<{ files: File[]; tags: string[] }[]>([])
  const [pendingImagePreviews, setPendingImagePreviews] = useState<{ url: string; tags: string[] }[]>([])

  const updateAccount = (field: string, value: string | boolean) => setAccount(a => ({ ...a, [field]: value }))
  const update = (field: string, value: string | boolean | any) => setForm(f => ({ ...f, [field]: value }))

  const hasGuestKnowledge = !!(form.wifi || form.checkin || form.localTips || form.houseRules)
  const configIsEmpty = !form.wifi && !form.checkin && !form.localTips && !form.houseRules

  // Generate QR code
  const generateQR = async (propId: string) => {
    try {
      const QRCode = (await import('qrcode')).default
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'HeyConciergeBot'
      const qrUrl = `https://t.me/${botUsername}?start=${propId}`
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2, color: { dark: '#2D2B55', light: '#FFFFFF' } })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error('QR code generation error:', err)
    }
  }

  // Fetch visible plans
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/current')
      if (response.ok) {
        const data = await response.json()
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans.map((p: any) => ({
            code: p.code,
            name: p.name,
            price: p.priceFormatted || p.displayPrice || `$${(p.pricePerProperty / 100).toFixed(0)}/property/mo`,
            features: p.features || [],
            popular: p.popular,
          })))
        }
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    }
  }

  // PDF upload handler
  const handlePdfUpload = async (files: File[]) => {
    const supportedFiles = files.filter(f =>
      f.type === 'application/pdf' || f.name.endsWith('.pdf') ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.name.endsWith('.docx')
    )

    if (supportedFiles.length === 0) {
      alert('Please upload PDF or Word (.docx) files')
      return
    }

    setPendingDocFiles(supportedFiles)
    update('pdfExtracting', true)
    update('pdfExtractError', null)

    try {
      const formData = new FormData()
      supportedFiles.forEach(file => formData.append('files', file))

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const extracted = await response.json()
      const filledFields: string[] = []
      const updates: Record<string, any> = {}

      if (extracted.wifi_password) { updates.wifi = extracted.wifi_password; filledFields.push('WiFi') }
      if (extracted.checkin_instructions) { updates.checkin = extracted.checkin_instructions; filledFields.push('Check-in') }
      if (extracted.local_tips) { updates.localTips = extracted.local_tips; filledFields.push('Local tips') }
      if (extracted.house_rules) { updates.houseRules = extracted.house_rules; filledFields.push('House rules') }

      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }))
      }

      const imgCount = extracted.image_count_skipped || 0
      setPendingImageCount(imgCount)

      const fileName = supportedFiles.length === 1 ? supportedFiles[0].name : `${supportedFiles.length} files`
      const fieldSummary = [...filledFields]
      if (imgCount > 0) fieldSummary.push(`${imgCount} image(s) pending`)
      update('pdfExtractedFile', { name: fileName, fields: fieldSummary })
      update('showManualFields', true)
    } catch (err) {
      console.error('PDF extraction error:', err)
      update('pdfExtractError', err instanceof Error ? err.message : 'Extraction failed')
    }

    update('pdfExtracting', false)
  }

  // Auth check + handle Stripe return
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      if (user.email) setAccount(a => ({ ...a, email: a.email || user.email! }))
      const oauthName = user.user_metadata?.full_name || user.user_metadata?.name
      if (oauthName) setAccount(a => ({ ...a, name: a.name || oauthName }))

      // Handle Stripe return
      const sessionId = searchParams?.get('session_id')
      if (sessionId) {
        await completeAfterPayment(user.id, sessionId)
        setInitializing(false)
        return
      }

      // Check existing org
      const { data: org } = await supabase
        .from('organizations')
        .select('id, subscription_status')
        .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)
        .single()

      if (org) {
        if (org.subscription_status && org.subscription_status !== 'incomplete') {
          router.push('/dashboard')
          return
        }

        setOrgId(org.id)

        const { data: props } = await supabase
          .from('properties')
          .select('id, name')
          .eq('org_id', org.id)
          .limit(1)

        if (props && props.length > 0) {
          setPropertyId(props[0].id)
          setForm(f => ({ ...f, propertyName: props[0].name || f.propertyName }))

          const { data: cfgData } = await supabase
            .from('property_config_sheets')
            .select('wifi_password, checkin_instructions, local_tips, house_rules')
            .eq('property_id', props[0].id)
            .single()

          if (cfgData) {
            setForm(f => ({
              ...f,
              wifi: cfgData.wifi_password || '',
              checkin: cfgData.checkin_instructions || '',
              localTips: cfgData.local_tips || '',
              houseRules: cfgData.house_rules || '',
            }))
          }

          // Has org + property → go to test (step 4) or later
          const savedStep = localStorage.getItem('heyconcierge_signup_step')
          setStep(savedStep ? Math.max(4, parseInt(savedStep)) : 4)
        } else {
          setStep(2) // Has org but no property
        }
      }

      setInitializing(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams])

  // Fetch plans when reaching step 5
  useEffect(() => {
    if (step === 5) fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Complete after Stripe payment → go to welcome (step 6)
  const completeAfterPayment = async (authUserId: string, sessionId: string) => {
    setLoading(true)
    try {
      let stripeData: any = {}
      try {
        const response = await fetch('/api/stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        if (response.ok) stripeData = await response.json()
      } catch (err) {
        console.error('Failed to retrieve Stripe session:', err)
      }

      const savedPropertyId = localStorage.getItem('heyconcierge_signup_property_id')
      const savedPlan = localStorage.getItem('heyconcierge_signup_plan')
      const savedPropertyName = localStorage.getItem('heyconcierge_signup_property_name')

      if (savedPropertyId) setPropertyId(savedPropertyId)
      if (savedPropertyName) setForm(f => ({ ...f, propertyName: savedPropertyName }))

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (org) {
        setOrgId(org.id)
        await supabase
          .from('organizations')
          .update({
            plan: savedPlan || stripeData.plan || 'professional',
            stripe_customer_id: stripeData.customerId || null,
            subscription_status: 'trialing',
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', org.id)
      }

      if (savedPropertyId) await generateQR(savedPropertyId)

      localStorage.removeItem('heyconcierge_signup_property_id')
      localStorage.removeItem('heyconcierge_signup_plan')
      localStorage.removeItem('heyconcierge_signup_property_name')
      localStorage.removeItem('heyconcierge_signup_step')

      setStep(6) // Welcome page
    } catch (err) {
      console.error('Post-payment completion error:', err)
      setError('Failed to complete setup. Please try again.')
    }
    setLoading(false)
  }

  // Step 1: Create organization
  const handleCreateOrg = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      if (existingOrg) {
        setOrgId(existingOrg.id)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .insert({
            name: account.company || account.name,
            email: user?.email || account.email,
            user_id: userId,
            auth_user_id: userId,
          })
          .select()
          .single()
        if (orgErr) throw orgErr
        setOrgId(org.id)
      }
      setStep(2)
    } catch (err: any) {
      setError(err?.message || 'Failed to create account')
    }
    setLoading(false)
  }

  // Step 3: Create property + config + uploads
  const handleCreateProperty = async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .insert({
          org_id: orgId,
          name: form.propertyName,
          address: form.propertyAddress,
          postal_code: form.propertyPostalCode,
          city: form.propertyCity,
          country: form.propertyCountry,
          latitude: form.propertyLat,
          longitude: form.propertyLng,
          property_type: form.propertyType,
          images: form.propertyImages,
          ical_url: form.icalUrl || null,
          whatsapp_number: '',
        })
        .select()
        .single()

      if (propErr) throw propErr

      const { error: configErr } = await supabase
        .from('property_config_sheets')
        .insert({
          property_id: prop.id,
          wifi_password: form.wifi,
          checkin_instructions: form.checkin,
          local_tips: form.localTips,
          house_rules: form.houseRules,
        })

      if (configErr) console.error('Config sheet creation error:', configErr)

      // Extract and store images from uploaded docs
      if (pendingDocFiles.length > 0) {
        try {
          const imgFormData = new FormData()
          pendingDocFiles.forEach(file => imgFormData.append('files', file))
          imgFormData.append('propertyId', prop.id)

          const imgResponse = await fetch('/api/extract-document', {
            method: 'POST',
            body: imgFormData,
          })

          if (imgResponse.ok) {
            const imgResult = await imgResponse.json()
            if (imgResult.extracted_images?.length > 0) {
              console.log(`Saved ${imgResult.extracted_images.length} image(s) from document`)
            }
          }
        } catch (err) {
          console.error('Image extraction after creation failed:', err)
        }
        setPendingDocFiles([])
      }

      // Upload manually added images with tags
      for (const pending of pendingImages) {
        try {
          const imgFormData = new FormData()
          imgFormData.append('propertyId', prop.id)
          imgFormData.append('tags', JSON.stringify(pending.tags))
          pending.files.forEach(file => imgFormData.append('images', file))

          await fetch('/api/upload-image', {
            method: 'POST',
            body: imgFormData,
          })
        } catch (err) {
          console.error('Image upload after creation failed:', err)
        }
      }
      setPendingImages([])
      setPendingImagePreviews([])

      try {
        await fetch('/api/billing/sync-quantity', { method: 'POST' })
      } catch (err) {
        console.error('Failed to sync subscription quantity:', err)
      }

      setPropertyId(prop.id)
      setStep(4)
    } catch (err: any) {
      console.error('Property creation error:', err)
      setError(err?.message || 'Failed to create property')
    }
    setLoading(false)
  }

  // Step 4: Fill test data
  const fillTestData = async () => {
    setForm(f => ({ ...f, ...TEST_CONFIG }))
    setTestDataFilled(true)

    if (propertyId) {
      await supabase
        .from('property_config_sheets')
        .update({
          wifi_password: TEST_CONFIG.wifi,
          checkin_instructions: TEST_CONFIG.checkin,
          local_tips: TEST_CONFIG.localTips,
          house_rules: TEST_CONFIG.houseRules,
        })
        .eq('property_id', propertyId)
    }
  }

  // Step 5: Stripe checkout
  const handleStripeCheckout = async () => {
    setCreatingCheckout(true)
    setError(null)
    try {
      localStorage.setItem('heyconcierge_signup_property_id', propertyId || '')
      localStorage.setItem('heyconcierge_signup_plan', selectedPlan)
      localStorage.setItem('heyconcierge_signup_property_name', form.propertyName)
      localStorage.setItem('heyconcierge_signup_step', '6')

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned from Stripe')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setCreatingCheckout(false)
    }
  }

  // Validation
  const canNextStep1 = () => {
    const emailValid = account.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)
    const nameValid = account.name.length > 0
    const companyValid = !account.isCompany || account.company.length > 0
    return nameValid && emailValid && companyValid
  }

  const canNextStep2 = () => {
    return !!(form.propertyName && form.propertyCity && form.propertyPostalCode && form.propertyCountry)
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Step 6: Welcome page (outside progress bar)
  if (step === 6) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex flex-col">
        <header className="px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-[12px] sticky top-0 z-30">
          <div className="max-w-[800px] mx-auto flex items-center justify-center">
            <Link href="/dashboard" className="text-xl font-extrabold text-slate-800 tracking-tight no-underline flex items-center gap-2">
              <img src="/message_logo.png" alt="HeyConcierge" className="w-8 h-8 rounded-lg" />
              <span className="text-slate-800">Hey<span className="text-primary">Concierge</span></span>
            </Link>
          </div>
        </header>

        <div className="max-w-[600px] mx-auto w-full px-8 flex-1 pb-12 pt-12">
          <div className="animate-slide-up text-center">
            <div className="text-6xl mb-4">&#127881;</div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Welcome aboard!</h2>
            <p className="text-slate-500 mb-2">Your 30-day free trial has started.</p>
            <p className="text-slate-500 mb-8">Place this QR code in your property &mdash; guests scan it to open Telegram and start chatting with your AI concierge.</p>

            {qrDataUrl && (
              <div className="inline-block bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
                <img src={qrDataUrl} alt="QR Code" className="w-[250px] h-[250px] mx-auto" />
                <p className="mt-4 font-bold text-slate-800">{form.propertyName}</p>
                <p className="text-sm text-slate-500">Scan to chat with HeyConcierge</p>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-semibold no-underline transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]">
                Go to Dashboard &#8594;
              </Link>
              {qrDataUrl && (
                <a href={qrDataUrl} download={`heyconcierge-qr-${form.propertyName}.png`} className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-800 px-8 py-3 rounded-full font-semibold no-underline transition-all hover:-translate-y-0.5">
                  Download QR Code
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA] flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-slate-800 tracking-tight no-underline flex items-center gap-2">
            <img src="/message_logo.png" alt="HeyConcierge" className="w-8 h-8 rounded-lg" />
            <span className="text-slate-800">Hey<span className="text-primary">Concierge</span></span>
          </Link>
          <span className="text-sm text-slate-500 font-semibold">
            Step {step} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-[800px] mx-auto w-full px-8 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1">
              <div className={`h-2 rounded-full transition-all ${i + 1 <= step ? 'bg-primary' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-semibold mb-8">
          {STEPS.map((s, i) => (
            <span key={i} className={i + 1 <= step ? 'text-primary' : ''}>{s}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[600px] mx-auto w-full px-8 flex-1 pb-12">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ─── Step 1: Account ─── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <StepHeader step={1} totalSteps={STEPS.length} title="Let's get started!" subtitle="Tell us about yourself." stepLabel="Account" remaining={STEPS.slice(1)} />
            <div className="space-y-4">
              <Input label="Full Name *" value={account.name} onChange={v => updateAccount('name', v)} placeholder="John Smith" />
              <Input label="Email *" value={account.email} onChange={v => updateAccount('email', v)} placeholder="john@example.com" type="email" />
              {account.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email) && (
                <p className="text-xs text-red-500 -mt-2">Please enter a valid email address</p>
              )}
              <Input label="Phone (optional)" value={account.phone} onChange={v => updateAccount('phone', v)} placeholder="+47 555 123 456" type="tel" />

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Account Type</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => updateAccount('isCompany', false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${!account.isCompany ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border-2 border-slate-200'}`}>
                    Private
                  </button>
                  <button type="button" onClick={() => updateAccount('isCompany', true)}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${account.isCompany ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border-2 border-slate-200'}`}>
                    Company
                  </button>
                </div>
              </div>

              {account.isCompany && (
                <div className="animate-slide-up">
                  <Input label="Company Name *" value={account.company} onChange={v => updateAccount('company', v)} placeholder="Sunshine Rentals AS" />
                </div>
              )}
            </div>

            <div className="flex justify-between mt-10">
              <Link href="/" className="text-slate-500 font-bold no-underline hover:text-primary transition-colors">&#8592; Home</Link>
              <button
                onClick={handleCreateOrg}
                disabled={!canNextStep1() || loading}
                className={`px-8 py-3 rounded-full font-semibold text-white transition-all ${canNextStep1() ? 'bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                {loading ? 'Setting up...' : 'Next \u2192'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Property Details ─── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <StepHeader step={2} totalSteps={STEPS.length} title="Add a property" subtitle="Tell us about your property." stepLabel="Property" remaining={STEPS.slice(2)} />
            <div className="space-y-4">
              <Input label="Property Name *" value={form.propertyName} onChange={v => update('propertyName', v)} placeholder="Aurora Haven Beach Villa" />
              <AddressAutocomplete
                value={form.propertyAddress}
                onChange={v => update('propertyAddress', v)}
                onAddressSelect={(result) => {
                  setForm(f => ({
                    ...f,
                    propertyAddress: result.address,
                    propertyPostalCode: result.postalCode || f.propertyPostalCode,
                    propertyCity: result.city || f.propertyCity,
                    propertyCountry: result.country || f.propertyCountry,
                    propertyLat: result.lat,
                    propertyLng: result.lng,
                  }))
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Postal Code *" value={form.propertyPostalCode} onChange={v => update('propertyPostalCode', v)} placeholder="0150" />
                <Input label="City/Town *" value={form.propertyCity} onChange={v => update('propertyCity', v)} placeholder="Oslo" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Country *</label>
                <select value={form.propertyCountry} onChange={e => update('propertyCountry', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium focus:border-primary focus:outline-none transition-colors">
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Property Type</label>
                <select value={form.propertyType} onChange={e => update('propertyType', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium focus:border-primary focus:outline-none transition-colors">
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Property Photos (Optional)</label>
                <PhotoUpload
                  onPhotosUploaded={(urls) => update('propertyImages', urls)}
                  existingPhotos={form.propertyImages}
                  maxPhotos={10}
                />
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-primary transition-colors">&#8592; Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!canNextStep2()}
                className={`px-8 py-3 rounded-full font-semibold text-white transition-all ${canNextStep2() ? 'bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                Next &#8594;
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Knowledge (Guest Config) ─── */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Guest Knowledge</h2>
                <p className="text-slate-500">What should HeyConcierge know about your property?</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3 shrink-0">
                  <div className="relative w-11 h-11">
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6C5CE7" strokeWidth="3" strokeDasharray={`${(3 / STEPS.length) * 100}, 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">3/{STEPS.length}</span>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Step 3: Knowledge</p>
                    <p className="text-slate-500">{STEPS.slice(3).join(' \u2192 ')}</p>
                  </div>
                </div>
                {hasGuestKnowledge && (
                  <button
                    onClick={() => setShowTestChat(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-[#A29BFE] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:border-primary shadow-md transition-all group"
                  >
                    <AnimatedMascot mood="happy" size={24} />
                    <span>Test Concierge</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-5">
              {/* Calendar Sync */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-800 mb-2">Calendar Sync (Optional)</p>
                <Input
                  label="iCal URL"
                  value={form.icalUrl}
                  onChange={v => update('icalUrl', v)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Airbnb: Calendar &gt; Export | Booking.com: Extranet &gt; Calendar &gt; Export
                </p>
              </div>

              {/* PDF Upload Zone */}
              <div
                className={`relative rounded-2xl border-2 border-dashed p-5 transition-all ${
                  form.pdfDragActive ? 'border-primary bg-primary/[0.04]'
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
                  accept=".pdf,.docx"
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
                    <span className="text-slate-800 font-bold text-sm">Reading your document and filling in the fields below...</span>
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
                          : 'No matching info found \u2014 try a different PDF or type manually below'}
                      </p>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); update('pdfExtractedFile', null); update('pdfExtractError', null); }} className="shrink-0 text-gray-400 hover:text-gray-600 pointer-events-auto z-10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <svg className="w-8 h-8 mx-auto mb-2 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-slate-800 font-bold text-sm">Drop your property guide here (PDF or Word)</p>
                    <p className="text-xs text-slate-500 mt-0.5">AI will auto-fill fields and extract images with smart tagging</p>
                  </div>
                )}
              </div>

              {/* Toggle for manual fields */}
              <button
                type="button"
                onClick={() => update('showManualFields', !form.showManualFields)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <div className="flex-1 h-px bg-primary/[0.08]"></div>
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
                <div className="flex-1 h-px bg-primary/[0.08]"></div>
              </button>

              {/* Manual fields (collapsible) */}
              {form.showManualFields && (
                <div className="space-y-4 animate-slide-up">
                  <AIField label="WiFi" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg>} color="primary">
                    <Input label="WiFi Password" value={form.wifi} onChange={v => update('wifi', v)} placeholder="MyWiFi_2024" />
                  </AIField>

                  <AIField label="Check-in Instructions" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>} color="accent">
                    <TextArea value={form.checkin} onChange={v => update('checkin', v)} placeholder="Key location, door codes, arrival steps, parking..." />
                  </AIField>

                  <AIField label="Local Tips & Recommendations" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} color="yellow">
                    <TextArea value={form.localTips} onChange={v => update('localTips', v)} placeholder="Restaurants, attractions, transport, things to do..." />
                  </AIField>

                  <AIField label="House Rules" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} color="pink">
                    <TextArea value={form.houseRules} onChange={v => update('houseRules', v)} placeholder="Quiet hours, smoking policy, checkout, dos & don'ts..." />
                  </AIField>
                </div>
              )}

              {/* Property Images */}
              <div className="bg-[#FFF5F5] border-2 border-[#FFE4E4] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-pink/10 text-pink">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Property Images (Optional)</p>
                    <p className="text-xs text-slate-500">Photos sent to guests when they ask about check-in, parking, etc.</p>
                  </div>
                </div>
                <PendingImageUpload
                  pendingImages={pendingImagePreviews}
                  onAdd={(files, tags) => {
                    setPendingImages(prev => [...prev, { files, tags }])
                    const newPreviews = files.map(f => ({
                      url: URL.createObjectURL(f),
                      tags,
                    }))
                    setPendingImagePreviews(prev => [...prev, ...newPreviews])
                  }}
                  onRemove={(idx) => {
                    setPendingImages(prev => prev.filter((_, i) => i !== idx))
                    setPendingImagePreviews(prev => {
                      URL.revokeObjectURL(prev[idx].url)
                      return prev.filter((_, i) => i !== idx)
                    })
                  }}
                />
                {pendingImageCount > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-bold">
                    + {pendingImageCount} image(s) from uploaded document will be auto-tagged and saved
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-10">
              <button onClick={() => setStep(2)} className="text-slate-500 font-bold hover:text-primary transition-colors">&#8592; Back</button>
              <button
                onClick={handleCreateProperty}
                disabled={loading}
                className="px-8 py-3 rounded-full font-semibold text-white bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)] transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Test Concierge ─── */}
        {step === 4 && (
          <div className="animate-slide-up">
            <StepHeader step={4} totalSteps={STEPS.length} title="Test your concierge" subtitle="See how your AI concierge responds to guest questions." stepLabel="Test" remaining={STEPS.slice(4)} />

            {configIsEmpty && !testDataFilled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-amber-800 mb-1">Your property info is empty</p>
                <p className="text-xs text-amber-700 mb-3">Want to fill in some sample data so you can see a more realistic demo?</p>
                <button
                  onClick={fillTestData}
                  className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:-translate-y-0.5 transition-all"
                >
                  Fill with sample data
                </button>
              </div>
            )}

            {testDataFilled && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-green-800">Sample data loaded! Try asking about WiFi, check-in, or local tips.</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-2">Chat with your AI concierge</h3>
              <p className="text-sm text-slate-500 mb-6">Ask anything a guest would ask &mdash; WiFi password, check-in steps, restaurant tips, house rules.</p>
              <button
                onClick={() => setShowTestChat(true)}
                className="bg-gradient-to-r from-primary to-[#A29BFE] text-white px-8 py-4 rounded-full font-semibold text-lg hover:-translate-y-0.5 transition-all shadow-[0_4px_15px_rgba(108,92,231,0.3)]"
              >
                Open Test Chat
              </button>
            </div>

            <div className="flex justify-between mt-10">
              <button onClick={() => setStep(3)} className="text-slate-500 font-bold hover:text-primary transition-colors">&#8592; Back</button>
              <button
                onClick={() => setStep(5)}
                className="px-8 py-3 rounded-full font-semibold text-white bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)] transition-all"
              >
                Next &#8594;
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 5: Finish (Plan + Checkout) ─── */}
        {step === 5 && (
          <div className="animate-slide-up">
            <StepHeader step={5} totalSteps={STEPS.length} title="Choose your plan" subtitle="All plans include a 30-day free trial. Cancel anytime." stepLabel="Finish" remaining={[]} />

            <div className="space-y-4">
              {plans.map(p => (
                <button
                  key={p.code}
                  onClick={() => setSelectedPlan(p.code)}
                  disabled={creatingCheckout}
                  className={`w-full text-left rounded-2xl p-6 border-2 transition-all bg-white hover:-translate-y-0.5 ${
                    selectedPlan === p.code
                      ? 'border-primary shadow-md'
                      : 'border-slate-200 shadow-sm'
                  } ${creatingCheckout ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg text-slate-800">{p.name}</span>
                      {p.popular && <span className="bg-primary text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-800 text-xl">{p.price}</div>
                      {selectedPlan === p.code && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.features.map((f, i) => (
                      <span key={i} className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">{'\u2713'} {f}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {selectedPlan && (
              <div className="mt-6 bg-gradient-to-r from-[rgba(108,92,231,0.06)] to-transparent rounded-2xl p-5 border-2 border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm mb-1">30-day free trial included</p>
                    <p className="text-xs text-slate-500">You won&apos;t be charged until your trial ends. Cancel anytime.</p>
                  </div>
                </div>
                <button
                  onClick={handleStripeCheckout}
                  disabled={creatingCheckout}
                  className="w-full mt-4 bg-gradient-to-r from-primary to-[#A29BFE] text-white px-8 py-4 rounded-full font-semibold text-base transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingCheckout ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Loading Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Free Trial</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-slate-500 mt-3">Secure payment powered by Stripe</p>
              </div>
            )}

            <div className="flex justify-start mt-10">
              <button onClick={() => setStep(4)} className="text-slate-500 font-bold hover:text-primary transition-colors">&#8592; Back</button>
            </div>
          </div>
        )}
      </div>

      {/* Test Concierge modal */}
      {showTestChat && (
        <TestConcierge
          property={{
            id: propertyId || 'onboarding-preview',
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

// ─── Helper Components ───

function StepHeader({ step, totalSteps, title, subtitle, stepLabel, remaining }: {
  step: number; totalSteps: number; title: string; subtitle: string; stepLabel: string; remaining: string[]
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">{title}</h2>
        <p className="text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3 shrink-0 ml-4">
        <div className="relative w-11 h-11">
          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={step === totalSteps ? '#55EFC4' : '#6C5CE7'} strokeWidth="3" strokeDasharray={`${(step / totalSteps) * 100}, 100`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">{step}/{totalSteps}</span>
        </div>
        <div className="text-xs">
          <p className="font-bold text-slate-800">Step {step}: {stepLabel}</p>
          {remaining.length > 0 && <p className="text-slate-500">{remaining.join(' \u2192 ')}</p>}
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium placeholder:text-slate-300 focus:border-primary focus:outline-none transition-colors" />
    </div>
  )
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium placeholder:text-slate-300 focus:border-primary focus:outline-none transition-colors resize-none" />
  )
}

function AIField({ label, icon, color, children }: {
  label: string; icon: React.ReactNode; color: string; children: React.ReactNode
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
        <label className="text-sm font-bold text-slate-800">{label}</label>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function PendingImageUpload({ pendingImages, onAdd, onRemove }: {
  pendingImages: { url: string; tags: string[] }[]
  onAdd: (files: File[], tags: string[]) => void
  onRemove: (index: number) => void
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleAdd = () => {
    if (selectedFiles.length === 0 || selectedTags.length === 0) return
    onAdd(selectedFiles, selectedTags)
    setSelectedFiles([])
    setSelectedTags([])
  }

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-dashed border-[rgba(108,92,231,0.15)] hover:border-primary rounded-xl p-4 text-center transition-all">
        <input type="file" accept="image/*" multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setSelectedFiles(Array.from(e.target.files).filter(f => f.type.startsWith('image/')))
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <p className="text-slate-800 font-bold text-sm">Drop images here or click to browse</p>
        <p className="text-xs text-slate-500">PNG, JPG up to 10MB each</p>
      </div>

      {selectedFiles.length > 0 && (
        <>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm font-bold mb-1">Selected: {selectedFiles.length} file(s)</p>
            {selectedFiles.map((file, i) => (
              <p key={i} className="text-xs text-slate-500 truncate">{'\u2022'} {file.name}</p>
            ))}
          </div>

          <div>
            <p className="text-sm font-bold mb-2">Select tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => (
                <button key={tag.id} type="button"
                  onClick={() => setSelectedTags(prev =>
                    prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                  )}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                    selectedTags.includes(tag.id) ? 'bg-primary text-white' : 'bg-primary/[0.08] text-slate-800 hover:bg-primary/[0.14]'
                  }`}>
                  {tag.emoji} {tag.label}
                </button>
              ))}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <button type="button" onClick={handleAdd}
              className="w-full bg-primary text-white px-4 py-2.5 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all">
              Add {selectedFiles.length} Image(s)
            </button>
          )}
        </>
      )}

      {pendingImages.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2">Pending ({pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''}):</p>
          <div className="grid grid-cols-3 gap-2">
            {pendingImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.url} alt={`Pending ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {img.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-primary/[0.08] px-1 py-0.5 rounded-full">
                      {AVAILABLE_TAGS.find(t => t.id === tag)?.emoji} {tag}
                    </span>
                  ))}
                </div>
                <button type="button" onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                  {'\u2715'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
