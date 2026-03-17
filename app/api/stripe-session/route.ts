import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getStripe } from '@/lib/stripe'
import { getPlanFromPriceId } from '@/lib/stripe/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    // Extract IDs — expanded objects need .id, unexpanded are already strings
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null

    // Extract plan and quantity from subscription
    let plan: string | null = session.metadata?.plan || null
    let quantity = 1
    if (typeof session.subscription === 'object' && session.subscription) {
      const sub = session.subscription
      const item = sub.items?.data?.[0]
      if (item) {
        quantity = item.quantity || 1
        const priceId = typeof item.price === 'string' ? item.price : item.price?.id
        if (priceId && !plan) {
          plan = getPlanFromPriceId(priceId)
        }
      }
    }

    return NextResponse.json({
      customerId,
      subscriptionId,
      plan,
      quantity,
      status: session.status,
      paymentStatus: session.payment_status,
    })
  } catch (error) {
    console.error('Stripe session retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
