import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) return NextResponse.json({ error: 'No STRIPE_SECRET_KEY set' })
    const res = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: { 'Authorization': `Bearer ${key}` }
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, product: data.data?.[0]?.name, keyPrefix: key.substring(0, 12) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
