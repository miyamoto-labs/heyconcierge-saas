'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface CustomerData {
  id: string
  name: string
  email?: string
  plan?: string
  subscription_status?: string
  trial_started_at?: string
  trial_ends_at?: string
  churned_at?: string
  stripe_customer_id?: string
  is_pilot?: boolean
  created_at: string
  trialDaysLeft: number
  propertyCount: number
}

interface StripeInfo {
  subscriptionId: string
  status: string
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  priceAmount: number | null
  effectiveAmount: number | null
  priceCurrency: string
  priceInterval: string
  discount: {
    couponId: string
    percentOff: number | null
    amountOff: number | null
    duration: string
    name: string | null
  } | null
}

const statusColors: Record<string, string> = {
  trialing: 'bg-amber-900/50 text-amber-300 border-amber-800',
  active: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  cancelled: 'bg-slate-700/50 text-slate-400 border-slate-600',
  churned: 'bg-red-900/50 text-red-400 border-red-800',
}

const PLANS = ['starter', 'professional', 'premium']

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [stripe, setStripe] = useState<StripeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editable fields
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPlan, setEditPlan] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Stripe actions
  const [pilotLoading, setPilotLoading] = useState(false)
  const [customPrice, setCustomPrice] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)
  const [discountPercent, setDiscountPercent] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch customer')
      }
      const data = await res.json()
      setCustomer(data.customer)
      setStripe(data.stripe)
      setEditName(data.customer.name || '')
      setEditEmail(data.customer.email || '')
      setEditPlan(data.customer.plan || 'starter')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          plan: editPlan,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setSaveMessage('Saved successfully')
      fetchCustomer()
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSubscriptionAction = async (action: string, extraParams: Record<string, any> = {}) => {
    setActionMessage(null)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraParams }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      setActionMessage(data.message || 'Done')
      fetchCustomer()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const handleTogglePilot = async () => {
    setPilotLoading(true)
    await handleSubscriptionAction(customer?.is_pilot ? 'remove_pilot' : 'set_pilot')
    setPilotLoading(false)
  }

  const handleUpdatePrice = async () => {
    const cents = Math.round(parseFloat(customPrice) * 100)
    if (isNaN(cents) || cents < 0) {
      setActionError('Please enter a valid price')
      return
    }
    setPriceLoading(true)
    await handleSubscriptionAction('update_price', { price_cents: cents })
    setPriceLoading(false)
    setCustomPrice('')
  }

  const handleApplyDiscount = async () => {
    const pct = parseInt(discountPercent)
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setActionError('Enter a discount between 1-100%')
      return
    }
    setDiscountLoading(true)
    await handleSubscriptionAction('apply_discount', { percent_off: pct })
    setDiscountLoading(false)
    setDiscountPercent('')
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl">
        <p className="text-slate-500 text-sm">Loading customer...</p>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {error || 'Customer not found'}
        </div>
        <Link href="/admin/customers" className="text-slate-400 hover:text-white text-sm transition-colors">
          &larr; Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/customers" className="text-slate-500 hover:text-white text-sm transition-colors mb-4 inline-block">
          &larr; Back to customers
        </Link>
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold">{customer.name}</h1>
            {customer.email && <p className="text-slate-400 text-sm mt-0.5">{customer.email}</p>}
          </div>
          {customer.subscription_status && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[customer.subscription_status] || statusColors.cancelled}`}>
              {customer.subscription_status}
            </span>
          )}
          {customer.is_pilot && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-800">
              Pilot
            </span>
          )}
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Created</p>
          <p className="text-white text-sm font-medium">
            {new Date(customer.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Plan</p>
          <p className="text-white text-sm font-medium capitalize">{customer.plan || '—'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Properties</p>
          <p className="text-white text-sm font-medium">{customer.propertyCount}</p>
        </div>
        {customer.subscription_status === 'trialing' && (
          <div className="bg-slate-900 border border-amber-800/50 rounded-xl p-4">
            <p className="text-amber-400 text-xs font-medium uppercase tracking-wider mb-1">Trial remaining</p>
            <p className="text-amber-300 text-lg font-bold">{customer.trialDaysLeft} days</p>
          </div>
        )}
        {customer.subscription_status !== 'trialing' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Stripe</p>
            <p className="text-sm font-medium">
              {customer.stripe_customer_id
                ? <span className="text-emerald-400">Connected</span>
                : <span className="text-slate-500">Not connected</span>
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit customer details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-medium mb-1.5">Plan</label>
          <select
            value={editPlan}
            onChange={e => setEditPlan(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {PLANS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saveMessage && (
            <span className={`text-xs ${saveMessage.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Stripe billing card */}
      {stripe && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Stripe Subscription</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Status</p>
              <p className="text-white text-sm font-medium capitalize">{stripe.status}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Base Price</p>
              <p className="text-white text-sm font-medium">
                {stripe.priceAmount !== null ? `$${(stripe.priceAmount / 100).toFixed(2)}/${stripe.priceInterval}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Effective Price</p>
              <p className={`text-sm font-medium ${stripe.discount ? 'text-emerald-400' : 'text-white'}`}>
                {stripe.effectiveAmount !== null
                  ? `$${(stripe.effectiveAmount / 100).toFixed(2)}/${stripe.priceInterval}`
                  : stripe.priceAmount !== null
                    ? `$${(stripe.priceAmount / 100).toFixed(2)}/${stripe.priceInterval}`
                    : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">
                {stripe.status === 'trialing' ? 'Trial ends' : 'Next billing'}
              </p>
              <p className="text-white text-sm font-medium">
                {stripe.currentPeriodEnd
                  ? new Date(stripe.currentPeriodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
                }
              </p>
            </div>
          </div>
          {stripe.discount && (
            <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-lg px-3 py-2 mb-2">
              <p className="text-emerald-400 text-xs font-medium">
                Active discount: {stripe.discount.percentOff ? `${stripe.discount.percentOff}% off` : `$${((stripe.discount.amountOff || 0) / 100).toFixed(2)} off`}
                {stripe.discount.name && <span className="text-emerald-500/70"> — {stripe.discount.name}</span>}
                {stripe.discount.duration && <span className="text-emerald-500/70"> ({stripe.discount.duration})</span>}
              </p>
            </div>
          )}
          {stripe.cancelAtPeriodEnd && (
            <p className="text-amber-400 text-xs mb-2">Subscription will cancel at end of current period</p>
          )}
        </div>
      )}

      {/* Stripe actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Billing Actions</h2>

        {/* Action feedback */}
        {actionMessage && (
          <div className="mb-4 bg-emerald-950 border border-emerald-800 text-emerald-400 text-sm rounded-lg px-4 py-2.5">
            {actionMessage}
          </div>
        )}
        {actionError && (
          <div className="mb-4 bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-2.5">
            {actionError}
          </div>
        )}

        <div className="space-y-5">
          {/* Pilot toggle */}
          <div className="flex items-center justify-between py-3 border-b border-slate-800/50">
            <div>
              <p className="text-white text-sm font-medium">Pilot Customer</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {customer.is_pilot
                  ? 'This customer is a pilot — Stripe price set to $0'
                  : 'Mark as pilot to set Stripe price to $0'
                }
              </p>
            </div>
            <button
              onClick={handleTogglePilot}
              disabled={pilotLoading}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                customer.is_pilot
                  ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70 border border-red-800'
                  : 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/70 border border-purple-800'
              }`}
            >
              {pilotLoading
                ? 'Updating...'
                : customer.is_pilot ? 'Remove pilot status' : 'Mark as pilot'
              }
            </button>
          </div>

          {/* Custom price */}
          <div className="flex items-end gap-3 py-3 border-b border-slate-800/50">
            <div className="flex-1">
              <p className="text-white text-sm font-medium mb-2">Custom Monthly Price</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 99.00"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-slate-500 text-xs">/month</span>
              </div>
            </div>
            <button
              onClick={handleUpdatePrice}
              disabled={priceLoading || !customPrice}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {priceLoading ? 'Updating...' : 'Update price'}
            </button>
          </div>

          {/* Discount */}
          <div className="flex items-end gap-3 py-3">
            <div className="flex-1">
              <p className="text-white text-sm font-medium mb-2">Apply Discount</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 20"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-slate-500 text-sm">% off forever</span>
              </div>
            </div>
            <button
              onClick={handleApplyDiscount}
              disabled={discountLoading || !discountPercent}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {discountLoading ? 'Applying...' : 'Apply discount'}
            </button>
          </div>
        </div>

        {!customer.stripe_customer_id && (
          <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
            <p className="text-slate-400 text-xs">
              This customer has no Stripe customer ID. Price and discount actions require an active Stripe subscription.
              Pilot status can still be toggled (DB only).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
