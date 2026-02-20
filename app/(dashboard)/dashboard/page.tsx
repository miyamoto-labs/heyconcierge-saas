'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [organization, setOrganization] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
            href="/signup?step=3"
            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:-translate-y-0.5 transition-all no-underline text-center whitespace-nowrap self-start sm:self-auto"
          >
            + Add Property
          </Link>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="font-nunito text-2xl font-black mb-2">No properties yet</h2>
            <p className="text-muted mb-6">Add your first property to get started!</p>
            <Link
              href="/signup?step=3"
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
    </div>
  )
}
