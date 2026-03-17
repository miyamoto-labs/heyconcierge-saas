import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getStripe } from '@/lib/stripe'
import { PLANS, TRIAL_PERIOD_DAYS, PLAN_ORDER, type PlanCode, getStripePriceId } from '@/lib/stripe/plans'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user, org } = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Calculate trial days remaining
    let trialDaysLeft = 0
    if (org.subscription_status === 'trialing' && org.trial_ends_at) {
      const now = new Date()
      const trialEnd = new Date(org.trial_ends_at)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    } else if (org.subscription_status === 'trialing' && !org.trial_ends_at && org.trial_started_at) {
      const trialStart = new Date(org.trial_started_at)
      const trialEnd = new Date(trialStart.getTime() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Count properties
    const supabase = createAdminClient()
    const { count: propertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)

    const quantity = propertyCount || 0
    const planCode = (org.plan || 'starter') as PlanCode
    const planConfig = PLANS[planCode] || PLANS.starter

    // Fetch real prices from Stripe for all plans
    const stripe = getStripe()
    const planPrices: Record<string, { unitAmount: number; currency: string; interval: string }> = {}
    for (const plan of PLAN_ORDER) {
      try {
        const priceId = getStripePriceId(plan)
        const price = await stripe.prices.retrieve(priceId)
        planPrices[plan] = {
          unitAmount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
        }
      } catch {
        // Fall back to hardcoded if price not found
        planPrices[plan] = {
          unitAmount: PLANS[plan].pricePerProperty,
          currency: 'usd',
          interval: 'month',
        }
      }
    }

    const currentPrice = planPrices[planCode]?.unitAmount || planConfig.pricePerProperty
    const monthlyTotal = currentPrice * quantity

    // Get invoices from Stripe if customer exists
    let invoices: any[] = []
    if (org.stripe_customer_id) {
      try {
        const stripeInvoices = await stripe.invoices.list({
          customer: org.stripe_customer_id,
          limit: 10,
        })
        invoices = stripeInvoices.data.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amount: inv.amount_due,
          currency: inv.currency,
          created: inv.created,
          hostedUrl: inv.hosted_invoice_url,
          pdfUrl: inv.invoice_pdf,
        }))
      } catch (err) {
        console.error('Failed to fetch Stripe invoices:', err)
      }
    }

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        email: org.email,
        plan: planCode,
        status: org.subscription_status || 'trialing',
        trialDaysLeft,
        stripeConnected: !!org.stripe_customer_id,
        hasSubscription: !!org.stripe_subscription_id && !['cancelled', 'canceled'].includes(org.subscription_status),
        stripeCustomerId: org.stripe_customer_id || null,
        cancelAtPeriodEnd: org.cancel_at_period_end || false,
        currentPeriodEnd: org.current_period_end_at || null,
        createdAt: org.created_at,
      },
      plan: {
        code: planConfig.code,
        name: planConfig.name,
        pricePerProperty: currentPrice,
        displayPrice: `${(currentPrice / 100).toFixed(0)}`,
        features: planConfig.features,
      },
      plans: PLAN_ORDER.map(p => ({
        code: p,
        name: PLANS[p].name,
        pricePerProperty: planPrices[p].unitAmount,
        displayPrice: `${(planPrices[p].unitAmount / 100).toFixed(0)}`,
        currency: planPrices[p].currency,
        features: PLANS[p].features,
        popular: PLANS[p].popular || false,
      })),
      billing: {
        quantity,
        monthlyTotal,
        displayMonthlyTotal: `NOK ${(monthlyTotal / 100).toFixed(0)}`,
      },
      invoices,
    })
  } catch (error) {
    console.error('Billing current error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch billing info' },
      { status: 500 }
    )
  }
}
