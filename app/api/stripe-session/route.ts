import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    return NextResponse.json({
      customerId: session.customer,
      subscriptionId: session.subscription,
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
