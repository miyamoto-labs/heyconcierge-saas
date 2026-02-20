'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LogoSVG from '@/components/brand/LogoSVG'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  { id: 'starter', name: 'Starter', emoji: '🌱', price: '$49', period: '/mo', properties: 5, messages: 500 },
  { id: 'professional', name: 'Professional', emoji: '⚡', price: '$149', period: '/mo', properties: 20, messages: 2000, popular: true },
  { id: 'premium', name: 'Premium', emoji: '👑', price: '$299', period: '/mo', properties: 40, messages: -1 },
]

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [showPlans, setShowPlans] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const loadOrg = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('auth_user_id', user.id)
        .limit(1)

      if (!orgs?.length && user.email) {
        const { data: orgsByEmail } = await supabase
          .from('organizations')
          .select('id')
          .eq('email', user.email)
          .limit(1)
        orgs = orgsByEmail
      }

      if (orgs?.[0]) {
        setOrgId(orgs[0].id)
      } else {
        setLoading(false)
      }
    }
    loadOrg()
  }, [router])

  useEffect(() => {
    if (!orgId) return

    const loadBilling = async () => {
      try {
        const [billingRes, usageRes] = await Promise.all([
          fetch(`/api/billing/current?orgId=${orgId}`),
          fetch(`/api/billing/usage?orgId=${orgId}`),
        ])

        if (billingRes.ok) setBilling(await billingRes.json())
        if (usageRes.ok) setUsage(await usageRes.json())
      } catch (err) {
        console.error('Billing load error:', err)
      }
      setLoading(false)
    }
    loadBilling()
  }, [orgId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const currentPlan = PLANS.find(p => p.id === billing?.org?.plan) || PLANS[0]
  const status = billing?.org?.status || 'trialing'
  const trialDays = billing?.org?.trialDaysLeft || 0

  const messageLimit = currentPlan.messages
  const messageUsed = usage?.messages || 0
  const messagePercent = messageLimit > 0 ? Math.min(100, Math.round((messageUsed / messageLimit) * 100)) : 0

  const propertyLimit = currentPlan.properties
  const propertyUsed = usage?.properties || 0
  const propertyPercent = Math.min(100, Math.round((propertyUsed / propertyLimit) * 100))

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 border-b border-[rgba(108,92,231,0.08)] bg-[rgba(255,248,240,0.85)] backdrop-blur-[20px] sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
          <Link href="/dashboard" className="font-nunito text-lg sm:text-xl font-black no-underline flex items-center gap-2 flex-shrink-0">
            <LogoSVG className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-accent hidden sm:inline">Hey</span><span className="text-dark hidden sm:inline">Concierge</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-xs sm:text-sm text-dark hover:text-primary font-bold">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <h1 className="font-nunito text-2xl sm:text-4xl font-black mb-2">Billing & Usage</h1>
        <p className="text-sm sm:text-base text-muted mb-8">Manage your subscription and track usage</p>

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{currentPlan.emoji}</span>
                <h2 className="font-nunito text-2xl font-black">{currentPlan.name}</h2>
                <StatusBadge status={status} trialDays={trialDays} />
              </div>
              <p className="text-muted">
                {status === 'trialing'
                  ? `Free trial — ${trialDays} day${trialDays !== 1 ? 's' : ''} remaining`
                  : status === 'active'
                  ? 'Your subscription is active'
                  : status === 'cancelled'
                  ? 'Your subscription has been cancelled'
                  : 'Subscription inactive'}
              </p>
            </div>
            <div className="text-right">
              <div className="font-nunito text-3xl font-black text-dark">
                {currentPlan.price}<span className="text-base text-muted font-normal">{currentPlan.period}</span>
              </div>
              {!billing?.org?.stripeConnected && status === 'trialing' && (
                <p className="text-xs text-muted mt-1">No payment method added yet</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all"
            >
              {showPlans ? 'Hide Plans' : 'Change Plan'}
            </button>
            {status === 'active' && (
              <button
                onClick={() => alert('Stripe integration coming soon. Contact support to cancel.')}
                className="border-2 border-red-200 text-red-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-50 transition-all"
              >
                Cancel Subscription
              </button>
            )}
            {!billing?.org?.stripeConnected && (
              <button
                onClick={() => alert('Stripe payment setup coming soon.')}
                className="border-2 border-primary text-primary px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[rgba(108,92,231,0.05)] transition-all"
              >
                Add Payment Method
              </button>
            )}
          </div>
        </div>

        {/* Plan Selector */}
        {showPlans && (
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 mb-6 animate-slide-up">
            <h3 className="font-nunito text-xl font-black mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const isCurrent = plan.id === currentPlan.id
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-5 border-2 transition-all ${
                      isCurrent
                        ? 'border-primary bg-[rgba(108,92,231,0.03)]'
                        : 'border-[#E8E4FF] hover:border-primary hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{plan.emoji}</span>
                      <span className="font-nunito font-extrabold text-lg">{plan.name}</span>
                      {plan.popular && (
                        <span className="bg-primary text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                      )}
                    </div>
                    <div className="font-nunito font-black text-2xl text-dark mb-3">
                      {plan.price}<span className="text-sm text-muted font-normal">{plan.period}</span>
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted mb-4">
                      <li>Up to {plan.properties} properties</li>
                      <li>{plan.messages === -1 ? 'Unlimited' : plan.messages.toLocaleString()} messages/mo</li>
                    </ul>
                    {isCurrent ? (
                      <div className="text-center text-sm font-bold text-primary py-2">Current Plan</div>
                    ) : (
                      <button
                        onClick={() => alert('Stripe integration coming soon. Contact support to change plans.')}
                        className="w-full bg-[rgba(108,92,231,0.1)] text-primary py-2 rounded-lg font-bold text-sm hover:bg-[rgba(108,92,231,0.2)] transition-all"
                      >
                        {PLANS.indexOf(plan) > PLANS.indexOf(currentPlan) ? 'Upgrade' : 'Downgrade'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Usage Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Messages */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-muted">Messages</span>
              <span className="text-2xl">💬</span>
            </div>
            <div className="font-nunito text-3xl font-black text-dark mb-1">
              {messageUsed.toLocaleString()}
            </div>
            <div className="text-xs text-muted mb-3">
              of {messageLimit === -1 ? 'unlimited' : messageLimit.toLocaleString()} this month
            </div>
            {messageLimit > 0 && (
              <div className="h-2 bg-[#E8E4FF] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    messagePercent >= 90 ? 'bg-accent' : messagePercent >= 70 ? 'bg-[#FDCB6E]' : 'bg-primary'
                  }`}
                  style={{ width: `${messagePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-muted">Properties</span>
              <span className="text-2xl">🏠</span>
            </div>
            <div className="font-nunito text-3xl font-black text-dark mb-1">
              {propertyUsed}
            </div>
            <div className="text-xs text-muted mb-3">
              of {propertyLimit} available
            </div>
            <div className="h-2 bg-[#E8E4FF] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  propertyPercent >= 90 ? 'bg-accent' : propertyPercent >= 70 ? 'bg-[#FDCB6E]' : 'bg-primary'
                }`}
                style={{ width: `${propertyPercent}%` }}
              />
            </div>
          </div>

          {/* Guests */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-muted">Guests</span>
              <span className="text-2xl">👤</span>
            </div>
            <div className="font-nunito text-3xl font-black text-dark mb-1">
              {(usage?.guests || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted mb-3">
              unique guests this month
            </div>
            <div className="text-xs text-muted">
              {usage?.period?.label || ''}
            </div>
          </div>
        </div>

        {/* Invoice History (Placeholder) */}
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-nunito text-xl font-black">Invoice History</h3>
          </div>

          {billing?.org?.stripeConnected ? (
            <p className="text-muted text-sm">Invoice history will appear here once Stripe is connected.</p>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-muted text-sm mb-1">No invoices yet</p>
              <p className="text-xs text-muted">
                Invoices will appear here after your trial ends and a payment method is added.
              </p>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <h3 className="font-nunito text-xl font-black mb-4">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted font-bold block mb-1">Organization</span>
              <span className="text-dark">{billing?.org?.name || '—'}</span>
            </div>
            <div>
              <span className="text-muted font-bold block mb-1">Email</span>
              <span className="text-dark">{billing?.org?.email || '—'}</span>
            </div>
            <div>
              <span className="text-muted font-bold block mb-1">Member Since</span>
              <span className="text-dark">
                {billing?.org?.createdAt
                  ? new Date(billing.org.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-muted font-bold block mb-1">Payment Method</span>
              <span className="text-dark">
                {billing?.org?.stripeConnected ? 'Connected via Stripe' : 'Not connected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, trialDays }: { status: string; trialDays: number }) {
  if (status === 'trialing') {
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
        trialDays <= 3 ? 'bg-red-100 text-red-600' : 'bg-[#FDCB6E33] text-[#E17055]'
      }`}>
        TRIAL {trialDays > 0 ? `• ${trialDays}d left` : '• Expired'}
      </span>
    )
  }
  if (status === 'active') {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-mint-soft text-mint-dark">ACTIVE</span>
  }
  if (status === 'cancelled') {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">CANCELLED</span>
  }
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{status.toUpperCase()}</span>
}
