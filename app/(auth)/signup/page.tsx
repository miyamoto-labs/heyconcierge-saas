'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { supabase } from '@/lib/supabase'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

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
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [existingOrg, setExistingOrg] = useState<any>(null)
  const [isAddProperty, setIsAddProperty] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    const id = getCookie('user_id')
    if (!id) {
      router.push('/login')
      return
    }
    setUserId(id)

    // Check if user already has an org
    const checkExistingOrg = async () => {
      const userEmail = getCookie('user_email')
      if (!userEmail) return

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', userEmail)
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
    checkExistingOrg()
  }, [router, searchParams])

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
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
    if (step === 1) return form.name && form.email
    if (step === 2) return form.propertyName && form.propertyCity && form.propertyCountry
    if (step === 3) return true
    if (step === 4) return form.plan
    return true
  }

  const handleNext = async () => {
    if (!canNext()) return
    
    // If on step 4 (payment), finalize onboarding
    if (step === 4) {
      setLoading(true)
      try {
        const userEmail = getCookie('user_email')

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
                user_id: userId,
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
            <h2 className="font-nunito text-3xl font-black mb-2">Let&apos;s get started! 👋</h2>
            <p className="text-muted mb-8">Tell us about yourself.</p>
            <div className="space-y-4">
              <Input label="Full Name *" value={form.name} onChange={v => update('name', v)} placeholder="John Smith" />
              <Input label="Email *" value={form.email} onChange={v => update('email', v)} placeholder="john@example.com" type="email" />
              <Input label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="+47 555 123 456" />
              <Input label="Company Name" value={form.company} onChange={v => update('company', v)} placeholder="Sunshine Rentals" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="font-nunito text-3xl font-black mb-2">{isAddProperty ? 'Add a property 🏠' : 'Your property 🏠'}</h2>
            <p className="text-muted mb-8">{isAddProperty ? 'Tell us about your new property.' : 'Add your first property. You can add more later.'}</p>
            <div className="space-y-4">
              <Input label="Property Name *" value={form.propertyName} onChange={v => update('propertyName', v)} placeholder="Aurora Haven Beach Villa" />
              <Input label="Street Address" value={form.propertyAddress} onChange={v => update('propertyAddress', v)} placeholder="123 Sunset Blvd" />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Postal Code" value={form.propertyPostalCode} onChange={v => update('propertyPostalCode', v)} placeholder="0150" />
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
            <h2 className="font-nunito text-3xl font-black mb-2">Property config ⚙️</h2>
            <p className="text-muted mb-8">What should HeyConcierge know about your property?</p>
            <div className="space-y-5">
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
                  {/* Calendar Sync */}
                  <div className="bg-[#F5F3FF] border-2 border-[#E8E4FF] rounded-xl p-4">
                    <p className="text-sm font-bold text-dark mb-2">📅 Calendar Sync (Optional)</p>
                    <Input label="iCal URL" value={form.icalUrl} onChange={v => update('icalUrl', v)} placeholder="https://www.airbnb.com/calendar/ical/..." />
                    <p className="text-xs text-muted mt-2">
                      Airbnb → Calendar → Export | Booking.com → Extranet → Calendar → Export
                    </p>
                  </div>

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
            <h2 className="font-nunito text-3xl font-black mb-2">Choose your plan ⚡</h2>
            <p className="text-muted mb-8">All plans include a 14-day free trial. Payment starts after trial.</p>
            <div className="space-y-4">
              {PLANS.map(p => (
                <button
                  key={p.id}
                  onClick={() => update('plan', p.id)}
                  className={`w-full text-left rounded-2xl p-6 border-2 transition-all ${form.plan === p.id ? `${p.border} shadow-card-hover` : 'border-transparent shadow-card'} bg-white hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <span className={`font-nunito font-extrabold text-lg ${p.color}`}>{p.name}</span>
                      {p.popular && <span className="bg-primary text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                    </div>
                    <div className="font-nunito font-black text-2xl text-dark">{p.price}<span className="text-sm text-muted font-normal">{p.period}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.features.map((f, i) => (
                      <span key={i} className="text-xs text-muted bg-[#F5F3FF] px-2.5 py-1 rounded-full">✓ {f}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted mt-6">
              💳 Payment details will be collected after you complete setup. No charge during trial.
            </p>
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
        {step < 5 && (
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
              {loading ? 'Setting up...' : step === 4 ? (isAddProperty ? 'Save Property' : 'Complete Setup ✨') : 'Next →'}
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
