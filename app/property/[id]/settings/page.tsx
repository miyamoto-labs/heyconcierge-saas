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
  const [dragActive, setDragActive] = useState(false)
  const [extracting, setExtracting] = useState(false)
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
        // property_config_sheets comes as an array from Supabase
        const configData = Array.isArray(prop.property_config_sheets) 
          ? prop.property_config_sheets[0] 
          : prop.property_config_sheets
        setConfig(configData || {})
      }

      // Load property images
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
      // Update property
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
            booking_url: config.booking_url || '',
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
            booking_url: config.booking_url || '',
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await extractPDFs(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await extractPDFs(Array.from(e.target.files))
    }
  }

  const extractPDFs = async (files: File[]) => {
    // Filter for PDFs only
    const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    
    if (pdfFiles.length === 0) {
      alert('❌ Please upload PDF files only')
      return
    }

    setExtracting(true)
    try {
      const formData = new FormData()
      pdfFiles.forEach(file => formData.append('pdfs', file))

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004'
      const response = await fetch(`${backendUrl}/api/extract-pdf`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const extracted = await response.json()
      
      // Merge extracted data into config
      setConfig({
        ...config,
        wifi_password: extracted.wifi_password || config.wifi_password || '',
        checkin_instructions: extracted.checkin_instructions || config.checkin_instructions || '',
        local_tips: extracted.local_tips || config.local_tips || '',
        house_rules: extracted.house_rules || config.house_rules || '',
      })

      alert(`✅ Extracted data from ${pdfFiles.length} PDF(s)!`)
    } catch (err) {
      console.error('PDF extraction error:', err)
      alert(`❌ Failed to extract PDF: ${err.message}`)
    }
    setExtracting(false)
  }

  const handleImageUpload = async (files: File[], selectedTags: string[]) => {
    if (files.length === 0 || selectedTags.length === 0) {
      alert('❌ Please select at least one image and one tag')
      return
    }

    setUploadingImages(true)
    try {
      for (const file of files) {
        // Upload to Supabase Storage
        const fileName = `${propertyId}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName)

        // Save to database
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

      alert(`✅ Uploaded ${files.length} image(s)!`)
      await loadProperty() // Reload to show new images
    } catch (err) {
      console.error('Image upload error:', err)
      alert(`❌ Failed to upload: ${err.message}`)
    }
    setUploadingImages(false)
  }

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Delete this image?')) return

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/property-images/')
      if (urlParts.length === 2) {
        const filePath = urlParts[1]
        await supabase.storage.from('property-images').remove([filePath])
      }

      // Delete from database
      const { error } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId)

      if (error) throw error

      alert('✅ Image deleted!')
      await loadProperty() // Reload
    } catch (err) {
      console.error('Delete error:', err)
      alert(`❌ Failed to delete: ${err.message}`)
    }
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Latitude (optional)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={property.latitude || ''}
                    onChange={(e) => setProperty({ ...property, latitude: e.target.value })}
                    placeholder="59.9139"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                  />
                  <p className="text-xs text-muted mt-2">For weather-aware responses</p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Longitude (optional)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={property.longitude || ''}
                    onChange={(e) => setProperty({ ...property, longitude: e.target.value })}
                    placeholder="10.7522"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                  />
                  <p className="text-xs text-muted mt-2">Find on Google Maps</p>
                </div>
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
                
                {/* WiFi Document Upload */}
                <div className="mt-4">
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
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
                      <svg className="w-6 h-6 mx-auto mb-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-dark font-bold text-xs">Drop PDF here</p>
                    </div>
                  </div>
                </div>
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
                
                {/* Check-in Document Upload */}
                <div className="mt-4">
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
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
                      <svg className="w-6 h-6 mx-auto mb-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-dark font-bold text-xs">Drop PDF here</p>
                    </div>
                  </div>
                </div>
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
                
                {/* Local Tips Document Upload */}
                <div className="mt-4">
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
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
                      <svg className="w-6 h-6 mx-auto mb-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-dark font-bold text-xs">Drop PDF here</p>
                    </div>
                  </div>
                </div>
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
                <label className="block text-sm font-bold mb-2">Booking / Reservation URL (optional)</label>
                <input
                  type="url"
                  value={config.booking_url || ''}
                  onChange={(e) => setConfig({ ...config, booking_url: e.target.value })}
                  placeholder="https://airbnb.com/rooms/123456 or your direct booking link"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all"
                />
                <p className="text-xs text-muted mt-2">
                  💡 When guests ask about extending their stay or booking additional nights, the AI will share this link.
                </p>
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

          {/* Property Images */}
          <div className="pt-6 border-t border-[rgba(108,92,231,0.08)]">
            <h2 className="font-nunito text-2xl font-black mb-2">Property Images</h2>
            <p className="text-sm text-muted mb-4">Upload photos that will be automatically sent to guests when they ask relevant questions.</p>
            
            <PropertyImagesUpload 
              propertyId={propertyId}
              images={images}
              onUpload={handleImageUpload}
              onDelete={handleDeleteImage}
              uploading={uploadingImages}
            />
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
      {/* Upload Area */}
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
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="pointer-events-none">
          <svg className="w-12 h-12 mx-auto mb-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-dark font-bold mb-1">Drop images here or click to browse</p>
          <p className="text-xs text-muted">PNG, JPG, JPEG up to 10MB each</p>
        </div>
      </div>

      {/* Selected Files */}
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

      {/* Tag Selection */}
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

      {/* Upload Button */}
      {selectedFiles.length > 0 && selectedTags.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-primary text-white px-6 py-3 rounded-full font-bold hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
        </button>
      )}

      {/* Existing Images */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3 mt-6">Current Images ({images.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img: any) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-32 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center">
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {img.tags?.map((tag: string) => (
                      <span key={tag} className="text-xs bg-white text-dark px-2 py-1 rounded-full">
                        {availableTags.find(t => t.id === tag)?.emoji} {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onDelete(img.id, img.url)}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-red-600"
                  >
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
