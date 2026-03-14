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
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // If no org, show signup completion
  if (!organization) {
    return (
      <div className="min-h-screen bg-[#FDFCFA]">
        <header className="px-8 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-[12px] sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight no-underline flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                  <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                  <rect x="5" y="17" width="22" height="4" rx="1.5" />
                </svg>
              </div>
              <span className="text-slate-800">Hey<span className="text-primary">Concierge</span></span>
            </Link>
            <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-4">Welcome!</h1>
          <p className="text-slate-500 mb-8">Complete your setup to start using HeyConcierge</p>
          <Link
            href="/signup"
            className="inline-block bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-lg font-semibold text-sm no-underline hover:-translate-y-0.5 transition-all shadow-saas-primary"
          >
            Complete Setup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA]">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="text-lg sm:text-xl font-bold tracking-tight no-underline flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" />
                <path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" />
                <rect x="5" y="17" width="22" height="4" rx="1.5" />
              </svg>
            </div>
            <span className="text-slate-800 hidden sm:inline">Hey<span className="text-primary">Concierge</span></span>
            <span className="text-primary sm:hidden">HC</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/calendar" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap no-underline">
              Calendar
            </Link>
            <Link href="/upselling" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap no-underline">
              Upselling
            </Link>
            <Link href="/billing" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap no-underline">
              Billing
            </Link>

            {/* Organization Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-primary flex items-center gap-1.5 max-w-[120px] sm:max-w-none truncate transition-colors"
              >
                <span className="truncate">{organization?.name}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" className="flex-shrink-0 opacity-50"><path d="M1 1l4 4 4-4"/></svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Current Plan</div>
                    <div className="text-sm font-semibold text-primary">
                      {organization?.plan || 'FREE'}
                    </div>
                  </div>

                  <Link
                    href="/billing"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors no-underline"
                  >
                    Billing & Usage
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-1">Your Properties</h1>
            <p className="text-sm text-slate-500">Manage your AI concierges</p>
          </div>
          <Link
            href="/property/new"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all no-underline text-center whitespace-nowrap self-start sm:self-auto shadow-saas-primary"
          >
            + Add Property
          </Link>
        </div>

        {/* Platform Rating Prompt */}
        {showRatingPrompt && !ratingSubmitted && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800 mb-1">How&apos;s your experience with HeyConcierge?</h3>
                <p className="text-sm text-slate-500 mb-4">Your feedback helps us improve the service for everyone.</p>
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
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handlePlatformRatingSubmit}
                        disabled={submittingRating}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      >
                        {submittingRating ? 'Sending...' : 'Submit'}
                      </button>
                      <button
                        onClick={() => setShowRatingPrompt(false)}
                        className="text-sm text-slate-400 hover:text-slate-600 font-medium px-3"
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 text-center">
            <p className="text-base font-bold text-slate-800">Thank you for your feedback!</p>
          </div>
        )}

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-primary/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No properties yet</h2>
            <p className="text-sm text-slate-500 mb-6">Add your first property to get started</p>
            <Link
              href="/property/new"
              className="inline-block bg-primary hover:bg-primary-dark text-white px-7 py-3 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all no-underline shadow-saas-primary"
            >
              Add Your First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-xl border-2 border-[#cbd5e1] p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40 transition-all">
                {property.images?.[0] && (
                  <Link href={`/property/${property.id}`}>
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-44 object-cover rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </Link>
                )}
                <h3 className="text-lg font-bold text-slate-800 mb-1">{property.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{property.address}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-primary/[0.08] text-primary px-2.5 py-1 rounded-md font-semibold">
                    {property.property_type}
                  </span>
                  {property.whatsapp_number && (
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-semibold">
                      Active
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/property/${property.id}`}
                      className="flex-1 text-center bg-primary/[0.08] text-primary px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/[0.14] transition-all no-underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/property/${property.id}/settings`}
                      className="flex-1 text-center border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm hover:border-primary hover:text-primary transition-all no-underline"
                    >
                      Settings
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDeleteProperty(property.id, property.name)}
                    className="w-full text-center border border-red-200 text-red-500 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    Delete Property
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
