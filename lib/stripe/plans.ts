/**
 * HeyConcierge Pricing Plans
 *
 * Per-property pricing: each plan has a monthly price per property.
 * Stripe subscription uses quantity = number of billable properties.
 *
 * Price IDs must be created in Stripe Dashboard and set in env vars:
 *   STRIPE_PRICE_STARTER_MONTHLY
 *   STRIPE_PRICE_PROFESSIONAL_MONTHLY
 *   STRIPE_PRICE_PREMIUM_MONTHLY
 */

export type PlanCode = 'starter' | 'professional' | 'premium'

export interface PlanConfig {
  code: PlanCode
  name: string
  pricePerProperty: number // USD cents per property per month
  displayPrice: string     // Human-readable price string
  features: string[]
  popular?: boolean
}

export const PLANS: Record<PlanCode, PlanConfig> = {
  starter: {
    code: 'starter',
    name: 'Starter',
    pricePerProperty: 900, // $9/property/month
    displayPrice: '$9',
    features: [
      'AI concierge (Telegram & WhatsApp)',
      'Document extraction',
      'Calendar sync',
      'Basic analytics',
    ],
  },
  professional: {
    code: 'professional',
    name: 'Professional',
    pricePerProperty: 1900, // $19/property/month
    displayPrice: '$19',
    popular: true,
    features: [
      'Everything in Starter',
      'Priority support',
      'Advanced AI features',
      'Upselling engine',
      'Activity recommendations',
    ],
  },
  premium: {
    code: 'premium',
    name: 'Premium',
    pricePerProperty: 2500, // $25/property/month
    displayPrice: '$25',
    features: [
      'Everything in Professional',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'Unlimited messages',
    ],
  },
}

export const TRIAL_PERIOD_DAYS = 30

/**
 * Get Stripe Price ID for a plan from environment variables.
 * These must be created manually in Stripe Dashboard.
 */
export function getStripePriceId(plan: PlanCode): string {
  const envMap: Record<PlanCode, string> = {
    starter: 'STRIPE_PRICE_STARTER_MONTHLY',
    professional: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
    premium: 'STRIPE_PRICE_PREMIUM_MONTHLY',
  }

  const priceId = process.env[envMap[plan]]
  if (!priceId) {
    throw new Error(`Missing Stripe Price ID for plan "${plan}". Set ${envMap[plan]} in environment.`)
  }
  return priceId
}

/**
 * Look up plan code from a Stripe Price ID.
 */
export function getPlanFromPriceId(priceId: string): PlanCode | null {
  const mapping: Record<string, PlanCode> = {}
  for (const plan of Object.keys(PLANS) as PlanCode[]) {
    try {
      mapping[getStripePriceId(plan)] = plan
    } catch {
      // Price ID not configured — skip
    }
  }
  return mapping[priceId] || null
}

export const PLAN_ORDER: PlanCode[] = ['starter', 'professional', 'premium']

/**
 * Check if changing from one plan to another is an upgrade.
 */
export function isUpgrade(from: PlanCode, to: PlanCode): boolean {
  return PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from)
}
