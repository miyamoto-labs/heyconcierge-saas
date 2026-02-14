'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

type ExtractedData = {
  property_name: string | null
  wifi_password: string | null
  wifi_network: string | null
  checkin_instructions: string | null
  checkout_instructions: string | null
  house_rules: string | null
  local_tips: string | null
  amenities: string[] | null
  parking_info: string | null
  emergency_contacts: string | null
  address: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004'

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type === 'application/pdf' || f.type === 'text/plain' || f.name.endsWith('.txt') || f.name.endsWith('.md')
    )
    setFiles(prev => [...prev, ...dropped])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const extractInfo = async () => {
    if (files.length === 0) return
    setExtracting(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))

      const res = await fetch(`${BACKEND}/api/parse-document`, {
        method: 'POST',
        body: formData
      })
      const json = await res.json()
      if (json.success) {
        setExtracted(json.data)
      } else {
        alert('Failed to extract: ' + (json.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setExtracting(false)
  }

  const saveToProperty = async () => {
    if (!extracted) return
    setSaving(true)
    try {
      const userId = getCookie('user_id')
      if (!userId) { router.push('/login'); return }

      // Get org
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (!orgs?.[0]) { alert('No organization found'); setSaving(false); return }

      // Get properties for selection or use first
      const { data: props } = await supabase
        .from('properties')
        .select('id, name')
        .eq('org_id', orgs[0].id)

      if (!props || props.length === 0) {
        alert('No properties found. Please add a property first.')
        setSaving(false)
        return
      }

      const targetId = propertyId || props[0].id

      // Update config
      await supabase
        .from('property_config_sheets')
        .upsert({
          property_id: targetId,
          wifi_password: extracted.wifi_password,
          checkin_instructions: extracted.checkin_instructions,
          house_rules: extracted.house_rules,
          local_tips: extracted.local_tips,
        }, { onConflict: 'property_id' })

      if (extracted.property_name || extracted.address) {
        const updates: any = {}
        if (extracted.property_name) updates.name = extracted.property_name
        if (extracted.address) updates.address = extracted.address
        await supabase.from('properties').update(updates).eq('id', targetId)
      }

      setSaved(true)
    } catch (err: any) {
      alert('Save error: ' + err.message)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="px-4 sm:px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
            <LogoSVG className="w-8 h-8" />
            <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-primary font-bold">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-4 sm:px-8 py-8">
        <h1 className="font-nunito text-3xl font-black mb-2">Smart Onboarding 📄</h1>
        <p className="text-muted mb-8">Upload your property documents (PDF, text) and we&apos;ll extract all the info automatically using AI.</p>

        {saved ? (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-nunito text-2xl font-black mb-2">Property Updated!</h2>
            <p className="text-muted mb-6">Your property info has been saved from the uploaded documents.</p>
            <Link href="/dashboard" className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold no-underline">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Upload Zone */}
            <div
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6 ${
                dragActive
                  ? 'border-primary bg-[rgba(108,92,231,0.05)]'
                  : 'border-[rgba(108,92,231,0.2)] bg-white hover:border-primary'
              }`}
            >
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,text/plain,application/pdf"
                onChange={handleFileSelect} className="hidden" />
              <div className="text-4xl mb-3">📂</div>
              <p className="font-nunito text-lg font-bold mb-1">Drag & drop files here</p>
              <p className="text-sm text-muted">PDF, TXT, or MD files • Click to browse</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mb-6 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-card">
                    <div className="flex items-center gap-2">
                      <span>{f.name.endsWith('.pdf') ? '📄' : '📝'}</span>
                      <span className="text-sm font-bold">{f.name}</span>
                      <span className="text-xs text-muted">({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-accent text-sm font-bold">✕</button>
                  </div>
                ))}
                <button onClick={extractInfo} disabled={extracting}
                  className="w-full bg-primary text-white py-3 rounded-full font-bold text-lg hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {extracting ? '🔍 Extracting with AI...' : '🤖 Extract Property Info'}
                </button>
              </div>
            )}

            {/* Preview */}
            {extracted && (
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-nunito text-xl font-black mb-4">Extracted Information</h3>
                <p className="text-sm text-muted mb-4">Review the extracted data before saving to your property.</p>

                <div className="space-y-4">
                  {[
                    { label: 'Property Name', key: 'property_name', icon: '🏠' },
                    { label: 'Address', key: 'address', icon: '📍' },
                    { label: 'WiFi Password', key: 'wifi_password', icon: '📶' },
                    { label: 'WiFi Network', key: 'wifi_network', icon: '🌐' },
                    { label: 'Check-in Instructions', key: 'checkin_instructions', icon: '🔑' },
                    { label: 'Check-out Instructions', key: 'checkout_instructions', icon: '🚪' },
                    { label: 'House Rules', key: 'house_rules', icon: '📋' },
                    { label: 'Local Tips', key: 'local_tips', icon: '🗺️' },
                    { label: 'Parking', key: 'parking_info', icon: '🅿️' },
                    { label: 'Emergency Contacts', key: 'emergency_contacts', icon: '🆘' },
                  ].map(field => {
                    const val = extracted[field.key as keyof ExtractedData]
                    if (!val) return null
                    return (
                      <div key={field.key} className="border-b border-[rgba(108,92,231,0.08)] pb-3">
                        <label className="text-xs font-bold text-muted uppercase">{field.icon} {field.label}</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{typeof val === 'object' ? JSON.stringify(val) : val}</p>
                      </div>
                    )
                  })}

                  {extracted.amenities && extracted.amenities.length > 0 && (
                    <div className="border-b border-[rgba(108,92,231,0.08)] pb-3">
                      <label className="text-xs font-bold text-muted uppercase">🏊 Amenities</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {extracted.amenities.map((a, i) => (
                          <span key={i} className="text-xs bg-accent-soft text-accent px-3 py-1 rounded-full font-bold">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={saveToProperty} disabled={saving}
                  className="w-full mt-6 bg-mint text-white py-3 rounded-full font-bold text-lg hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : '💾 Save to Property'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
