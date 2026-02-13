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
        // property_config_sheets comes as an array from Supabase
        const configData = Array.isArray(prop.property_config_sheets) 
          ? prop.property_config_sheets[0] 
          : prop.property_config_sheets
        setConfig(configData || {})
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update property
      await supabase
        .from('properties')
        .update({
          name: property.name,
          address: property.address,
          property_type: property.property_type,
          whatsapp_number: property.whatsapp_number,
          ical_url: property.ical_url,
        })
        .eq('id', propertyId)

      // Update config sheet
      if (config.id) {
        const { error } = await supabase
          .from('property_config_sheets')
          .update({
            wifi_password: config.wifi_password || '',
            checkin_instructions: config.checkin_instructions || '',
            local_tips: config.local_tips || '',
            house_rules: config.house_rules || '',
            sheet_url: config.sheet_url || '',
          })
          .eq('id', config.id)
        
        if (error) throw error
      } else {
        // Create config sheet
        const { error } = await supabase
          .from('property_config_sheets')
          .insert({
            property_id: propertyId,
            wifi_password: config.wifi_password || '',
            checkin_instructions: config.checkin_instructions || '',
            local_tips: config.local_tips || '',
            house_rules: config.house_rules || '',
            sheet_url: config.sheet_url || '',
          })
        
        if (error) throw error
      }

      alert('✅ Settings saved!')
      await loadProperty() // Reload data
    } catch (err) {
      console.error('Save error:', err)
      alert('❌ Failed to save: ' + err.message)
    }
    setSaving(false)
  }

  const handleLogout = () => {
    document.cookie = 'user_id=; Max-Age=0; path=/'
    document.cookie = 'user_email=; Max-Age=0; path=/'
    router.push('/login')
  }

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
          <Link href="/dashboard" className="text-primary font-bold">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

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
            <Link href="/dashboard" className="text-sm text-muted hover:text-dark font-bold">← Dashboard</Link>
            <span className="text-sm text-muted">{userEmail}</span>
            <button onClick={handleLogout} className="text-sm text-muted hover:text-dark font-bold">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-8 py-12">
        <h1 className="font-nunito text-4xl font-black mb-2">{property.name}</h1>
        <p className="text-muted mb-8">Property Settings</p>

        <div className="bg-white rounded-3xl shadow-card p-8 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="font-nunito text-2xl font-black mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Property Name</label>
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) => setProperty({ ...property, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Address</label>
                <input
                  type="text"
                  value={property.address}
                  onChange={(e) => setProperty({ ...property, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Property Type</label>
                <select
                  value={property.property_type}
                  onChange={(e) => setProperty({ ...property, property_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                >
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

              <div>
                <label className="block text-sm font-bold mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  value={property.whatsapp_number || ''}
                  onChange={(e) => setProperty({ ...property, whatsapp_number: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
                <p className="text-xs text-muted mt-2">Include country code (e.g., +47 for Norway)</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">iCal URL (optional)</label>
                <input
                  type="text"
                  value={property.ical_url || ''}
                  onChange={(e) => setProperty({ ...property, ical_url: e.target.value })}
                  placeholder="https://airbnb.com/calendar/ical/..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* AI Config */}
          <div className="pt-6 border-t border-[rgba(108,92,231,0.08)]">
            <h2 className="font-nunito text-2xl font-black mb-4">AI Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">WiFi Password</label>
                <input
                  type="text"
                  value={config.wifi_password || ''}
                  onChange={(e) => setConfig({ ...config, wifi_password: e.target.value })}
                  placeholder="MyPassword123"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Check-in Instructions</label>
                <textarea
                  value={config.checkin_instructions || ''}
                  onChange={(e) => setConfig({ ...config, checkin_instructions: e.target.value })}
                  placeholder="The key is under the mat. Door code is 1234."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Local Tips</label>
                <textarea
                  value={config.local_tips || ''}
                  onChange={(e) => setConfig({ ...config, local_tips: e.target.value })}
                  placeholder="Best coffee shop is 2 blocks away. Grocery store opens at 8 AM."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">House Rules</label>
                <textarea
                  value={config.house_rules || ''}
                  onChange={(e) => setConfig({ ...config, house_rules: e.target.value })}
                  placeholder="No smoking. Quiet hours 10 PM - 8 AM."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
                
                {/* House Rules Document Upload */}
                <div className="mt-4">
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragActive 
                        ? 'border-primary bg-[rgba(108,92,231,0.05)]' 
                        : 'border-[rgba(108,92,231,0.15)] hover:border-primary'
                    } ${extracting ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileInput}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={extracting}
                    />
                    <div className="pointer-events-none">
                      <svg className="w-8 h-8 mx-auto mb-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-dark font-bold text-sm">Add your documents here</p>
                      <p className="text-xs text-muted mt-1">(And we will handle the rest😉)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Google Sheet URL (optional)</label>
                <input
                  type="text"
                  value={config.sheet_url || ''}
                  onChange={(e) => setConfig({ ...config, sheet_url: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
                <p className="text-xs text-muted mt-2">Link to your property info sheet for additional details</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
