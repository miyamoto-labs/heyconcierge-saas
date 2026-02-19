import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { organizationId, customerId } = await request.json()

    if (!organizationId || !customerId) {
      return NextResponse.json(
        { error: 'Missing organizationId or customerId' },
        { status: 400 }
      )
    }

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    })

    if (subscriptions.data.length === 0) {
      // Also check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
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
      await stripe.subscriptions.cancel(subscription.id)

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
    const cancelledSubscription = await stripe.subscriptions.update(subscription.id, {
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
      endsAt: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
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
