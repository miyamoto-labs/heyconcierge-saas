import { NextRequest, NextResponse } from 'next/server'

const PLANS: Record<string, { priceAmount: number; name: string }> = {
  pro: { priceAmount: 2900, name: 'AgentForge Pro' },
  team: { priceAmount: 7900, name: 'AgentForge Team' },
}

async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json()
    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!userId || !email) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 })
    }

    const { priceAmount, name } = PLANS[plan]
    const origin = req.headers.get('origin') || 'https://agent-builder-gamma.vercel.app'

    const session = await stripePost('checkout/sessions', {
      'mode': 'subscription',
      'customer_email': email,
      'metadata[userId]': userId,
      'metadata[plan]': plan,
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': name,
      'line_items[0][price_data][unit_amount]': String(priceAmount),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][quantity]': '1',
      'success_url': `${origin}/pricing?success=true`,
      'cancel_url': `${origin}/pricing?canceled=true`,
    })

    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 400 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
