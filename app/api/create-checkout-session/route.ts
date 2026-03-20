import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { PLANS, TRIAL_PERIOD_DAYS, getStripePriceId, type PlanCode } from '@/lib/stripe/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, propertyCount, returnUrl } = await request.json()

    if (!plan || !PLANS[plan as PlanCode]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const priceId = getStripePriceId(plan as PlanCode)

    // Quantity = number of billable properties (minimum 1)
    const quantity = Math.max(1, propertyCount || 1)

    // Check if user already has a Stripe customer ID
    const supabase = createAdminClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('auth_user_id', user.id)
      .single()

    // Build checkout session options
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: {
          plan,
          initial_quantity: String(quantity),
        },
      },
      success_url: returnUrl
        ? `${request.headers.get('origin')}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
        : `${request.headers.get('origin')}/signup?step=6&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl
        ? `${request.headers.get('origin')}${returnUrl}`
        : `${request.headers.get('origin')}/signup?step=5`,
      metadata: {
        plan,
      },
    }

    // Reuse existing Stripe customer or set email for new customer
    if (org?.stripe_customer_id) {
      sessionParams.customer = org.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email || undefined
    }

    const session = await getStripe().checkout.sessions.create(sessionParams)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
