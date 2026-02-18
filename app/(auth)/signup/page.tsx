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

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+43', country: 'AT', flag: '🇦🇹' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
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

  // Redirect to login if not authenticated, detect existing org
  useEffect(() => {
    const id = getCookie('user_id')
    if (!id) {
      router.push('/login')
      return
    }
    setUserId(id)

    // Check if user already has an org (= existing user adding property)
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
        // Existing user — skip to property step (step 3)
        const paramStep = searchParams?.get('step')
        if (paramStep) {
          // If step=2 from dashboard, go to step 3 (property) since they don't need plan selection
          const targetStep = Math.max(3, parseInt(paramStep, 10))
          setStep(targetStep)
          setIsAddProperty(true)
        }
      }
    }
    checkExistingOrg()
  }, [router, searchParams])

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    countryCode: '+47',
    plan: 'professional',
    propertyName: '', propertyAddress: '', propertyType: 'Apartment',
    propertyImages: [] as string[],
    icalUrl: '',
    wifi: '', checkin: '', localTips: '', houseRules: '',
  })

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const canNext = () => {
    if (step === 1) return form.name && form.email
    if (step === 2) return form.plan
    if (step === 3) return form.propertyName
    if (step === 4) return true
    return true
  }

  const handleNext = async () => {
    if (!canNext()) return
    if (step === 4) {
      setLoading(true)
      try {
        const userEmail = getCookie('user_email')

        // Use existing org if we detected one, otherwise create/find
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
              .update({ user_id: userId })
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
            property_type: form.propertyType,
            images: form.propertyImages,
            ical_url: form.icalUrl || null,
            whatsapp_number: '' // Configured later in settings
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

        // Generate QR code — Telegram deep link with property ID
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

  const allSteps = ['Account', 'Plan', 'Property', 'Config', 'Success']
  const addPropertySteps = ['Property', 'Config', 'Success']
  const steps = isAddProperty ? addPropertySteps : allSteps

  // For progress display, map the current step to the visible step index
  const visibleStep = isAddProperty ? step - 2 : step // step 3→1, step 4→2, step 5→3
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
            {isAddProperty ? `Step ${Math.min(visibleStep, totalSteps)} of ${totalSteps}` : `Step ${Math.min(step, 5)} of 5`}
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
              <div>
                <label className="block text-sm font-bold text-dark mb-2">Phone</label>
                <div className="flex gap-2">
                  <select
                    value={form.countryCode}
                    onChange={e => update('countryCode', e.target.value)}
                    className="w-[140px] px-3 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium focus:border-primary focus:outline-none transition-colors"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    placeholder="555 123 4567"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <Input label="Company Name" value={form.company} onChange={v => update('company', v)} placeholder="Sunshine Rentals" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="font-nunito text-3xl font-black mb-2">Choose your plan ⚡</h2>
            <p className="text-muted mb-8">All plans include a 14-day free trial.</p>
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
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="font-nunito text-3xl font-black mb-2">{isAddProperty ? 'Add a property 🏠' : 'Your property 🏠'}</h2>
            <p className="text-muted mb-8">{isAddProperty ? 'Tell us about your new property.' : 'Add your first property. You can add more later.'}</p>
            <div className="space-y-4">
              <Input label="Property Name *" value={form.propertyName} onChange={v => update('propertyName', v)} placeholder="Aurora Haven Beach Villa" />
              <Input label="Address" value={form.propertyAddress} onChange={v => update('propertyAddress', v)} placeholder="123 Sunset Blvd, Malibu" />
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

        {step === 4 && (
          <div className="animate-slide-up">
            <h2 className="font-nunito text-3xl font-black mb-2">Property config ⚙️</h2>
            <p className="text-muted mb-8">What should HeyConcierge know about your property?</p>
            <div className="space-y-4">
              <div className="bg-[#F5F3FF] border-2 border-[#E8E4FF] rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-dark mb-2">📅 Calendar Sync</p>
                <Input label="iCal URL (Airbnb/Booking.com)" value={form.icalUrl} onChange={v => update('icalUrl', v)} placeholder="https://www.airbnb.com/calendar/ical/..." />
                <p className="text-xs text-muted mt-2">
                  Get this from: Airbnb → Calendar → Export | Booking.com → Extranet → Calendar → Export
                </p>
              </div>
              <Input label="WiFi Password" value={form.wifi} onChange={v => update('wifi', v)} placeholder="MyWiFi_2024" />
              <TextArea label="Check-in Instructions" value={form.checkin} onChange={v => update('checkin', v)} placeholder="The lockbox code is 1234. Enter through the side gate..." />
              <TextArea label="Local Tips" value={form.localTips} onChange={v => update('localTips', v)} placeholder="Best pizza: Mario's on 5th street. Sunset spot: the pier at 7pm..." />
              <TextArea label="House Rules" value={form.houseRules} onChange={v => update('houseRules', v)} placeholder="No smoking indoors. Quiet hours after 10pm..." />
            </div>
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
            {isAddProperty && step === 3 ? (
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
              {loading ? 'Setting up...' : step === 4 ? (isAddProperty ? 'Save Property' : 'Create My Concierge ✨') : 'Next →'}
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

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-sm font-bold text-dark mb-1.5">{label}</label>
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
