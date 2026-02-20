import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/auth/require-auth'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover' as any,
  })
}

// Plan pricing (in cents)
const PLAN_PRICES = {
  starter: 4900, // $49
  professional: 14900, // $149
  premium: 29900, // $299
}

const PLAN_NAMES = {
  starter: 'HeyConcierge Starter',
  professional: 'HeyConcierge Professional',
  premium: 'HeyConcierge Premium',
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, propertyId } = await request.json()

    if (!plan || !PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const priceInCents = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
    const planName = PLAN_NAMES[plan as keyof typeof PLAN_NAMES]

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      customer_email: user.email || undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: '14-day free trial included',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${request.headers.get('origin')}/signup?step=5&session_id={CHECKOUT_SESSION_ID}${propertyId ? `&propertyId=${propertyId}` : ''}`,
      cancel_url: `${request.headers.get('origin')}/signup?step=4`,
      metadata: {
        plan,
        propertyId: propertyId || '',
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
