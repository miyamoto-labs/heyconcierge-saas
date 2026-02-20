import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    // Get organization with billing fields
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, email, plan, subscription_status, trial_started_at, trial_ends_at, stripe_customer_id, created_at')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Calculate trial days remaining
    let trialDaysLeft = 0
    if (org.subscription_status === 'trialing' && org.trial_ends_at) {
      const now = new Date()
      const trialEnd = new Date(org.trial_ends_at)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    } else if (org.subscription_status === 'trialing' && !org.trial_ends_at && org.trial_started_at) {
      // Default 14-day trial
      const trialStart = new Date(org.trial_started_at)
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)
      trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Plan limits
    const planLimits: Record<string, { properties: number; messages: number; price: string }> = {
      starter: { properties: 5, messages: 500, price: '$49/mo' },
      professional: { properties: 20, messages: 2000, price: '$149/mo' },
      premium: { properties: 40, messages: -1, price: '$299/mo' }, // -1 = unlimited
    }

    const limits = planLimits[org.plan] || planLimits.starter

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        email: org.email,
        plan: org.plan,
        status: org.subscription_status || 'trialing',
        trialDaysLeft,
        stripeConnected: !!org.stripe_customer_id,
        createdAt: org.created_at,
      },
      limits,
    })
  } catch (error) {
    console.error('Billing current error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch billing info' },
      { status: 500 }
    )
  }
}
