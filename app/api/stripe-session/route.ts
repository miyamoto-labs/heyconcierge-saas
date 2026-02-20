import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/auth/require-auth'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover' as any,
  })
}

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

    return NextResponse.json({
      customerId,
      subscriptionId,
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
