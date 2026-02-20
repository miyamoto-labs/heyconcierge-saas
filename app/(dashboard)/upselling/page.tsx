'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

export default function UpsellPageWrapper() {
  return (
    <ToastProvider>
      <UpsellPage />
    </ToastProvider>
  )
}

// Types
interface UpsellConfig {
  id: string
  property_id: string
  enabled: boolean
  late_checkout_enabled: boolean
  late_checkout_price_per_hour: number
  late_checkout_max_hours: number
  late_checkout_standard_time: string
  late_checkout_send_hours_before: number
  early_checkin_enabled: boolean
  early_checkin_price_per_hour: number
  early_checkin_max_hours: number
  early_checkin_standard_time: string
  early_checkin_send_hours_before: number
  gap_night_enabled: boolean
  gap_night_discount_pct: number
  gap_night_base_price: number
  gap_night_max_gap: number
  gap_night_send_days_before: number
  stay_extension_enabled: boolean
  stay_extension_discount_pct: number
  stay_extension_send_hours_before: number
  review_request_enabled: boolean
  review_request_send_hours_after: number
  review_request_platform_urls: any
  auto_send: boolean
  message_language: string
}

interface UpsellOffer {
  id: string
  property_id: string
  booking_id: string
  offer_type: string
  status: string
  price: number
  currency: string
  offer_details: any
  guest_phone: string
  channel: string
  scheduled_at: string
  sent_at: string | null
  responded_at: string | null
  expires_at: string | null
  guest_response: string | null
  created_at: string
}

interface Property {
  id: string
  name: string
  property_code: string
}

const OFFER_TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  late_checkout: { emoji: '🕐', label: 'Late Checkout' },
  early_checkin: { emoji: '🌅', label: 'Early Check-in' },
  gap_night: { emoji: '🌙', label: 'Gap Night' },
  stay_extension: { emoji: '✨', label: 'Stay Extension' },
  review_request: { emoji: '⭐', label: 'Review Request' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-blue/20', text: 'text-blue' },
  draft: { bg: 'bg-yellow/20', text: 'text-yellow' },
  sent: { bg: 'bg-primary/10', text: 'text-primary' },
  accepted: { bg: 'bg-mint/20', text: 'text-mint-dark' },
  declined: { bg: 'bg-accent/10', text: 'text-accent' },
  expired: { bg: 'bg-muted/10', text: 'text-muted' },
}

function UpsellPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [config, setConfig] = useState<UpsellConfig | null>(null)
  const [offers, setOffers] = useState<UpsellOffer[]>([])
  const [stats, setStats] = useState({
    total: 0, sent: 0, accepted: 0, declined: 0, revenue: 0, conversionRate: 0
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard')

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const savedConfigRef = useRef<string | null>(null)

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

  useEffect(() => {
    if (userId) loadProperties()
  }, [userId])

  useEffect(() => {
    if (selectedPropertyId) loadUpsellData()
  }, [selectedPropertyId])

  // Warn on tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Close dropdown on outside click
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

  const loadProperties = async () => {
    setLoading(true)
    try {
      let { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('auth_user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!orgs?.length && userEmail) {
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
        const { data: props } = await supabase
          .from('properties')
          .select('id, name, property_code')
          .eq('org_id', org.id)

        setProperties(props || [])

        if (props?.length && !selectedPropertyId) {
          setSelectedPropertyId(props[0].id)
        }
      }
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  const loadUpsellData = async () => {
    if (!selectedPropertyId) return

    try {
      // Load config
      const { data: cfgData } = await supabase
        .from('upsell_configs')
        .select('*')
        .eq('property_id', selectedPropertyId)
        .single()

      if (cfgData) {
        setConfig(cfgData)
        savedConfigRef.current = JSON.stringify(cfgData)
      } else {
        // Create default config
        const defaultConfig = {
          property_id: selectedPropertyId,
          enabled: false,
          late_checkout_enabled: false,
          late_checkout_price_per_hour: 15,
          late_checkout_max_hours: 3,
          late_checkout_standard_time: '11:00',
          late_checkout_send_hours_before: 12,
          early_checkin_enabled: false,
          early_checkin_price_per_hour: 15,
          early_checkin_max_hours: 3,
          early_checkin_standard_time: '15:00',
          early_checkin_send_hours_before: 24,
          gap_night_enabled: false,
          gap_night_discount_pct: 20,
          gap_night_base_price: 100,
          gap_night_max_gap: 3,
          gap_night_send_days_before: 2,
          stay_extension_enabled: false,
          stay_extension_discount_pct: 10,
          stay_extension_send_hours_before: 24,
          review_request_enabled: false,
          review_request_send_hours_after: 6,
          review_request_platform_urls: {},
          auto_send: true,
          message_language: 'en',
        }
        const { data: newCfg } = await supabase
          .from('upsell_configs')
          .insert(defaultConfig)
          .select()
          .single()
        if (newCfg) {
          setConfig(newCfg)
          savedConfigRef.current = JSON.stringify(newCfg)
        }
      }

      // Load offers
      const { data: offersData } = await supabase
        .from('upsell_offers')
        .select('*')
        .eq('property_id', selectedPropertyId)
        .order('created_at', { ascending: false })
        .limit(50)

      setOffers(offersData || [])

      // Calculate stats
      const all = offersData || []
      const sentOffers = all.filter(o => ['sent', 'accepted', 'declined', 'expired'].includes(o.status))
      const accepted = all.filter(o => o.status === 'accepted')
      const declined = all.filter(o => o.status === 'declined')
      const revenue = accepted.reduce((sum, o) => sum + (o.price || 0), 0)

      setStats({
        total: all.length,
        sent: sentOffers.length,
        accepted: accepted.length,
        declined: declined.length,
        revenue,
        conversionRate: sentOffers.length > 0 ? Math.round((accepted.length / sentOffers.length) * 100) : 0,
      })
    } catch (err) {
      console.error('Load upsell data error:', err)
    }
  }

  const updateConfig = (updates: Partial<UpsellConfig>) => {
    if (!config) return
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    setHasUnsavedChanges(JSON.stringify(newConfig) !== savedConfigRef.current)
  }

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('upsell_configs')
        .update({
          enabled: config.enabled,
          late_checkout_enabled: config.late_checkout_enabled,
          late_checkout_price_per_hour: config.late_checkout_price_per_hour,
          late_checkout_max_hours: config.late_checkout_max_hours,
          late_checkout_standard_time: config.late_checkout_standard_time,
          late_checkout_send_hours_before: config.late_checkout_send_hours_before,
          early_checkin_enabled: config.early_checkin_enabled,
          early_checkin_price_per_hour: config.early_checkin_price_per_hour,
          early_checkin_max_hours: config.early_checkin_max_hours,
          early_checkin_standard_time: config.early_checkin_standard_time,
          early_checkin_send_hours_before: config.early_checkin_send_hours_before,
          gap_night_enabled: config.gap_night_enabled,
          gap_night_discount_pct: config.gap_night_discount_pct,
          gap_night_base_price: config.gap_night_base_price,
          gap_night_max_gap: config.gap_night_max_gap,
          gap_night_send_days_before: config.gap_night_send_days_before,
          stay_extension_enabled: config.stay_extension_enabled,
          stay_extension_discount_pct: config.stay_extension_discount_pct,
          stay_extension_send_hours_before: config.stay_extension_send_hours_before,
          review_request_enabled: config.review_request_enabled,
          review_request_send_hours_after: config.review_request_send_hours_after,
          review_request_platform_urls: config.review_request_platform_urls,
          auto_send: config.auto_send,
          message_language: config.message_language,
        })
        .eq('id', config.id)

      if (error) throw error

      savedConfigRef.current = JSON.stringify(config)
      setHasUnsavedChanges(false)
      toast('Upsell settings saved!', 'success')
    } catch (err: any) {
      console.error('Save error:', err)
      toast('Failed to save settings', 'error')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none transition-all bg-white text-sm"
  const toggleClass = (enabled: boolean) =>
    `relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
      enabled ? 'bg-primary' : 'bg-[rgba(108,92,231,0.15)]'
    }`
  const toggleDot = (enabled: boolean) =>
    `inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
      enabled ? 'translate-x-6' : 'translate-x-1'
    }`

  return (
    <div className="min-h-screen bg-bg">
      {/* Unsaved changes bar */}
      {hasUnsavedChanges && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-[#FDCB6E] to-[#F9CA24] px-4 py-2 text-center text-sm font-bold text-dark">
          You have unsaved changes —{' '}
          <button
            onClick={handleSave}
            className="underline hover:no-underline font-extrabold"
          >
            Save now
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`px-4 sm:px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky ${hasUnsavedChanges ? 'top-[36px]' : 'top-0'} z-30`}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="font-nunito text-lg sm:text-xl font-black no-underline flex items-center gap-2 flex-shrink-0">
            <LogoSVG className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-accent hidden sm:inline">Hey</span><span className="text-dark hidden sm:inline">Concierge</span>
            <span className="text-accent sm:hidden">heyc</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-xs sm:text-sm text-dark hover:text-primary font-bold whitespace-nowrap">
              🏠 <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link href="/calendar" className="text-xs sm:text-sm text-dark hover:text-primary font-bold whitespace-nowrap">
              📅 <span className="hidden sm:inline">Calendar</span>
            </Link>
            <span className="text-xs sm:text-sm text-primary font-bold whitespace-nowrap">
              💰 <span className="hidden sm:inline">Upselling</span>
            </span>

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
                  <div className="px-4 py-3 border-b border-[rgba(108,92,231,0.08)]">
                    <div className="text-xs text-muted uppercase font-bold mb-1">Current Plan</div>
                    <div className="text-sm font-bold text-primary">{organization?.plan || 'FREE'}</div>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout() }}
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-nunito text-2xl sm:text-4xl font-black mb-2">Upselling</h1>
            <p className="text-sm sm:text-base text-muted">Boost revenue with automated offers to your guests</p>
          </div>

          {/* Property Selector */}
          {properties.length > 1 && (
            <select
              value={selectedPropertyId || ''}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="bg-white px-4 py-3 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none font-bold text-sm"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="font-nunito text-2xl font-black mb-2">No properties yet</h2>
            <p className="text-muted mb-6">Add a property first to start upselling</p>
            <Link href="/signup?step=3" className="bg-primary text-white px-6 py-3 rounded-full font-bold no-underline hover:-translate-y-0.5 transition-all">
              + Add Property
            </Link>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-dark hover:bg-[rgba(108,92,231,0.05)] border-2 border-[rgba(108,92,231,0.1)]'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  activeTab === 'settings'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-dark hover:bg-[rgba(108,92,231,0.05)] border-2 border-[rgba(108,92,231,0.1)]'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>

            {activeTab === 'dashboard' ? (
              <DashboardView
                stats={stats}
                offers={offers}
                selectedProperty={selectedProperty}
                config={config}
              />
            ) : (
              <SettingsView
                config={config}
                updateConfig={updateConfig}
                handleSave={handleSave}
                saving={saving}
                inputClass={inputClass}
                toggleClass={toggleClass}
                toggleDot={toggleDot}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ==========================================
// Dashboard View — Stats + Recent Offers
// ==========================================

function DashboardView({
  stats,
  offers,
  selectedProperty,
  config,
}: {
  stats: any
  offers: UpsellOffer[]
  selectedProperty?: Property
  config: UpsellConfig | null
}) {
  return (
    <div className="space-y-8">
      {/* Master Toggle Status */}
      {config && !config.enabled && (
        <div className="bg-yellow/10 border-2 border-yellow/30 rounded-2xl px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-dark text-sm">Upselling is paused for {selectedProperty?.name}</p>
            <p className="text-xs text-muted">Go to Settings to enable automated offers</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard emoji="📤" value={stats.sent} label="Offers Sent" />
        <StatCard emoji="✅" value={stats.accepted} label="Accepted" color="text-mint-dark" />
        <StatCard emoji="📈" value={`${stats.conversionRate}%`} label="Conversion" />
        <StatCard emoji="💰" value={`€${stats.revenue}`} label="Revenue" color="text-primary" large />
      </div>

      {/* Breakdown by Type */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[rgba(108,92,231,0.06)] to-transparent">
          <h2 className="font-nunito font-black text-lg">📋 Offer Breakdown</h2>
        </div>
        <div className="px-6 sm:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(OFFER_TYPE_LABELS).map(([type, { emoji, label }]) => {
              const typeOffers = offers.filter(o => o.offer_type === type)
              const accepted = typeOffers.filter(o => o.status === 'accepted').length
              const sent = typeOffers.filter(o => ['sent', 'accepted', 'declined', 'expired'].includes(o.status)).length
              const revenue = typeOffers.filter(o => o.status === 'accepted').reduce((s, o) => s + (o.price || 0), 0)

              return (
                <div key={type} className="bg-[rgba(108,92,231,0.03)] rounded-2xl p-4 border border-[rgba(108,92,231,0.06)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{emoji}</span>
                    <span className="font-bold text-sm text-dark">{label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-black text-dark">{sent}</div>
                      <div className="text-[10px] text-muted uppercase font-bold">Sent</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-mint-dark">{accepted}</div>
                      <div className="text-[10px] text-muted uppercase font-bold">Accepted</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-primary">€{revenue}</div>
                      <div className="text-[10px] text-muted uppercase font-bold">Revenue</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Offers Table */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[rgba(108,92,231,0.06)] to-transparent flex items-center justify-between">
          <h2 className="font-nunito font-black text-lg">📬 Recent Offers</h2>
          <span className="text-xs text-muted font-bold">{offers.length} total</span>
        </div>

        {offers.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-muted font-bold">No offers yet</p>
            <p className="text-xs text-muted mt-1">Offers will appear here once upselling is enabled and bookings are synced</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(108,92,231,0.08)]">
                  <th className="text-left px-6 py-3 text-xs text-muted font-bold uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-muted font-bold uppercase">Guest</th>
                  <th className="text-left px-4 py-3 text-xs text-muted font-bold uppercase">Channel</th>
                  <th className="text-left px-4 py-3 text-xs text-muted font-bold uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs text-muted font-bold uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted font-bold uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {offers.slice(0, 20).map(offer => {
                  const type = OFFER_TYPE_LABELS[offer.offer_type] || { emoji: '📋', label: offer.offer_type }
                  const statusStyle = STATUS_COLORS[offer.status] || STATUS_COLORS.scheduled

                  return (
                    <tr key={offer.id} className="border-b border-[rgba(108,92,231,0.04)] hover:bg-[rgba(108,92,231,0.02)]">
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-2">
                          <span>{type.emoji}</span>
                          <span className="font-bold">{type.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {offer.guest_phone?.startsWith('tg:') ? '📱 Telegram' : '📱 WhatsApp'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          offer.channel === 'telegram' ? 'bg-blue/10 text-blue' : 'bg-mint/10 text-mint-dark'
                        }`}>
                          {offer.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {offer.price > 0 ? `€${offer.price}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {offer.sent_at
                          ? new Date(offer.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : offer.scheduled_at
                            ? `Scheduled ${new Date(offer.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                            : '—'
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ emoji, value, label, color, large }: {
  emoji: string; value: string | number; label: string; color?: string; large?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
      <div className="text-2xl sm:text-3xl mb-2">{emoji}</div>
      <div className={`${large ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black ${color || 'text-dark'}`}>
        {value}
      </div>
      <div className="text-[11px] text-muted font-bold uppercase mt-1">{label}</div>
    </div>
  )
}

// ==========================================
// Settings View — Configure Upsell Offers
// ==========================================

function SettingsView({
  config,
  updateConfig,
  handleSave,
  saving,
  inputClass,
  toggleClass,
  toggleDot,
}: {
  config: UpsellConfig | null
  updateConfig: (u: Partial<UpsellConfig>) => void
  handleSave: () => void
  saving: boolean
  inputClass: string
  toggleClass: (enabled: boolean) => string
  toggleDot: (enabled: boolean) => string
}) {
  if (!config) return null

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 sm:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl">💰</span>
            <div>
              <h2 className="font-nunito font-black text-lg">Automated Upselling</h2>
              <p className="text-xs text-muted mt-0.5">When enabled, offers will be sent to guests automatically</p>
            </div>
          </div>
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={toggleClass(config.enabled)}
          >
            <span className={toggleDot(config.enabled)} />
          </button>
        </div>
      </div>

      {/* Auto-send mode */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <span className="font-bold text-sm">Autopilot Mode</span>
              <p className="text-[11px] text-muted">Send offers automatically, or require your approval first</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${!config.auto_send ? 'text-primary' : 'text-muted'}`}>Draft</span>
            <button
              onClick={() => updateConfig({ auto_send: !config.auto_send })}
              className={toggleClass(config.auto_send)}
            >
              <span className={toggleDot(config.auto_send)} />
            </button>
            <span className={`text-xs font-bold ${config.auto_send ? 'text-primary' : 'text-muted'}`}>Auto</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌍</span>
            <span className="font-bold text-sm">Message Language</span>
          </div>
          <select
            value={config.message_language}
            onChange={e => updateConfig({ message_language: e.target.value })}
            className="px-4 py-2 rounded-xl border-2 border-[rgba(108,92,231,0.1)] focus:border-primary outline-none text-sm font-bold bg-white"
          >
            <option value="en">English</option>
            <option value="no">Norsk</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="nl">Nederlands</option>
            <option value="sv">Svenska</option>
          </select>
        </div>
      </div>

      {/* Late Checkout */}
      <OfferSection
        emoji="🕐"
        title="Late Checkout"
        description="Offer guests extra time before they check out"
        enabled={config.late_checkout_enabled}
        onToggle={() => updateConfig({ late_checkout_enabled: !config.late_checkout_enabled })}
        toggleClass={toggleClass}
        toggleDot={toggleDot}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Price per hour (€)</label>
            <input
              type="number"
              value={config.late_checkout_price_per_hour}
              onChange={e => updateConfig({ late_checkout_price_per_hour: Number(e.target.value) })}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Max extra hours</label>
            <input
              type="number"
              value={config.late_checkout_max_hours}
              onChange={e => updateConfig({ late_checkout_max_hours: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={8}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Standard checkout time</label>
            <input
              type="time"
              value={config.late_checkout_standard_time}
              onChange={e => updateConfig({ late_checkout_standard_time: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Send offer X hours before checkout</label>
            <input
              type="number"
              value={config.late_checkout_send_hours_before}
              onChange={e => updateConfig({ late_checkout_send_hours_before: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={48}
            />
          </div>
        </div>
        <OfferPreview>
          🕐 <strong>Late Checkout Available!</strong><br />
          Enjoy a relaxed morning! Check out up to {config.late_checkout_max_hours}h later
          for just €{config.late_checkout_price_per_hour * config.late_checkout_max_hours}.<br />
          Reply <strong>YES</strong> to book or <strong>NO</strong> to decline.
        </OfferPreview>
      </OfferSection>

      {/* Early Check-in */}
      <OfferSection
        emoji="🌅"
        title="Early Check-in"
        description="Let guests arrive before standard check-in time"
        enabled={config.early_checkin_enabled}
        onToggle={() => updateConfig({ early_checkin_enabled: !config.early_checkin_enabled })}
        toggleClass={toggleClass}
        toggleDot={toggleDot}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Price per hour (€)</label>
            <input
              type="number"
              value={config.early_checkin_price_per_hour}
              onChange={e => updateConfig({ early_checkin_price_per_hour: Number(e.target.value) })}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Max early hours</label>
            <input
              type="number"
              value={config.early_checkin_max_hours}
              onChange={e => updateConfig({ early_checkin_max_hours: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={8}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Standard check-in time</label>
            <input
              type="time"
              value={config.early_checkin_standard_time}
              onChange={e => updateConfig({ early_checkin_standard_time: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Send offer X hours before check-in</label>
            <input
              type="number"
              value={config.early_checkin_send_hours_before}
              onChange={e => updateConfig({ early_checkin_send_hours_before: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={72}
            />
          </div>
        </div>
        <OfferPreview>
          🌅 <strong>Early Check-in Available!</strong><br />
          Arrive up to {config.early_checkin_max_hours}h earlier
          for just €{config.early_checkin_price_per_hour * config.early_checkin_max_hours}.<br />
          Reply <strong>YES</strong> to book or <strong>NO</strong> to decline.
        </OfferPreview>
      </OfferSection>

      {/* Gap Night */}
      <OfferSection
        emoji="🌙"
        title="Gap Night Offers"
        description="Fill empty nights between bookings at a discount"
        enabled={config.gap_night_enabled}
        onToggle={() => updateConfig({ gap_night_enabled: !config.gap_night_enabled })}
        toggleClass={toggleClass}
        toggleDot={toggleDot}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Base price per night (€)</label>
            <input
              type="number"
              value={config.gap_night_base_price}
              onChange={e => updateConfig({ gap_night_base_price: Number(e.target.value) })}
              className={inputClass}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Discount (%)</label>
            <input
              type="number"
              value={config.gap_night_discount_pct}
              onChange={e => updateConfig({ gap_night_discount_pct: Number(e.target.value) })}
              className={inputClass}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Max gap nights</label>
            <input
              type="number"
              value={config.gap_night_max_gap}
              onChange={e => updateConfig({ gap_night_max_gap: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={14}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Send X days before checkout</label>
            <input
              type="number"
              value={config.gap_night_send_days_before}
              onChange={e => updateConfig({ gap_night_send_days_before: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={7}
            />
          </div>
        </div>
        <OfferPreview>
          🌙 <strong>Special Offer: Extra Night(s)!</strong><br />
          Get {config.gap_night_discount_pct}% off at just €{Math.round(config.gap_night_base_price * (1 - config.gap_night_discount_pct / 100))}/night.<br />
          Reply <strong>YES</strong> to extend your stay or <strong>NO</strong> to decline.
        </OfferPreview>
      </OfferSection>

      {/* Stay Extension */}
      <OfferSection
        emoji="✨"
        title="Stay Extension"
        description="Offer guests extra nights at a discount"
        enabled={config.stay_extension_enabled}
        onToggle={() => updateConfig({ stay_extension_enabled: !config.stay_extension_enabled })}
        toggleClass={toggleClass}
        toggleDot={toggleDot}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Discount (%)</label>
            <input
              type="number"
              value={config.stay_extension_discount_pct}
              onChange={e => updateConfig({ stay_extension_discount_pct: Number(e.target.value) })}
              className={inputClass}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Send X hours before checkout</label>
            <input
              type="number"
              value={config.stay_extension_send_hours_before}
              onChange={e => updateConfig({ stay_extension_send_hours_before: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={72}
            />
          </div>
        </div>
        <OfferPreview>
          ✨ <strong>Extend Your Stay?</strong><br />
          We can offer you {config.stay_extension_discount_pct}% off extra nights.<br />
          Reply <strong>YES</strong> if you&apos;re interested or <strong>NO</strong> to decline.
        </OfferPreview>
      </OfferSection>

      {/* Review Request */}
      <OfferSection
        emoji="⭐"
        title="Review Request"
        description="Ask guests for a review after checkout"
        enabled={config.review_request_enabled}
        onToggle={() => updateConfig({ review_request_enabled: !config.review_request_enabled })}
        toggleClass={toggleClass}
        toggleDot={toggleDot}
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Send X hours after checkout</label>
            <input
              type="number"
              value={config.review_request_send_hours_after}
              onChange={e => updateConfig({ review_request_send_hours_after: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={72}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Google Review URL</label>
            <input
              type="url"
              value={config.review_request_platform_urls?.google || ''}
              onChange={e => updateConfig({
                review_request_platform_urls: {
                  ...config.review_request_platform_urls,
                  google: e.target.value
                }
              })}
              placeholder="https://g.page/review/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">Airbnb Review URL</label>
            <input
              type="url"
              value={config.review_request_platform_urls?.airbnb || ''}
              onChange={e => updateConfig({
                review_request_platform_urls: {
                  ...config.review_request_platform_urls,
                  airbnb: e.target.value
                }
              })}
              placeholder="https://airbnb.com/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase mb-1 block">TripAdvisor Review URL</label>
            <input
              type="url"
              value={config.review_request_platform_urls?.tripadvisor || ''}
              onChange={e => updateConfig({
                review_request_platform_urls: {
                  ...config.review_request_platform_urls,
                  tripadvisor: e.target.value
                }
              })}
              placeholder="https://tripadvisor.com/..."
              className={inputClass}
            />
          </div>
        </div>
        <OfferPreview>
          ⭐ <strong>How was your stay?</strong><br />
          We hope you had a wonderful time! A review would mean the world to us. 🙏
        </OfferPreview>
      </OfferSection>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-8 py-4 rounded-full font-nunito font-extrabold text-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  )
}

// ==========================================
// Reusable Components
// ==========================================

function OfferSection({
  emoji,
  title,
  description,
  enabled,
  onToggle,
  toggleClass,
  toggleDot,
  children,
}: {
  emoji: string
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  toggleClass: (e: boolean) => string
  toggleDot: (e: boolean) => string
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white rounded-3xl shadow-card overflow-hidden transition-all ${!enabled ? 'opacity-75' : ''}`}>
      {/* Header with toggle */}
      <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[rgba(108,92,231,0.06)] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-nunito font-black text-base">{title}</h3>
            <p className="text-[11px] text-muted">{description}</p>
          </div>
        </div>
        <button onClick={onToggle} className={toggleClass(enabled)}>
          <span className={toggleDot(enabled)} />
        </button>
      </div>

      {/* Content — only shown when enabled */}
      {enabled && (
        <div className="px-6 sm:px-8 py-6 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

function OfferPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-[rgba(108,92,231,0.04)] rounded-xl p-4 border border-dashed border-[rgba(108,92,231,0.15)]">
      <div className="text-[10px] text-muted font-bold uppercase mb-2">Message Preview</div>
      <div className="text-sm text-dark leading-relaxed">
        {children}
      </div>
    </div>
  )
}
