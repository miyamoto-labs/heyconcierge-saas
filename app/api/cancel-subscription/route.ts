import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user || !org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!org.stripe_subscription_id) {
      // Fallback: try to find subscription via customer ID
      if (!org.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
      }

      const stripe = getStripe()
      const subs = await stripe.subscriptions.list({
        customer: org.stripe_customer_id,
        status: 'all',
        limit: 5,
      })

      const activeSub = subs.data.find(s =>
        ['active', 'trialing'].includes(s.status)
      )

      if (!activeSub) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
      }

      // Use this subscription
      org.stripe_subscription_id = activeSub.id
    }

    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

    if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
      return NextResponse.json({ error: 'Subscription is already cancelled' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (subscription.status === 'trialing') {
      // Trial: cancel immediately
      await stripe.subscriptions.cancel(subscription.id)

      await supabase
        .from('organizations')
        .update({
          subscription_status: 'cancelled',
          churned_at: new Date().toISOString(),
          cancel_at_period_end: false,
        })
        .eq('id', org.id)

      return NextResponse.json({
        success: true,
        message: 'Trial subscription cancelled immediately.',
        immediate: true,
      })
    }

    // Active subscription: cancel at period end (no refund, paid is paid)
    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    }) as any

    // Update local state — webhook will confirm final cancellation
    await supabase
      .from('organizations')
      .update({
        cancel_at_period_end: true,
      })
      .eq('id', org.id)

    const periodEnd = updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period.',
      immediate: false,
      accessUntil: periodEnd,
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
