'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import AnimatedMascot from '@/components/brand/AnimatedMascot'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import PhotoUpload from '@/components/PhotoUpload'

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

export default function NewPropertyPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-muted font-semibold">Loading...</div></div>}>
      <NewPropertyPage />
    </Suspense>
  )
}

function NewPropertyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)
  const [showTestChat, setShowTestChat] = useState(false)

  // Store uploaded doc files so images can be extracted after property creation
  const [pendingDocFiles, setPendingDocFiles] = useState<File[]>([])
  const [pendingImageCount, setPendingImageCount] = useState(0)
  // Store manually uploaded images + tags for upload after property creation
  const [pendingImages, setPendingImages] = useState<{ files: File[]; tags: string[] }[]>([])
  const [pendingImagePreviews, setPendingImagePreviews] = useState<{ url: string; tags: string[] }[]>([])

  const [form, setForm] = useState({
    propertyName: '',
    propertyAddress: '',
    propertyPostalCode: '',
    propertyCity: '',
    propertyCountry: 'NO',
    propertyType: 'Apartment',
    propertyImages: [] as string[],
    icalUrl: '',
    wifi: '',
    checkin: '',
    localTips: '',
    houseRules: '',
    // PDF extraction state
    pdfDragActive: false,
    pdfExtracting: false,
    pdfExtractedFile: null as { name: string; fields: string[] } | null,
    pdfExtractError: null as string | null,
    showManualFields: false,
  })

  const update = (field: string, value: string | boolean | any) => setForm(f => ({ ...f, [field]: value }))

  // Auth check + fetch org
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Find user's org
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
        .limit(1)
        .single()

      if (!org) {
        // No org = user hasn't completed signup
        router.push('/signup')
        return
      }
      setOrgId(org.id)
      setAuthLoading(false)
    }
    checkAuth()
  }, [router])

  const handlePdfUpload = async (files: File[]) => {
    const supportedFiles = files.filter(f =>
      f.type === 'application/pdf' || f.name.endsWith('.pdf') ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.name.endsWith('.docx')
    )

    if (supportedFiles.length === 0) {
      alert('Please upload PDF or Word (.docx) files')
      return
    }

    // Store files for image extraction after property creation
    setPendingDocFiles(supportedFiles)

    update('pdfExtracting', true)
    update('pdfExtractError', null)

    try {
      const formData = new FormData()
      supportedFiles.forEach(file => formData.append('files', file))
      // No propertyId — text-only extraction for now, images saved after property creation

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

      // Track pending images (will be extracted after property creation)
      const imgCount = extracted.image_count_skipped || 0
      // The API returns how many images were found but not stored (since no propertyId)
      // We need the total image count — check extracted_images array or use allImages count
      setPendingImageCount(imgCount)

      const fileName = supportedFiles.length === 1 ? supportedFiles[0].name : `${supportedFiles.length} files`
      const fieldSummary = [...filledFields]
      if (imgCount > 0) {
        fieldSummary.push(`${imgCount} image(s) pending`)
      }
      update('pdfExtractedFile', { name: fileName, fields: fieldSummary })

      // Auto-expand manual fields so user can see what was filled
      update('showManualFields', true)
    } catch (err) {
      console.error('PDF extraction error:', err)
      update('pdfExtractError', err instanceof Error ? err.message : 'Extraction failed')
    }

    update('pdfExtracting', false)
  }

  const canNext = () => {
    if (step === 1) return !!(form.propertyName && form.propertyCity && form.propertyPostalCode && form.propertyCountry)
    if (step === 2) return true // Config is optional
    return true
  }

  const hasGuestKnowledge = !!(form.wifi || form.checkin || form.localTips || form.houseRules)

  const handleCreateProperty = async () => {
    if (!orgId) return
    setLoading(true)
    try {
      // Create property
      const { data: prop, error: propErr } = await supabase
        .from('properties')
        .insert({
          org_id: orgId,
          name: form.propertyName,
          address: form.propertyAddress,
          postal_code: form.propertyPostalCode,
          city: form.propertyCity,
          country: form.propertyCountry,
          property_type: form.propertyType,
          images: form.propertyImages,
          ical_url: form.icalUrl || null,
          whatsapp_number: '',
        })
        .select()
        .single()

      if (propErr) throw propErr

      // Create config sheet
      const { error: configErr } = await supabase
        .from('property_config_sheets')
        .insert({
          property_id: prop.id,
          wifi_password: form.wifi,
          checkin_instructions: form.checkin,
          local_tips: form.localTips,
          house_rules: form.houseRules,
        })

      if (configErr) {
        console.error('Config sheet creation error:', configErr)
      }

      // Extract and store images from uploaded docs (now that we have a propertyId)
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

      // Generate QR code
      const QRCode = (await import('qrcode')).default
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'HeyConciergeBot'
      const qrUrl = `https://t.me/${botUsername}?start=${prop.id}`
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2, color: { dark: '#2D2B55', light: '#FFFFFF' } })
      setQrDataUrl(dataUrl)
      setCreatedPropertyId(prop.id)
      setStep(3)
    } catch (err: any) {
      console.error('Property creation error:', err)
      alert(`Failed to create property: ${err?.message || JSON.stringify(err)}`)
    }
    setLoading(false)
  }

  const handleNext = async () => {
    if (!canNext()) return
    if (step === 2) {
      await handleCreateProperty()
    } else {
      setStep(s => s + 1)
    }
  }

  const steps = ['Property Details', 'Config', 'Success']
  const totalSteps = steps.length

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
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
        {/* Step 1: Property Details */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Add a property</h2>
                <p className="text-muted">Tell us about your property.</p>
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
                  <p className="font-bold text-dark">Step {step}: Property</p>
                  <p className="text-muted">{steps.slice(step).join(' \u2192 ')}</p>
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
                <label className="block text-sm font-bold text-dark mb-1.5">Property Photos (Optional)</label>
                <PhotoUpload
                  onPhotosUploaded={(urls) => update('propertyImages', urls)}
                  existingPhotos={form.propertyImages}
                  maxPhotos={10}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Config (Guest Knowledge) */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-nunito text-3xl font-black mb-2">Guest Knowledge</h2>
                <p className="text-muted">What should HeyConcierge know about your property?</p>
              </div>
              <div className="flex items-center gap-3">
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
                    <p className="text-muted">{steps.slice(step).join(' \u2192 ')}</p>
                  </div>
                </div>
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
              {/* Calendar Sync */}
              <div className="bg-[#F5F3FF] border-2 border-[#E8E4FF] rounded-xl p-4">
                <p className="text-sm font-bold text-dark mb-2">Calendar Sync (Optional)</p>
                <Input
                  label="iCal URL"
                  value={form.icalUrl}
                  onChange={v => update('icalUrl', v)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                />
                <p className="text-xs text-muted mt-2">
                  Airbnb: Calendar &gt; Export | Booking.com: Extranet &gt; Calendar &gt; Export
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
                    <span className="text-dark font-bold text-sm">Reading your document and filling in the fields below...</span>
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
                    <p className="text-dark font-bold text-sm">Drop your property guide here (PDF or Word)</p>
                    <p className="text-xs text-muted mt-0.5">AI will auto-fill fields and extract images with smart tagging</p>
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

              {/* Property Images (for AI concierge to send to guests) */}
              <div className="bg-[#FFF5F5] border-2 border-[#FFE4E4] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-pink/10 text-pink">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark">Property Images (Optional)</p>
                    <p className="text-xs text-muted">Photos sent to guests when they ask about check-in, parking, etc.</p>
                  </div>
                </div>
                <PendingImageUpload
                  pendingImages={pendingImagePreviews}
                  onAdd={(files, tags) => {
                    setPendingImages(prev => [...prev, { files, tags }])
                    // Create preview URLs
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
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="animate-slide-up text-center">
            <div className="text-6xl mb-4">&#127881;</div>
            <h2 className="font-nunito text-3xl font-black mb-2">Property added!</h2>
            <p className="text-muted mb-8">Your AI concierge is ready. Place this QR code in your property &mdash; guests scan it to open Telegram and start chatting.</p>
            {qrDataUrl && (
              <div className="inline-block bg-white rounded-3xl p-8 shadow-card mb-8">
                <img src={qrDataUrl} alt="QR Code" className="w-[250px] h-[250px] mx-auto" />
                <p className="mt-4 font-nunito font-bold text-dark">{form.propertyName}</p>
                <p className="text-sm text-muted">Scan to chat with HeyConcierge</p>
              </div>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-nunito font-extrabold no-underline transition-all hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]">
                Go to Dashboard &#8594;
              </Link>
              {createdPropertyId && (
                <Link href={`/property/${createdPropertyId}/settings`} className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3 rounded-full font-nunito font-extrabold no-underline transition-all hover:-translate-y-0.5">
                  Property Settings
                </Link>
              )}
              {qrDataUrl && (
                <a href={qrDataUrl} download={`heyconcierge-qr-${form.propertyName}.png`} className="inline-flex items-center gap-2 border-2 border-[#E8E4FF] text-dark px-8 py-3 rounded-full font-nunito font-extrabold no-underline transition-all hover:-translate-y-0.5">
                  Download QR Code
                </a>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 3 && (
          <div className="flex justify-between mt-10">
            {step === 1 ? (
              <Link href="/dashboard" className="text-muted font-bold no-underline hover:text-primary transition-colors">&#8592; Dashboard</Link>
            ) : (
              <button onClick={() => setStep(s => s - 1)} className="text-muted font-bold hover:text-primary transition-colors">
                &#8592; Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext() || loading}
              className={`px-8 py-3 rounded-full font-nunito font-extrabold text-white transition-all ${canNext() ? 'bg-primary hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(108,92,231,0.3)]' : 'bg-[#C4BFFF] cursor-not-allowed'}`}
            >
              {loading ? 'Creating...' : step === 2 ? 'Create Property' : 'Next \u2192'}
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

// --- Local helper components ---

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

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4FF] bg-white text-dark font-medium placeholder:text-[#C4BFFF] focus:border-primary focus:outline-none transition-colors resize-none"
    />
  )
}

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
      {/* File selection */}
      <div className="relative border-2 border-dashed border-[rgba(108,92,231,0.15)] hover:border-primary rounded-xl p-4 text-center transition-all">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setSelectedFiles(Array.from(e.target.files).filter(f => f.type.startsWith('image/')))
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <p className="text-dark font-bold text-sm">Drop images here or click to browse</p>
        <p className="text-xs text-muted">PNG, JPG up to 10MB each</p>
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <>
          <div className="bg-white rounded-lg p-3">
            <p className="text-sm font-bold mb-1">Selected: {selectedFiles.length} file(s)</p>
            {selectedFiles.map((file, i) => (
              <p key={i} className="text-xs text-muted truncate">{'\u2022'} {file.name}</p>
            ))}
          </div>

          <div>
            <p className="text-sm font-bold mb-2">Select tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTags(prev =>
                    prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
                  )}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary text-white'
                      : 'bg-[rgba(108,92,231,0.1)] text-dark hover:bg-[rgba(108,92,231,0.2)]'
                  }`}
                >
                  {tag.emoji} {tag.label}
                </button>
              ))}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={handleAdd}
              className="w-full bg-primary text-white px-4 py-2.5 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all"
            >
              Add {selectedFiles.length} Image(s)
            </button>
          )}
        </>
      )}

      {/* Preview of pending images */}
      {pendingImages.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2">Pending ({pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''}):</p>
          <div className="grid grid-cols-3 gap-2">
            {pendingImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.url} alt={`Pending ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {img.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-[rgba(108,92,231,0.1)] px-1 py-0.5 rounded-full">
                      {AVAILABLE_TAGS.find(t => t.id === tag)?.emoji} {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center"
                >
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
