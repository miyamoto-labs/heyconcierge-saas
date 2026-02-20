import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover' as any,
  })
}

const PLAN_PRICES: Record<string, number> = {
  starter: 4900,
  professional: 14900,
  premium: 29900,
}

// PATCH — Stripe subscription management actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = session.admin_users as { id: string; role: string }
    if (!['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    const supabase = getAdminSupabase()
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, plan, stripe_customer_id, is_pilot')
      .eq('id', params.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const stripe = getStripe()

    // Helper: get active subscription for this customer
    const getSubscription = async () => {
      if (!org.stripe_customer_id) return null

      const subs = await stripe.subscriptions.list({
        customer: org.stripe_customer_id,
        limit: 1,
        expand: ['data.items.data.price', 'data.discounts'],
      })

      return subs.data.length > 0 ? subs.data[0] : null
    }

    switch (action) {
      case 'set_pilot': {
        const subscription = await getSubscription()

        if (subscription) {
          // Apply a 100% discount coupon via discounts array (flexible billing mode)
          const coupon = await stripe.coupons.create({
            percent_off: 100,
            duration: 'forever',
            name: `Pilot: ${org.name}`.slice(0, 40),
          })

          await stripe.subscriptions.update(subscription.id, {
            discounts: [{ coupon: coupon.id }],
          } as any)
        }

        await supabase
          .from('organizations')
          .update({ is_pilot: true })
          .eq('id', org.id)

        return NextResponse.json({
          success: true,
          message: subscription
            ? 'Pilot status set, 100% discount applied'
            : 'Pilot status set (no Stripe subscription to update)',
        })
      }

      case 'remove_pilot': {
        const subscription = await getSubscription()

        if (subscription) {
          // Clear all discounts from the subscription
          await stripe.subscriptions.update(subscription.id, {
            discounts: [],
          } as any)
        }

        await supabase
          .from('organizations')
          .update({ is_pilot: false })
          .eq('id', org.id)

        return NextResponse.json({
          success: true,
          message: subscription
            ? 'Pilot status removed, discount cleared — standard price restored'
            : 'Pilot status removed (no Stripe subscription to update)',
        })
      }

      case 'update_price': {
        const { price_cents } = body
        if (typeof price_cents !== 'number' || price_cents < 0) {
          return NextResponse.json({ error: 'Invalid price_cents value' }, { status: 400 })
        }

        const subscription = await getSubscription()
        if (!subscription) {
          return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 404 })
        }

        // Calculate discount as amount_off from the current base price
        const currentPrice = subscription.items.data[0]?.price?.unit_amount ?? 0
        const discountAmount = currentPrice - price_cents

        if (discountAmount <= 0) {
          // New price is >= current price — remove any existing discounts
          await stripe.subscriptions.update(subscription.id, {
            discounts: [],
          } as any)
          return NextResponse.json({
            success: true,
            message: `Discounts removed — price is $${(currentPrice / 100).toFixed(2)}/mo`,
          })
        }

        // Apply a fixed-amount coupon for the difference
        const coupon = await stripe.coupons.create({
          amount_off: discountAmount,
          currency: 'usd',
          duration: 'forever',
          name: `$${(price_cents / 100).toFixed(2)}/mo ${org.name}`.slice(0, 40),
        })

        await stripe.subscriptions.update(subscription.id, {
          discounts: [{ coupon: coupon.id }],
        } as any)

        return NextResponse.json({
          success: true,
          message: `Effective price set to $${(price_cents / 100).toFixed(2)}/mo (discount of $${(discountAmount / 100).toFixed(2)})`,
        })
      }

      case 'apply_discount': {
        const { percent_off } = body
        if (typeof percent_off !== 'number' || percent_off < 1 || percent_off > 100) {
          return NextResponse.json({ error: 'percent_off must be between 1 and 100' }, { status: 400 })
        }

        const subscription = await getSubscription()
        if (!subscription) {
          return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 404 })
        }

        const coupon = await stripe.coupons.create({
          percent_off,
          duration: 'forever',
          name: `${percent_off}% off ${org.name}`.slice(0, 40),
        })

        await stripe.subscriptions.update(subscription.id, {
          discounts: [{ coupon: coupon.id }],
        } as any)

        return NextResponse.json({
          success: true,
          message: `Applied ${percent_off}% discount`,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('PATCH /api/admin/customers/[id]/subscription error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal server error',
    }, { status: 500 })
  }
}
