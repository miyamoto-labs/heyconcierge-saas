import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getPlanFromPriceId } from '@/lib/stripe/plans'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getOrgByStripeCustomerId(customerId: string) {
  const supabase = createAdminClient()
  // First try by stored customer ID
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single()
  if (data) return data

  // Fallback: look up customer email from Stripe, then match by org email
  try {
    const customer = await getStripe().customers.retrieve(customerId)
    if ('deleted' in customer && customer.deleted) return null
    const email = (customer as Stripe.Customer).email
    if (email) {
      const { data: orgByEmail } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', email)
        .single()
      if (orgByEmail) {
        // Store the customer ID for future lookups
        await supabase
          .from('organizations')
          .update({ stripe_customer_id: customerId })
          .eq('id', orgByEmail.id)
        return orgByEmail
      }
    }
  } catch (err) {
    console.error('Failed to look up Stripe customer by email:', err)
  }

  return null
}

async function updateOrg(orgId: string, updates: Record<string, any>) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
  if (error) {
    console.error(`Failed to update org ${orgId}:`, error)
    throw error
  }
}

async function logWebhookEvent(
  stripeEventId: string,
  eventType: string,
  organizationId: string | null,
  payload: any,
  error?: string
) {
  const supabase = createAdminClient()
  await supabase.from('stripe_webhook_events').upsert(
    {
      stripe_event_id: stripeEventId,
      event_type: eventType,
      organization_id: organizationId,
      payload,
      error: error || null,
      processed_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_event_id' }
  )
}

async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', stripeEventId)
    .single()
  return !!data
}

// --- Event Handlers ---

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id
  if (!customerId) return

  // Try to find org by existing stripe_customer_id
  let org = await getOrgByStripeCustomerId(customerId)

  // If not found, this is a first-time checkout — find org by email
  if (!org) {
    const email = session.customer_details?.email || session.customer_email
    if (email) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('email', email)
        .single()
      org = data
    }

    if (!org) {
      console.warn(`Webhook: No org found for Stripe customer ${customerId}`)
      return
    }
  }

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id

  const updates: Record<string, any> = {
    stripe_customer_id: customerId,
  }
  if (subscriptionId) {
    updates.stripe_subscription_id = subscriptionId
  }
  if (session.metadata?.plan) {
    updates.plan = session.metadata.plan
  }

  await updateOrg(org.id, updates)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription & { current_period_end?: number }) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id
  if (!customerId) return

  const org = await getOrgByStripeCustomerId(customerId)
  if (!org) {
    console.warn(`Webhook: No org found for Stripe customer ${customerId}`)
    return
  }

  const item = subscription.items.data[0]
  const priceId = typeof item?.price === 'string' ? item.price : item?.price?.id
  const planCode = priceId ? getPlanFromPriceId(priceId) : null

  await updateOrg(org.id, {
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId || null,
    subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
    subscription_quantity: item?.quantity || 1,
    plan: planCode || org.plan,
    trial_started_at: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : org.trial_started_at,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : org.trial_ends_at,
    current_period_start_at: new Date(subscription.items.data[0]?.created * 1000 || Date.now()).toISOString(),
    current_period_end_at: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    last_webhook_event_id: null, // will be set by caller
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription & { current_period_end?: number }) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id
  if (!customerId) return

  const org = await getOrgByStripeCustomerId(customerId)
  if (!org) {
    console.warn(`Webhook: No org found for Stripe customer ${customerId}`)
    return
  }

  const item = subscription.items.data[0]
  const priceId = typeof item?.price === 'string' ? item.price : item?.price?.id
  const planCode = priceId ? getPlanFromPriceId(priceId) : null

  // Map Stripe status to our internal status
  let internalStatus: string = subscription.status
  if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    internalStatus = 'past_due'
  }
  // Keep only statuses we support
  if (!['trialing', 'active', 'past_due', 'cancelled'].includes(internalStatus)) {
    internalStatus = org.subscription_status // keep current
  }

  const updates: Record<string, any> = {
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId || org.stripe_price_id,
    subscription_status: internalStatus,
    subscription_quantity: item?.quantity || org.subscription_quantity,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    current_period_end_at: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : org.current_period_end_at,
  }

  if (planCode) {
    updates.plan = planCode
  }

  if (subscription.trial_end) {
    updates.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
  }

  // If subscription was cancelled (not just cancel_at_period_end)
  if (subscription.status === 'canceled') {
    updates.subscription_status = 'cancelled'
    updates.churned_at = new Date().toISOString()
  }

  await updateOrg(org.id, updates)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id
  if (!customerId) return

  const org = await getOrgByStripeCustomerId(customerId)
  if (!org) return

  await updateOrg(org.id, {
    subscription_status: 'cancelled',
    cancel_at_period_end: false,
    churned_at: new Date().toISOString(),
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id
  if (!customerId) return

  const org = await getOrgByStripeCustomerId(customerId)
  if (!org) return

  // If org was trialing or past_due, move to active
  if (['trialing', 'past_due'].includes(org.subscription_status)) {
    await updateOrg(org.id, {
      subscription_status: 'active',
    })
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id
  if (!customerId) return

  const org = await getOrgByStripeCustomerId(customerId)
  if (!org) return

  await updateOrg(org.id, {
    subscription_status: 'past_due',
  })
}

// --- Main webhook handler ---

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: skip already-processed events
  if (await isEventProcessed(event.id)) {
    return NextResponse.json({ received: true, skipped: true })
  }

  let orgId: string | null = null
  let error: string | undefined

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    // Try to extract org ID for logging
    const obj = event.data.object as any
    const custId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id
    if (custId) {
      const org = await getOrgByStripeCustomerId(custId)
      orgId = org?.id || null
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook handler error for ${event.type}:`, err)
  }

  // Log the event
  await logWebhookEvent(event.id, event.type, orgId, event.data.object, error)

  // Always return 200 to Stripe — even on error — to prevent retries flooding
  // Errors are logged and can be investigated
  return NextResponse.json({ received: true })
}
