'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLAN_EMOJIS: Record<string, string> = {
  starter: '🌱',
  professional: '⚡',
  premium: '👑',
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [showPlans, setShowPlans] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const [billingRes, usageRes] = await Promise.all([
          fetch('/api/billing/current'),
          fetch('/api/billing/usage'),
        ])

        if (billingRes.ok) setBilling(await billingRes.json())
        if (usageRes.ok) setUsage(await usageRes.json())
      } catch (err) {
        console.error('Billing load error:', err)
      }
      setLoading(false)
    }
    loadBilling()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-grove border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const currentPlanId = billing?.org?.plan || 'starter'
  const planList = billing?.plans || []
  const currentPlan = planList.find((p: any) => p.code === currentPlanId) || planList[0] || { code: 'starter', name: 'Starter', displayPrice: '$0' }
  const status = billing?.org?.status || 'trialing'
  const trialDays = billing?.org?.trialDaysLeft || 0
  const quantity = billing?.billing?.quantity || 0
  const monthlyTotal = billing?.billing?.displayMonthlyTotal || '$0'
  const cancelAtPeriodEnd = billing?.org?.cancelAtPeriodEnd || false

  const messageUsed = usage?.messages || 0
  const propertyCount = usage?.properties || 0
  const guestCount = usage?.guests || 0

  // Has an actual Stripe subscription (not just a customer ID from a past attempt)
  const hasSubscription = !!billing?.org?.hasSubscription

  const handleChoosePlan = async (plan: string) => {
    setChangingPlan(plan)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, propertyCount: Math.max(1, quantity), returnUrl: '/billing' }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
    }
    setChangingPlan(null)
  }

  const handleChangePlan = async (newPlan: string) => {
    if (newPlan === currentPlanId) return
    setChangingPlan(newPlan)
    try {
      const res = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to change plan')
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
    }
    setChangingPlan(null)
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setShowCancelConfirm(false)
        if (data.accessUntil) {
          alert(`Subscription cancelled. You have access until ${new Date(data.accessUntil).toLocaleDateString()}.`)
        }
        window.location.reload()
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
    }
    setCancelling(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 border-b border-earth-border bg-white/90 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/dashboard" className="text-lg sm:text-xl font-bold no-underline flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-grove rounded-lg flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" /><path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" /><rect x="5" y="17" width="22" height="4" rx="1.5" /></svg></div>
            <span className="font-serif text-earth-dark hidden sm:inline">HeyConcierge</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-xs sm:text-sm text-earth-muted hover:text-earth-dark font-medium no-underline">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-earth-dark mb-2">Billing & Usage</h1>
        <p className="text-sm sm:text-base text-earth-muted mb-8">Manage your subscription and track usage</p>

        {/* Current Plan Card */}
        <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-semibold text-earth-dark">{currentPlan.name}</h2>
                <StatusBadge status={status} trialDays={trialDays} cancelAtPeriodEnd={cancelAtPeriodEnd} />
              </div>
              <p className="text-earth-muted text-sm">
                {!hasSubscription
                  ? 'No active subscription — choose a plan to get started'
                  : cancelAtPeriodEnd
                  ? `Cancels ${billing?.org?.currentPeriodEnd ? new Date(billing.org.currentPeriodEnd).toLocaleDateString() : 'at period end'}`
                  : status === 'trialing'
                  ? `Free trial — ${trialDays} day${trialDays !== 1 ? 's' : ''} remaining`
                  : status === 'active'
                  ? `${quantity} ${quantity === 1 ? 'property' : 'properties'} active`
                  : status === 'past_due'
                  ? 'Payment failed — please update your payment method'
                  : 'Subscription inactive'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-earth-dark">
                NOK {currentPlan.displayPrice}<span className="text-sm text-earth-muted font-normal">/property/mth</span>
              </div>
              {quantity > 0 && (
                <p className="text-sm text-earth-muted mt-1">
                  {quantity} {quantity === 1 ? 'property' : 'properties'} = <span className="font-semibold text-earth-text">{monthlyTotal}/mth</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="bg-grove hover:bg-grove-dark text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:-translate-y-0.5 transition-all"
            >
              {showPlans ? 'Hide Plans' : hasSubscription ? 'Change Plan' : 'Choose a Plan'}
            </button>
            {hasSubscription && !cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="border border-red-200 text-red-500 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-50 transition-all"
              >
                Cancel Subscription
              </button>
            )}
          </div>

          {/* Cancel Confirmation Dialog */}
          {showCancelConfirm && (
            <div className="mt-4 border border-red-200 rounded-xl p-5 bg-red-50">
              <h4 className="font-semibold text-red-700 text-base mb-2">Are you sure?</h4>
              <p className="text-sm text-red-600 mb-4">
                {status === 'trialing'
                  ? 'Your trial will be cancelled immediately and you will lose access.'
                  : 'Your subscription will be cancelled at the end of the current billing period. You keep access until then. No refunds for time already paid.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="border border-earth-border text-earth-text px-5 py-2 rounded-lg font-semibold text-sm hover:bg-grove-subtle transition-all"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Plan Selector */}
        {showPlans && (
          <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8 mb-6">
            <h3 className="font-serif text-xl text-earth-dark mb-1">Available Plans</h3>
            <p className="text-sm text-earth-muted mb-4">
              Price is per property per month. You currently have {quantity} {quantity === 1 ? 'property' : 'properties'}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {planList.map((plan: any, idx: number) => {
                const isCurrent = plan.code === currentPlanId
                const isUpgrade = idx > planList.findIndex((p: any) => p.code === currentPlanId)
                const priceNum = plan.pricePerProperty / 100
                const estimatedTotal = priceNum * Math.max(1, quantity)
                return (
                  <div
                    key={plan.code}
                    className={`rounded-xl p-5 border transition-all ${
                      isCurrent
                        ? 'border-grove bg-grove-subtle'
                        : 'border-earth-border hover:border-grove hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-earth-dark">{plan.name}</span>
                      {plan.popular && (
                        <span className="bg-grove text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                      )}
                    </div>
                    <div className="font-bold text-earth-dark text-xl mb-1">
                      NOK {plan.displayPrice}<span className="text-sm text-earth-muted font-normal">/property/mth</span>
                    </div>
                    {quantity > 0 && (
                      <p className="text-xs text-earth-muted mb-3">
                        {quantity} {quantity === 1 ? 'property' : 'properties'} = NOK {estimatedTotal}/mth
                      </p>
                    )}
                    {hasSubscription && isCurrent ? (
                      <div className="text-center text-sm font-semibold text-grove py-2">Current Plan</div>
                    ) : (
                      <button
                        onClick={() => hasSubscription ? handleChangePlan(plan.code) : handleChoosePlan(plan.code)}
                        disabled={changingPlan === plan.code}
                        className="w-full bg-grove-subtle text-grove py-2 rounded-lg font-semibold text-sm hover:bg-grove/20 transition-all disabled:opacity-50"
                      >
                        {changingPlan === plan.code
                          ? hasSubscription ? 'Changing...' : 'Redirecting...'
                          : hasSubscription
                            ? (isUpgrade ? 'Upgrade' : 'Downgrade')
                            : 'Choose Plan'}
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
          <div className="bg-white rounded-xl border border-earth-border p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-earth-muted">Properties</span>
              <div className="w-8 h-8 bg-grove-subtle rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-earth-dark mb-0.5">{propertyCount}</div>
            <div className="text-xs text-earth-muted">
              billable {propertyCount === 1 ? 'property' : 'properties'}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-earth-border p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-earth-muted">Messages</span>
              <div className="w-8 h-8 bg-grove-subtle rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-earth-dark mb-0.5">{messageUsed.toLocaleString()}</div>
            <div className="text-xs text-earth-muted">AI responses this month</div>
          </div>

          <div className="bg-white rounded-xl border border-earth-border p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-earth-muted">Guests</span>
              <div className="w-8 h-8 bg-grove-subtle rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-earth-dark mb-0.5">{guestCount.toLocaleString()}</div>
            <div className="text-xs text-earth-muted">unique guests this month</div>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8 mb-6">
          <h3 className="font-serif text-xl text-earth-dark mb-4">Invoice History</h3>

          {billing?.invoices?.length > 0 ? (
            <div className="divide-y divide-earth-border">
              {billing.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-earth-text text-sm">{inv.number || inv.id}</span>
                    <span className="text-xs text-earth-muted ml-3">
                      {new Date(inv.created * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600'
                        : inv.status === 'open' ? 'bg-amber-50 text-amber-600'
                        : 'bg-grove-subtle text-earth-muted'
                    }`}>
                      {inv.status?.toUpperCase()}
                    </span>
                    <span className="font-semibold text-earth-text text-sm">
                      ${(inv.amount / 100).toFixed(2)} {inv.currency?.toUpperCase()}
                    </span>
                    {inv.hostedUrl && (
                      <a
                        href={inv.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-grove text-xs font-semibold hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-grove-subtle rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-grove"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-earth-muted text-sm">No invoices yet</p>
              <p className="text-xs text-earth-light mt-1">
                {status === 'trialing'
                  ? 'Your first invoice will be generated when the trial ends.'
                  : 'Invoices will appear here after payments are processed.'}
              </p>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-earth-border p-6 sm:p-8">
          <h3 className="font-serif text-xl text-earth-dark mb-4">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-earth-muted font-medium block mb-1">Organization</span>
              <span className="text-earth-text">{billing?.org?.name || '—'}</span>
            </div>
            <div>
              <span className="text-earth-muted font-medium block mb-1">Email</span>
              <span className="text-earth-text">{billing?.org?.email || '—'}</span>
            </div>
            <div>
              <span className="text-earth-muted font-medium block mb-1">Member Since</span>
              <span className="text-earth-text">
                {billing?.org?.createdAt
                  ? new Date(billing.org.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-earth-muted font-medium block mb-1">Payment Method</span>
              <span className="text-earth-text">
                {billing?.org?.stripeConnected ? 'Connected via Stripe' : 'Not connected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, trialDays, cancelAtPeriodEnd }: { status: string; trialDays: number; cancelAtPeriodEnd: boolean }) {
  if (cancelAtPeriodEnd) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">CANCELLING</span>
  }
  if (status === 'trialing') {
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        trialDays <= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'
      }`}>
        TRIAL {trialDays > 0 ? `• ${trialDays}d left` : '• Expired'}
      </span>
    )
  }
  if (status === 'active') {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">ACTIVE</span>
  }
  if (status === 'past_due') {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">PAST DUE</span>
  }
  if (status === 'cancelled') {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">CANCELLED</span>
  }
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-grove-subtle text-earth-muted">{status.toUpperCase()}</span>
}
