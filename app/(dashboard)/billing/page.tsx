'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoSVG from '@/components/brand/LogoSVG'
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

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: '$49', features: ['1 property', 'AI guest support', 'Basic analytics'] },
  professional: { name: 'Professional', price: '$149', features: ['5 properties', 'Priority support', 'Advanced analytics', 'Custom branding'] },
  premium: { name: 'Premium', price: '$299', features: ['Unlimited properties', '24/7 support', 'White-label', 'API access'] },
}

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    const email = getCookie('user_email')
    const id = getCookie('user_id')
    
    if (!email || !id) {
      router.push('/login')
      return
    }
    
    setUserEmail(email)
    loadOrganization(email)
  }, [router])

  const loadOrganization = async (email: string) => {
    setLoading(true)
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', email)
        .single()

      setOrganization(org)
    } catch (error) {
      console.error('Failed to load organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!organization?.stripe_customer_id) {
      setCancelError('No active subscription found')
      return
    }

    setCancelling(true)
    setCancelError(null)

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          customerId: organization.stripe_customer_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Reload organization data
      await loadOrganization(userEmail!)
      setShowCancelModal(false)
      alert('Subscription cancelled successfully. You will have access until the end of your billing period.')
    } catch (error) {
      console.error('Cancel error:', error)
      setCancelError(error instanceof Error ? error.message : 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'user_id=; path=/; max-age=0'
    document.cookie = 'user_email=; path=/; max-age=0'
    document.cookie = 'user_name=; path=/; max-age=0'
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LogoSVG className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const plan = organization?.plan || 'starter'
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.starter
  const subscriptionStatus = organization?.subscription_status || 'unknown'
  const trialEndsAt = organization?.trial_ends_at ? new Date(organization.trial_ends_at) : null
  const isTrialing = subscriptionStatus === 'trialing'
  const isCancelled = subscriptionStatus === 'cancelled'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline">
            <LogoSVG className="w-10 h-10" />
            <span className="font-nunito font-bold text-xl text-gray-900">HeyConcierge</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-nunito font-extrabold text-4xl text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-nunito font-bold text-2xl text-gray-900 mb-2">
                {planDetails.name} Plan
              </h2>
              <p className="text-3xl font-bold text-blue-600">{planDetails.price}<span className="text-lg text-gray-500">/month</span></p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isTrialing ? 'bg-green-100 text-green-700' :
                isCancelled ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {isTrialing ? '🎉 Free Trial' : isCancelled ? '⚠️ Cancelled' : '✓ Active'}
              </span>
              {isTrialing && trialEndsAt && (
                <span className="text-sm text-gray-600">
                  Trial ends {trialEndsAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Plan Features:</h3>
            <ul className="space-y-2">
              {planDetails.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {!isCancelled && organization?.stripe_customer_id && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          )}

          {isCancelled && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600 mb-4">
                Your subscription has been cancelled. You will have access until the end of your current billing period.
              </p>
              <Link
                href="/signup?step=4"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors no-underline"
              >
                Reactivate Subscription
              </Link>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold no-underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="font-nunito font-bold text-2xl text-gray-900 mb-4">
              Cancel Subscription?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period.
            </p>

            {cancelError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{cancelError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelError(null)
                }}
                disabled={cancelling}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
