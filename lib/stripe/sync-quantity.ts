import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Sync the Stripe subscription quantity with the actual number of
 * billable properties for an organization.
 *
 * - During trial: update quantity only (no charge)
 * - During active: prorate immediately for additions, next cycle for removals
 */
export async function syncSubscriptionQuantity(orgId: string) {
  const supabase = createAdminClient()

  // Get org with Stripe info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_subscription_id, stripe_customer_id, subscription_status')
    .eq('id', orgId)
    .single()

  if (!org?.stripe_subscription_id) {
    // No active subscription — nothing to sync
    return
  }

  // Count billable properties
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const newQuantity = Math.max(1, count || 0)

  // Get current subscription from Stripe
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

  if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
    return // Don't update cancelled subscriptions
  }

  const item = subscription.items.data[0]
  if (!item) return

  const currentQuantity = item.quantity || 1
  if (currentQuantity === newQuantity) return // Already in sync

  const isTrialing = subscription.status === 'trialing'
  const isIncreasing = newQuantity > currentQuantity

  // Determine proration behavior:
  // - Trial: no proration (just update quantity)
  // - Active + adding properties: prorate immediately
  // - Active + removing properties: apply at next billing cycle (paid is paid)
  let prorationBehavior: 'create_prorations' | 'none' | 'always_invoice'
  if (isTrialing) {
    prorationBehavior = 'none'
  } else if (isIncreasing) {
    prorationBehavior = 'always_invoice' // Charge immediately for new properties
  } else {
    prorationBehavior = 'none' // Removing properties — takes effect next cycle
  }

  await stripe.subscriptions.update(org.stripe_subscription_id, {
    items: [
      {
        id: item.id,
        quantity: newQuantity,
      },
    ],
    proration_behavior: prorationBehavior,
  })

  // Update local mirror
  await supabase
    .from('organizations')
    .update({ subscription_quantity: newQuantity })
    .eq('id', orgId)

  console.log(
    `Synced subscription quantity for org ${orgId}: ${currentQuantity} → ${newQuantity} (${prorationBehavior})`
  )
}
