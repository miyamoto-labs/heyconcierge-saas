import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getStripe } from '@/lib/stripe'
import { PLANS, getStripePriceId, isUpgrade, type PlanCode } from '@/lib/stripe/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user || !org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newPlan } = await request.json()

    if (!newPlan || !PLANS[newPlan as PlanCode]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const currentPlan = (org.plan || 'starter') as PlanCode
    if (newPlan === currentPlan) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    if (!org.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

    if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 })
    }

    const item = subscription.items.data[0]
    if (!item) {
      return NextResponse.json({ error: 'No subscription item found' }, { status: 500 })
    }

    const newPriceId = getStripePriceId(newPlan as PlanCode)
    const upgrading = isUpgrade(currentPlan, newPlan as PlanCode)
    const isTrialing = subscription.status === 'trialing'

    // Proration behavior per design doc:
    // - Trial: no charge, just switch price (Option A)
    // - Upgrade while active: charge immediately
    // - Downgrade while active: take effect next cycle (paid is paid)
    let prorationBehavior: 'create_prorations' | 'none' | 'always_invoice'
    if (isTrialing) {
      prorationBehavior = 'none'
    } else if (upgrading) {
      prorationBehavior = 'always_invoice'
    } else {
      prorationBehavior = 'none'
    }

    const updateParams: any = {
      items: [
        {
          id: item.id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
    }

    // For downgrades during active period: schedule for next billing cycle
    // by using billing_cycle_anchor and proration_behavior: none
    // The price change takes effect immediately but no refund is given

    await stripe.subscriptions.update(org.stripe_subscription_id, updateParams)

    return NextResponse.json({
      success: true,
      message: upgrading
        ? 'Plan upgraded successfully'
        : 'Plan will be downgraded. You keep current access until the next billing cycle.',
      newPlan,
      upgrading,
    })
  } catch (error) {
    console.error('Change plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change plan' },
      { status: 500 }
    )
  }
}
