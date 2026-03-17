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
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
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
    <div className="min-h-screen bg-[#FDFCFA]">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-[12px] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/dashboard" className="font-nunito text-lg sm:text-xl font-black no-underline flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4c-1 0-1.5 1-1.5 2v1h3V6c0-1-.5-2-1.5-2z" /><path d="M7 14c0-5 4-9 9-9s9 4 9 9v1H7v-1z" /><rect x="5" y="17" width="22" height="4" rx="1.5" /></svg></div>
            <span className="text-slate-800 hidden sm:inline">Hey<span className="text-primary">Concierge</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-xs sm:text-sm text-slate-800 hover:text-primary font-bold">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <h1 className="font-nunito text-2xl sm:text-4xl font-black mb-2">Billing & Usage</h1>
        <p className="text-sm sm:text-base text-slate-500 mb-8">Manage your subscription and track usage</p>

        {/* Current Plan Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{PLAN_EMOJIS[currentPlan.code] || '📦'}</span>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{currentPlan.name}</h2>
                <StatusBadge status={status} trialDays={trialDays} cancelAtPeriodEnd={cancelAtPeriodEnd} />
              </div>
              <p className="text-slate-500">
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
              <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {currentPlan.displayPrice}<span className="text-base text-slate-500 font-normal">/property/mo</span>
              </div>
              {quantity > 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  {quantity} {quantity === 1 ? 'property' : 'properties'} = <span className="font-bold text-slate-700">{monthlyTotal}/mo</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm hover:-translate-y-0.5 transition-all"
            >
              {showPlans ? 'Hide Plans' : hasSubscription ? 'Change Plan' : 'Choose a Plan'}
            </button>
            {hasSubscription && !cancelAtPeriodEnd && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="border-2 border-red-200 text-red-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-50 transition-all"
              >
                Cancel Subscription
              </button>
            )}
          </div>

          {/* Cancel Confirmation Dialog */}
          {showCancelConfirm && (
            <div className="mt-4 border-2 border-red-200 rounded-2xl p-5 bg-red-50">
              <h4 className="font-bold text-red-700 text-lg mb-2">Are you sure?</h4>
              <p className="text-sm text-red-600 mb-4">
                {status === 'trialing'
                  ? 'Your trial will be cancelled immediately and you will lose access.'
                  : 'Your subscription will be cancelled at the end of the current billing period. You keep access until then. No refunds for time already paid.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="border-2 border-gray-200 text-gray-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Plan Selector */}
        {showPlans && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 mb-6 animate-slide-up">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">Available Plans</h3>
            <p className="text-sm text-slate-500 mb-4">
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
                    className={`rounded-2xl p-5 border-2 transition-all ${
                      isCurrent
                        ? 'border-primary bg-[rgba(108,92,231,0.03)]'
                        : 'border-slate-200 hover:border-primary hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{PLAN_EMOJIS[plan.code] || '📦'}</span>
                      <span className="font-semibold text-lg">{plan.name}</span>
                      {plan.popular && (
                        <span className="bg-primary text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                      )}
                    </div>
                    <div className="font-bold text-slate-800 text-2xl mb-1">
                      {plan.displayPrice}<span className="text-sm text-slate-500 font-normal">/property/mo</span>
                    </div>
                    {quantity > 0 && (
                      <p className="text-xs text-slate-500 mb-3">
                        {quantity} {quantity === 1 ? 'property' : 'properties'} = ${estimatedTotal}/mo
                      </p>
                    )}
                    {hasSubscription && isCurrent ? (
                      <div className="text-center text-sm font-bold text-primary py-2">Current Plan</div>
                    ) : (
                      <button
                        onClick={() => hasSubscription ? handleChangePlan(plan.code) : handleChoosePlan(plan.code)}
                        disabled={changingPlan === plan.code}
                        className="w-full bg-primary/[0.08] text-primary py-2 rounded-lg font-bold text-sm hover:bg-primary/[0.14] transition-all disabled:opacity-50"
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
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-500">Properties</span>
              <span className="text-2xl">🏠</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">{propertyCount}</div>
            <div className="text-xs text-slate-500">
              billable {propertyCount === 1 ? 'property' : 'properties'}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-500">Messages</span>
              <span className="text-2xl">💬</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">{messageUsed.toLocaleString()}</div>
            <div className="text-xs text-slate-500">AI responses this month</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-500">Guests</span>
              <span className="text-2xl">👤</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">{guestCount.toLocaleString()}</div>
            <div className="text-xs text-slate-500">unique guests this month</div>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 mb-6">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-4">Invoice History</h3>

          {billing?.invoices?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {billing.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium text-slate-800 text-sm">{inv.number || inv.id}</span>
                    <span className="text-xs text-slate-500 ml-3">
                      {new Date(inv.created * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700'
                        : inv.status === 'open' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {inv.status?.toUpperCase()}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      ${(inv.amount / 100).toFixed(2)} {inv.currency?.toUpperCase()}
                    </span>
                    {inv.hostedUrl && (
                      <a
                        href={inv.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs font-bold hover:underline"
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
              <div className="text-3xl mb-2">📄</div>
              <p className="text-slate-500 text-sm">No invoices yet</p>
              <p className="text-xs text-slate-400 mt-1">
                {status === 'trialing'
                  ? 'Your first invoice will be generated when the trial ends.'
                  : 'Invoices will appear here after payments are processed.'}
              </p>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-4">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-bold block mb-1">Organization</span>
              <span className="text-slate-800">{billing?.org?.name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1">Email</span>
              <span className="text-slate-800">{billing?.org?.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1">Member Since</span>
              <span className="text-slate-800">
                {billing?.org?.createdAt
                  ? new Date(billing.org.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1">Payment Method</span>
              <span className="text-slate-800">
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
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">CANCELLING</span>
  }
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
  if (status === 'past_due') {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">PAST DUE</span>
  }
  if (status === 'cancelled') {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">CANCELLED</span>
  }
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{status.toUpperCase()}</span>
}
