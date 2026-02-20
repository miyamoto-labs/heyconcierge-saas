import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover' as any,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user || !org) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { organizationId, customerId } = await request.json()

    if (!organizationId || !customerId) {
      return NextResponse.json(
        { error: 'Missing organizationId or customerId' },
        { status: 400 }
      )
    }

    // Get all active subscriptions for this customer
    const subscriptions = await getStripe().subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    })

    if (subscriptions.data.length === 0) {
      // Also check for trialing subscriptions
      const trialingSubscriptions = await getStripe().subscriptions.list({
        customer: customerId,
        status: 'trialing',
        limit: 10,
      })

      if (trialingSubscriptions.data.length === 0) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        )
      }

      // Cancel trialing subscription
      const subscription = trialingSubscriptions.data[0]
      await getStripe().subscriptions.cancel(subscription.id)

      // Update organization status
      await supabase
        .from('organizations')
        .update({
          subscription_status: 'cancelled',
          churned_at: new Date().toISOString(),
        })
        .eq('id', organizationId)

      return NextResponse.json({
        success: true,
        message: 'Trial subscription cancelled',
      })
    }

    // Cancel the subscription at period end (user keeps access until paid period ends)
    const subscription = subscriptions.data[0]
    const cancelledSubscription = await getStripe().subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    // Update organization status
    await supabase
      .from('organizations')
      .update({
        subscription_status: 'cancelled',
        churned_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      },
      { status: 500 }
    )
  }
}
