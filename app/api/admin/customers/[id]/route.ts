import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover' as any,
  })
}

// GET — single customer detail with Stripe info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getAdminSupabase()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, email, plan, subscription_status, trial_started_at, trial_ends_at, stripe_customer_id, churned_at, is_pilot, created_at, user_id')
      .eq('id', params.id)
      .single()

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Calculate trial days remaining
    let trialDaysLeft = 0
    if (org.subscription_status === 'trialing' && org.trial_ends_at) {
      const now = new Date()
      const trialEnd = new Date(org.trial_ends_at)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    } else if (org.subscription_status === 'trialing' && !org.trial_ends_at && org.trial_started_at) {
      const trialStart = new Date(org.trial_started_at)
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Count properties for this org
    const { count: propertyCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)

    // Fetch Stripe subscription info if available
    let stripeInfo = null
    if (org.stripe_customer_id) {
      try {
        const stripe = getStripe()
        const subscriptions = await stripe.subscriptions.list({
          customer: org.stripe_customer_id,
          limit: 1,
          expand: ['data.items.data.price', 'data.discounts'],
        })

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0] as any
          const item = sub.items.data[0]
          const price = item?.price
          const baseAmount = price?.unit_amount ?? 0

          // Read discounts — flexible billing uses discounts[].source.coupon
          let coupon: any = null

          if (Array.isArray(sub.discounts) && sub.discounts.length > 0) {
            const first = sub.discounts[0]
            if (typeof first === 'object') {
              // Flexible billing: coupon ID is at source.coupon
              const couponId = first.source?.coupon
                ?? (typeof first.coupon === 'string' ? first.coupon : null)
                ?? (typeof first.coupon === 'object' ? first.coupon?.id : null)

              if (couponId) {
                try {
                  coupon = await stripe.coupons.retrieve(couponId)
                } catch (e) {
                  console.error('[Admin] Failed to fetch coupon:', e)
                }
              }
            }
          }

          // Calculate effective price after discount
          let effectiveAmount = baseAmount
          if (coupon?.percent_off) {
            effectiveAmount = Math.round(baseAmount * (1 - coupon.percent_off / 100))
          } else if (coupon?.amount_off) {
            effectiveAmount = Math.max(0, baseAmount - coupon.amount_off)
          }

          // Flexible billing: current_period_end doesn't exist,
          // use trial_end (for trialing) or billing_cycle_anchor
          let periodEnd = sub.trial_end ?? sub.billing_cycle_anchor ?? null

          stripeInfo = {
            subscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            priceAmount: baseAmount,
            effectiveAmount,
            priceCurrency: price?.currency ?? 'usd',
            priceInterval: price?.recurring?.interval ?? 'month',
            discount: coupon ? {
              couponId: coupon.id,
              percentOff: coupon.percent_off ?? null,
              amountOff: coupon.amount_off ?? null,
              duration: coupon.duration,
              name: coupon.name ?? null,
            } : null,
          }
        }
      } catch (stripeErr) {
        console.error('Stripe fetch error:', stripeErr)
        // Don't fail the whole request if Stripe errors
      }
    }

    return NextResponse.json({
      customer: {
        ...org,
        trialDaysLeft,
        propertyCount: propertyCount ?? 0,
      },
      stripe: stripeInfo,
    })
  } catch (err) {
    console.error('GET /api/admin/customers/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update customer fields
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
    const allowedFields = ['name', 'email', 'plan', 'is_pilot']
    const updates: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/customers/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
