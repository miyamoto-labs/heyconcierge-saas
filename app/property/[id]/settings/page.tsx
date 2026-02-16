'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import LogoSVG from '@/components/LogoSVG'
import { supabase } from '@/lib/supabase'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts.pop()?.split(';').shift() || null
    return cookie ? decodeURIComponent(cookie) : null
  }
  return null
}

export default function PropertySettingsPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [pdfDragActive, setPdfDragActive] = useState(false)
  const [pdfExtracting, setPdfExtracting] = useState(false)
  const [pdfExtractedFile, setPdfExtractedFile] = useState<{ name: string; fields: string[] } | null>(null)
  const [pdfExtractError, setPdfExtractError] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    const email = getCookie('user_email')
    if (!email) {
      router.push('/login')
      return
    }
    setUserEmail(email)
    loadProperty()
  }, [])

  const loadProperty = async () => {
    setLoading(true)
    try {
      const { data: prop } = await supabase
        .from('properties')
        .select('*, property_config_sheets(*)')
        .eq('id', propertyId)
        .single()

      if (prop) {
        setProperty(prop)
        const configData = Array.isArray(prop.property_config_sheets)
          ? prop.property_config_sheets[0]
          : prop.property_config_sheets
        setConfig(configData || {})
      }

      const { data: propertyImages } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (propertyImages) {
        setImages(propertyImages)
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase
        .from('properties')
        .update({
          name: property.name,
          address: property.address,
          property_type: property.property_type,
          whatsapp_number: property.whatsapp_number,
          ical_url: property.ical_url,
          latitude: property.latitude ? parseFloat(property.latitude) : null,
          longitude: property.longitude ? parseFloat(property.longitude) : null,
        })
        .eq('id', propertyId)

      if (config.id) {
        const { error } = await supabase
          .from('property_config_sheets')
          .update({
            wifi_password: config.wifi_password || '',
            checkin_instructions: config.checkin_instructions || '',
            local_tips: config.local_tips || '',
            house_rules: config.house_rules || '',
            sheet_url: config.sheet_url || '',
            booking_url: config.booking_url || '',
          })
          .eq('id', config.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('property_config_sheets')
          .insert({
            property_id: propertyId,
            wifi_password: config.wifi_password || '',
            checkin_instructions: config.checkin_instructions || '',
            local_tips: config.local_tips || '',
            house_rules: config.house_rules || '',
            sheet_url: config.sheet_url || '',
            booking_url: config.booking_url || '',
          })

        if (error) throw error
      }

      alert('Settings saved!')
      await loadProperty()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    setSaving(false)
  }

  const handleLogout = () => {
    document.cookie = 'user_id=; Max-Age=0; path=/'
    document.cookie = 'user_email=; Max-Age=0; path=/'
    router.push('/login')
  }

  const handlePdfDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setPdfDragActive(true)
    } else if (e.type === 'dragleave') {
      setPdfDragActive(false)
    }
  }

  const handlePdfDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPdfDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await extractPDF(Array.from(e.dataTransfer.files))
    }
  }

  const handlePdfFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await extractPDF(Array.from(e.target.files))
    }
  }

  const extractPDF = async (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))

    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only')
      return
    }

    setPdfExtracting(true)
    setPdfExtractError(null)
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
      const updates: Record<string, string> = {}

      if (extracted.wifi_password) { updates.wifi_password = extracted.wifi_password; filledFields.push('WiFi') }
      if (extracted.checkin_instructions) { updates.checkin_instructions = extracted.checkin_instructions; filledFields.push('Check-in') }
      if (extracted.local_tips) { updates.local_tips = extracted.local_tips; filledFields.push('Local tips') }
      if (extracted.house_rules) { updates.house_rules = extracted.house_rules; filledFields.push('House rules') }

      if (Object.keys(updates).length > 0) {
        setConfig({ ...config, ...updates })
      }

      const fileName = pdfFiles.length === 1 ? pdfFiles[0].name : `${pdfFiles.length} PDFs`
      setPdfExtractedFile({ name: fileName, fields: filledFields })
    } catch (err) {
      console.error('PDF extraction error:', err)
      setPdfExtractError(err instanceof Error ? err.message : 'Extraction failed')
    }
    setPdfExtracting(false)
  }

  const handleClearPdf = () => {
    setPdfExtractedFile(null)
    setPdfExtractError(null)
  }

  const handleImageUpload = async (files: File[], selectedTags: string[]) => {
    if (files.length === 0 || selectedTags.length === 0) {
      alert('Please select at least one image and one tag')
      return
    }

    setUploadingImages(true)
    try {
      for (const file of files) {
        const fileName = `${propertyId}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName)

        const { error: dbError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            url: publicUrl,
            filename: file.name,
            tags: selectedTags
          })

        if (dbError) throw dbError
      }

      alert(`Uploaded ${files.length} image(s)!`)
      await loadProperty()
    } catch (err) {
      console.error('Image upload error:', err)
      alert(`Failed to upload: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setUploadingImages(false)
  }

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Delete this image?')) return

    try {
      const urlParts = imageUrl.split('/property-images/')
      if (urlParts.length === 2) {
        const filePath = urlParts[1]
        await supabase.storage.from('property-images').remove([filePath])
      }

      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      alert('Image deleted!')
      await loadProperty()
    } catch (err) {
      console.error('Delete error:', err)
      alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Completion tracker
  const completionItems = config ? [
    { label: 'WiFi', done: !!config.wifi_password },
    { label: 'Check-in', done: !!config.checkin_instructions },
    { label: 'Local tips', done: !!config.local_tips },
    { label: 'House rules', done: !!config.house_rules },
    { label: 'Images', done: images.length > 0 },
  ] : []
  const completedCount = completionItems.filter(i => i.done).length
  const totalCount = completionItems.length

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4">Property not found</h1>
          <Link href="/dashboard" className="text-primary font-bold">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all bg-white"

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-dark font-bold">Back to Dashboard</Link>
            <span className="text-sm text-muted">{userEmail}</span>
            <button onClick={handleLogout} className="text-sm text-muted hover:text-dark font-bold">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-8 py-12 space-y-6">
        {/* Page header with completion */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-nunito text-4xl font-black mb-1">{property.name}</h1>
            <p className="text-muted">Configure what your AI concierge knows</p>
          </div>
          {config && (
            <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-5 py-3">
              <div className="relative w-11 h-11">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8E4F0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={completedCount === totalCount ? '#55EFC4' : '#6C5CE7'} strokeWidth="3" strokeDasharray={`${(completedCount / totalCount) * 100}, 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-dark">{completedCount}/{totalCount}</span>
              </div>
              <div className="text-xs">
                <p className="font-bold text-dark">{completedCount === totalCount ? 'All set!' : 'Setup progress'}</p>
                <p className="text-muted">{completionItems.filter(i => !i.done).map(i => i.label).join(', ') || 'Ready for guests'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Property Details */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-8 py-5 bg-gradient-to-r from-[rgba(108,92,231,0.06)] to-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <div>
              <h2 className="font-nunito text-lg font-black text-dark">Property Details</h2>
              <p className="text-xs text-muted">The basics about your place</p>
            </div>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-dark">Property Name</label>
                <input type="text" value={property.name} onChange={(e) => setProperty({ ...property, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-dark">Property Type</label>
                <select value={property.property_type} onChange={(e) => setProperty({ ...property, property_type: e.target.value })} className={inputClass}>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Hostel">Hostel</option>
                  <option value="B&B">B&B</option>
                  <option value="Cabin">Cabin</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">Address</label>
              <input type="text" value={property.address} onChange={(e) => setProperty({ ...property, address: e.target.value })} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">WhatsApp Number</label>
              <input type="text" value={property.whatsapp_number || ''} onChange={(e) => setProperty({ ...property, whatsapp_number: e.target.value })} placeholder="+1234567890" className={inputClass} />
              <p className="text-xs text-muted mt-1.5">Include country code (e.g., +47 for Norway)</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">iCal URL <span className="font-normal text-muted">(optional)</span></label>
              <input type="text" value={property.ical_url || ''} onChange={(e) => setProperty({ ...property, ical_url: e.target.value })} placeholder="https://airbnb.com/calendar/ical/..." className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-dark">Latitude <span className="font-normal text-muted">(optional)</span></label>
                <input type="number" step="0.000001" value={property.latitude || ''} onChange={(e) => setProperty({ ...property, latitude: e.target.value })} placeholder="59.9139" className={inputClass} />
                <p className="text-xs text-muted mt-1.5">For weather-aware responses</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-dark">Longitude <span className="font-normal text-muted">(optional)</span></label>
                <input type="number" step="0.000001" value={property.longitude || ''} onChange={(e) => setProperty({ ...property, longitude: e.target.value })} placeholder="10.7522" className={inputClass} />
                <p className="text-xs text-muted mt-1.5">Find on Google Maps</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Guest Knowledge */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-8 py-5 bg-gradient-to-r from-[rgba(85,239,196,0.1)] to-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div>
              <h2 className="font-nunito text-lg font-black text-dark">Guest Knowledge</h2>
              <p className="text-xs text-muted">What your AI concierge tells guests — type it or drop a PDF</p>
            </div>
          </div>
          <div className="px-8 py-6 space-y-5">
            {/* Single PDF drop zone for all fields */}
            <div
              className={`relative rounded-2xl border-2 border-dashed p-5 transition-all ${
                pdfDragActive ? 'border-primary bg-[rgba(108,92,231,0.05)]'
                : pdfExtractError ? 'border-red-300 bg-red-50'
                : pdfExtractedFile ? 'border-green-300 bg-green-50'
                : 'border-[rgba(108,92,231,0.2)] hover:border-primary/50 bg-[rgba(108,92,231,0.02)]'
              } ${pdfExtracting ? 'opacity-60 pointer-events-none' : ''}`}
              onDragEnter={handlePdfDrag}
              onDragLeave={handlePdfDrag}
              onDragOver={handlePdfDrag}
              onDrop={handlePdfDrop}
            >
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handlePdfFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={pdfExtracting}
              />
              {pdfExtracting ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-dark font-bold text-sm">Reading your PDF and filling in the fields below...</span>
                </div>
              ) : pdfExtractError ? (
                <div className="flex items-center gap-3 py-1">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-600">Extraction failed</p>
                    <p className="text-xs text-red-500 truncate">{pdfExtractError}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleClearPdf() }} className="shrink-0 text-red-400 hover:text-red-600 pointer-events-auto z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : pdfExtractedFile ? (
                <div className="flex items-center gap-3 py-1">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-700">Extracted from {pdfExtractedFile.name}</p>
                    <p className="text-xs text-green-600">
                      {pdfExtractedFile.fields.length > 0
                        ? `Filled: ${pdfExtractedFile.fields.join(', ')}`
                        : 'No matching info found — try a different PDF'}
                    </p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleClearPdf() }} className="shrink-0 text-gray-400 hover:text-gray-600 pointer-events-auto z-10">
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

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[rgba(108,92,231,0.1)]"></div>
              <span className="text-xs text-muted font-medium">or type manually</span>
              <div className="flex-1 h-px bg-[rgba(108,92,231,0.1)]"></div>
            </div>

            {/* WiFi */}
            <AIField
              label="WiFi Password"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg>}
              color="primary"
            >
              <input type="text" value={config.wifi_password || ''} onChange={(e) => setConfig({ ...config, wifi_password: e.target.value })} placeholder="Network name & password" className={inputClass} />
            </AIField>

            {/* Check-in */}
            <AIField
              label="Check-in Instructions"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
              color="accent"
            >
              <textarea value={config.checkin_instructions || ''} onChange={(e) => setConfig({ ...config, checkin_instructions: e.target.value })} placeholder="Key location, door codes, arrival steps, parking..." rows={3} className={inputClass} />
            </AIField>

            {/* Local Tips */}
            <AIField
              label="Local Tips & Recommendations"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              color="yellow"
            >
              <textarea value={config.local_tips || ''} onChange={(e) => setConfig({ ...config, local_tips: e.target.value })} placeholder="Restaurants, attractions, transport, things to do..." rows={3} className={inputClass} />
            </AIField>

            {/* House Rules */}
            <AIField
              label="House Rules"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              color="pink"
            >
              <textarea value={config.house_rules || ''} onChange={(e) => setConfig({ ...config, house_rules: e.target.value })} placeholder="Quiet hours, smoking policy, checkout, dos & don'ts..." rows={3} className={inputClass} />
            </AIField>
          </div>
        </div>

        {/* Section 3: Property Images */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-8 py-5 bg-gradient-to-r from-[rgba(253,121,168,0.08)] to-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h2 className="font-nunito text-lg font-black text-dark">Property Images</h2>
              <p className="text-xs text-muted">Photos sent to guests when they ask relevant questions</p>
            </div>
          </div>
          <div className="px-8 py-6">
            <PropertyImagesUpload
              propertyId={propertyId}
              images={images}
              onUpload={handleImageUpload}
              onDelete={handleDeleteImage}
              uploading={uploadingImages}
            />
          </div>
        </div>

        {/* Section 4: Links & Integrations */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="px-8 py-5 bg-gradient-to-r from-[rgba(116,185,255,0.1)] to-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <div>
              <h2 className="font-nunito text-lg font-black text-dark">Links & Integrations</h2>
              <p className="text-xs text-muted">Connect your booking platform and data sources</p>
            </div>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">Booking URL <span className="font-normal text-muted">(optional)</span></label>
              <input type="url" value={config.booking_url || ''} onChange={(e) => setConfig({ ...config, booking_url: e.target.value })} placeholder="https://airbnb.com/rooms/123456" className={inputClass} />
              <p className="text-xs text-muted mt-1.5">When guests ask about extending their stay, the AI shares this link</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">Google Sheet URL <span className="font-normal text-muted">(optional)</span></label>
              <input type="text" value={config.sheet_url || ''} onChange={(e) => setConfig({ ...config, sheet_url: e.target.value })} placeholder="https://docs.google.com/spreadsheets/d/..." className={inputClass} />
              <p className="text-xs text-muted mt-1.5">Additional property details from your spreadsheet</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:-translate-y-0.5 hover:shadow-card-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
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

// Property Images Upload Component
function PropertyImagesUpload({ propertyId, images, onUpload, onDelete, uploading }: any) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  const availableTags = [
    { id: 'entry', label: 'Entry/Door', emoji: '🚪' },
    { id: 'keybox', label: 'Key Box', emoji: '🔑' },
    { id: 'checkin', label: 'Check-in', emoji: '✅' },
    { id: 'parking', label: 'Parking', emoji: '🅿️' },
    { id: 'exterior', label: 'Exterior', emoji: '🏠' },
    { id: 'interior', label: 'Interior', emoji: '🛋️' },
    { id: 'view', label: 'View', emoji: '🌄' },
    { id: 'amenity', label: 'Amenities', emoji: '🏊' },
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter(f =>
        f.type.startsWith('image/')
      )
      setSelectedFiles(imageFiles)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imageFiles = Array.from(e.target.files).filter(f =>
        f.type.startsWith('image/')
      )
      setSelectedFiles(imageFiles)
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || selectedTags.length === 0) {
      alert('Please select files and at least one tag')
      return
    }

    await onUpload(selectedFiles, selectedTags)
    setSelectedFiles([])
    setSelectedTags([])
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragActive
            ? 'border-primary bg-[rgba(108,92,231,0.05)]'
            : 'border-[rgba(108,92,231,0.15)] hover:border-primary'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" multiple onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
        <div className="pointer-events-none">
          <svg className="w-10 h-10 mx-auto mb-2 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-dark font-bold text-sm mb-0.5">Drop images here or click to browse</p>
          <p className="text-xs text-muted">PNG, JPG, JPEG up to 10MB each</p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-[rgba(108,92,231,0.05)] rounded-xl p-4">
          <p className="text-sm font-bold mb-2">Selected: {selectedFiles.length} file(s)</p>
          <div className="space-y-1">
            {selectedFiles.map((file, idx) => (
              <p key={idx} className="text-xs text-muted truncate">• {file.name}</p>
            ))}
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div>
          <label className="block text-sm font-bold mb-2">Select tags (what this image shows):</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
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
      )}

      {selectedFiles.length > 0 && selectedTags.length > 0 && (
        <button onClick={handleUpload} disabled={uploading} className="w-full bg-primary text-white px-6 py-3 rounded-full font-bold hover:-translate-y-0.5 transition-all disabled:opacity-50">
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
        </button>
      )}

      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3 mt-2">Current Images ({images.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img: any) => (
              <div key={img.id} className="relative group">
                <img src={img.url} alt={img.filename} className="w-full h-32 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center">
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {img.tags?.map((tag: string) => (
                      <span key={tag} className="text-xs bg-white text-dark px-2 py-1 rounded-full">
                        {availableTags.find(t => t.id === tag)?.emoji} {tag}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => onDelete(img.id, img.url)} className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
