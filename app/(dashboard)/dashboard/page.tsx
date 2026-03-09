'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [organization, setOrganization] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showRatingPrompt, setShowRatingPrompt] = useState(false)
  const [platformRating, setPlatformRating] = useState<number>(0)
  const [platformComment, setPlatformComment] = useState('')
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email || null)
      setUserId(user.id)
    }
    checkAuth()
  }, [router])

  const loadData = async () => {
    if (!userId || !userEmail) return

    setLoading(true)
    try {
      // Get user's organizations — try auth_user_id first, fall back to email
      let { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('auth_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!orgs?.length) {
        const { data: orgsByEmail } = await supabase
          .from('organizations')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false })
          .limit(1)
        orgs = orgsByEmail
      }

      const org = orgs?.[0]

      setOrganization(org)

      if (org) {
        // Get properties
        const { data: props } = await supabase
          .from('properties')
          .select('*, property_config_sheets(*)')
          .eq('org_id', org.id)

        setProperties(props || [])

        // Check if we should show platform rating prompt (10+ completed guest ratings)
        try {
          const { count: guestRatingCount } = await supabase
            .from('guest_ratings')
            .select('id', { count: 'exact', head: true })
            .in('property_id', (props || []).map((p: any) => p.id))
            .eq('status', 'completed')

          const existingRating = await fetch('/api/platform-rating')
          const ratingData = await existingRating.json()

          if ((guestRatingCount ?? 0) >= 10 && !ratingData.rating) {
            setShowRatingPrompt(true)
          }
        } catch {
          // Rating check failed, don't show prompt
        }
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (dropdownOpen && !target.closest('.relative')) {
        setDropdownOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dropdownOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteProperty = async (propertyId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete "${propertyName}"?\n\nThis will permanently delete all bookings, messages, and configurations for this property.\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/delete-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete property')
      }

      await loadData()
      alert('Property deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete property. Please try again.')
    }
  }

  const handlePlatformRatingSubmit = async () => {
    if (platformRating === 0) return
    setSubmittingRating(true)
    try {
      const res = await fetch('/api/platform-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: platformRating, comment: platformComment || null }),
      })
      if (res.ok) {
        setRatingSubmitted(true)
      }
    } catch {
      // Silent fail
    }
    setSubmittingRating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // If no org, show signup completion
  if (!organization) {
    return (
      <div className="min-h-screen bg-bg">
        <header className="px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="font-nunito text-xl font-black no-underline flex items-center gap-2">
              <LogoSVG className="w-8 h-8" />
              <span className="text-accent">Hey</span><span className="text-dark">Concierge</span>
            </Link>
            <button onClick={handleLogout} className="text-sm text-muted hover:text-dark font-bold">
              Logout
            </button>
          </div>
        </header>
        
        <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
          <h1 className="font-nunito text-4xl font-black mb-4">Welcome! 🎉</h1>
          <p className="text-muted mb-8">Complete your setup to start using HeyConcierge</p>
          <Link
            href="/signup"
            className="inline-block bg-primary text-white px-8 py-4 rounded-full font-nunito font-extrabold text-lg no-underline hover:-translate-y-0.5 transition-all"
          >
            Complete Setup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="font-nunito text-lg sm:text-xl font-black no-underline flex items-center gap-2 flex-shrink-0">
            <LogoSVG className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-accent hidden sm:inline">Hey</span><span className="text-dark hidden sm:inline">Concierge</span>
            <span className="text-accent sm:hidden">heyc</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/calendar" className="text-xs sm:text-sm text-dark hover:text-primary font-bold whitespace-nowrap">
              📅 <span className="hidden sm:inline">Calendar</span>
            </Link>
            <Link href="/upselling" className="text-xs sm:text-sm text-dark hover:text-primary font-bold whitespace-nowrap">
              💰 <span className="hidden sm:inline">Upselling</span>
            </Link>
            <Link href="/billing" className="text-xs sm:text-sm text-dark hover:text-primary font-bold whitespace-nowrap">
              💳 <span className="hidden sm:inline">Billing</span>
            </Link>

            {/* Organization Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-xs sm:text-sm font-bold text-dark hover:text-primary flex items-center gap-1 max-w-[120px] sm:max-w-none truncate"
              >
                <span className="truncate">{organization?.name}</span>
                <span className="text-xs flex-shrink-0">▼</span>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[rgba(108,92,231,0.1)] py-2 z-50">
                  {/* Current Plan */}
                  <div className="px-4 py-3 border-b border-[rgba(108,92,231,0.08)]">
                    <div className="text-xs text-muted uppercase font-bold mb-1">Current Plan</div>
                    <div className="text-sm font-bold text-primary">
                      {organization?.plan || 'FREE'}
                    </div>
                  </div>
                  
                  {/* Billing & Plan */}
                  <Link
                    href="/billing"
                    onClick={() => setDropdownOpen(false)}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-[rgba(108,92,231,0.05)] transition-colors no-underline text-dark"
                  >
                    💳 Billing & Usage
                  </Link>
                  
                  {/* Logout */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-muted hover:bg-[rgba(108,92,231,0.05)] transition-colors border-t border-[rgba(108,92,231,0.08)]"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-nunito text-2xl sm:text-4xl font-black mb-2">Your Properties</h1>
            <p className="text-sm sm:text-base text-muted">Manage your AI concierges</p>
          </div>
          <Link
            href="/property/new"
            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:-translate-y-0.5 transition-all no-underline text-center whitespace-nowrap self-start sm:self-auto"
          >
            + Add Property
          </Link>
        </div>

        {/* Platform Rating Prompt */}
        {showRatingPrompt && !ratingSubmitted && (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-8 border-2 border-[rgba(108,92,231,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <h3 className="font-nunito text-lg font-black mb-1">How&apos;s your experience with HeyConcierge?</h3>
                <p className="text-sm text-muted mb-4">Your feedback helps us improve the service for everyone.</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setPlatformRating(star)}
                      className="p-0 border-0 bg-transparent cursor-pointer"
                    >
                      <svg
                        className={`w-8 h-8 transition-colors ${star <= platformRating ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {platformRating > 0 && (
                  <div className="space-y-3">
                    <textarea
                      value={platformComment}
                      onChange={(e) => setPlatformComment(e.target.value)}
                      placeholder="Any thoughts you'd like to share? (optional)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handlePlatformRatingSubmit}
                        disabled={submittingRating}
                        className="bg-primary text-white px-5 py-2 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        {submittingRating ? 'Sending...' : 'Submit'}
                      </button>
                      <button
                        onClick={() => setShowRatingPrompt(false)}
                        className="text-sm text-muted hover:text-dark font-bold px-3"
                      >
                        Maybe later
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {ratingSubmitted && (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-8 text-center">
            <p className="font-nunito text-lg font-black">Thank you for your feedback! 🙏</p>
          </div>
        )}

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="font-nunito text-2xl font-black mb-2">No properties yet</h2>
            <p className="text-muted mb-6">Add your first property to get started!</p>
            <Link
              href="/property/new"
              className="inline-block bg-primary text-white px-8 py-4 rounded-full font-bold hover:-translate-y-0.5 transition-all no-underline"
            >
              Add Your First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-2xl shadow-card p-4 sm:p-6 hover:-translate-y-1 transition-all">
                {property.images?.[0] && (
                  <Link href={`/property/${property.id}`}>
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-48 object-cover rounded-xl mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </Link>
                )}
                <h3 className="font-nunito text-xl font-black mb-2">{property.name}</h3>
                <p className="text-sm text-muted mb-4">{property.address}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-accent-soft text-accent px-3 py-1 rounded-full font-bold">
                    {property.property_type}
                  </span>
                  {property.whatsapp_number && (
                    <span className="text-xs bg-mint-soft text-mint-dark px-3 py-1 rounded-full font-bold">
                      ✅ Active
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-[rgba(108,92,231,0.08)] space-y-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/property/${property.id}`}
                      className="flex-1 text-center bg-[rgba(108,92,231,0.1)] text-primary px-4 py-2 rounded-lg font-bold text-sm hover:bg-[rgba(108,92,231,0.2)] transition-all no-underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/property/${property.id}/settings`}
                      className="flex-1 text-center border-2 border-[rgba(108,92,231,0.1)] text-dark px-4 py-2 rounded-lg font-bold text-sm hover:border-primary transition-all no-underline"
                    >
                      Settings
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDeleteProperty(property.id, property.name)}
                    className="w-full text-center border-2 border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    🗑️ Delete Property
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <PWAInstallPrompt />
    </div>
  )
}
