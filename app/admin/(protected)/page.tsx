import { requireAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

interface Metrics {
  totalCustomers: number
  inTrial: number
  payingCustomers: number
  churnedThisWeek: number
  starterCount: number
  professionalCount: number
  premiumCount: number
  newCustomersThisWeek: number
  totalProperties: number
  totalMessages: number
  activeBots: number
}

interface RevenueMetrics {
  mrrActive: number    // Monthly income from active (paying) customers
  mrrTrialing: number  // Monthly income from trialing customers (after trial)
  mrrTotal: number     // Combined
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover' as any,
  })
}

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: 'default' | 'green' | 'yellow' | 'red' | 'purple' | 'blue'
}

const accentColors = {
  default: 'text-white',
  green: 'text-emerald-400',
  yellow: 'text-amber-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
  blue: 'text-sky-400',
}

function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accentColors[accent]}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession()
  if (!session) redirect('/admin/login')

  // Fetch metrics server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  let metrics: Metrics | null = null
  let fetchError: string | null = null

  try {
    // We call the API internally — pass the session cookie via header isn't straightforward here,
    // so we'll do direct DB queries via the same requireAdminSession pattern.
    const { getAdminSupabase } = await import('@/lib/admin-auth')
    const supabase = getAdminSupabase()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      orgsResult,
      trialingResult,
      activeResult,
      churnedResult,
      newOrgsResult,
      planStarterResult,
      planProResult,
      planPremiumResult,
      propertiesResult,
      activeBotsResult,
      messagesResult,
    ] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('subscription_status', 'trialing'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('subscription_status', 'churned').gte('churned_at', oneWeekAgo),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('plan', 'starter'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('plan', 'professional'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).in('plan', ['premium', 'enterprise']),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }).not('telegram_bot_token', 'is', null),
      supabase.from('goconcierge_messages').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    ])

    metrics = {
      totalCustomers: orgsResult.count ?? 0,
      inTrial: trialingResult.count ?? 0,
      payingCustomers: activeResult.count ?? 0,
      churnedThisWeek: churnedResult.count ?? 0,
      starterCount: planStarterResult.count ?? 0,
      professionalCount: planProResult.count ?? 0,
      premiumCount: planPremiumResult.count ?? 0,
      newCustomersThisWeek: newOrgsResult.count ?? 0,
      totalProperties: propertiesResult.count ?? 0,
      totalMessages: messagesResult.count ?? 0,
      activeBots: activeBotsResult.count ?? 0,
    }
  } catch (err) {
    console.error('Dashboard metrics error:', err)
    fetchError = 'Failed to load metrics'
  }

  // Calculate MRR from Stripe subscriptions
  let revenue: RevenueMetrics | null = null
  try {
    const stripe = getStripe()
    const allSubs = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.items.data.price', 'data.discounts'],
    })

    let mrrActive = 0
    let mrrTrialing = 0

    for (const sub of allSubs.data as any[]) {
      const price = sub.items?.data?.[0]?.price
      const baseAmount = price?.unit_amount ?? 0

      // Normalize to monthly amount
      let monthlyBase = baseAmount
      if (price?.recurring?.interval === 'year') {
        monthlyBase = Math.round(baseAmount / 12)
      }

      // Calculate effective amount after discounts
      let effectiveMonthly = monthlyBase

      if (Array.isArray(sub.discounts) && sub.discounts.length > 0) {
        const first = sub.discounts[0]
        const couponId = first?.source?.coupon
          ?? (typeof first?.coupon === 'string' ? first.coupon : null)
          ?? (typeof first?.coupon === 'object' ? first.coupon?.id : null)

        if (couponId) {
          try {
            const coupon = await stripe.coupons.retrieve(couponId)
            if (coupon.percent_off) {
              effectiveMonthly = Math.round(monthlyBase * (1 - coupon.percent_off / 100))
            } else if (coupon.amount_off) {
              effectiveMonthly = Math.max(0, monthlyBase - coupon.amount_off)
            }
          } catch {
            // Coupon fetch failed, use base amount
          }
        }
      }

      if (sub.status === 'active') {
        mrrActive += effectiveMonthly
      } else if (sub.status === 'trialing') {
        mrrTrialing += effectiveMonthly
      }
    }

    revenue = {
      mrrActive,
      mrrTrialing,
      mrrTotal: mrrActive + mrrTrialing,
    }
  } catch (err) {
    console.error('Revenue metrics error:', err)
  }

  // Suppress unused variable warning for baseUrl
  void baseUrl

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Overview of HeyConcierge customers and activity
        </p>
      </div>

      {fetchError && (
        <div className="mb-6 bg-red-950 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
          {fetchError}
        </div>
      )}

      {metrics && (
        <div className="space-y-8">
          {/* Customer overview */}
          <div>
            <SectionTitle>Customers</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total customers" value={metrics.totalCustomers} />
              <StatCard
                label="In trial"
                value={metrics.inTrial}
                accent="yellow"
                sub="subscription_status = trialing"
              />
              <StatCard
                label="Paying"
                value={metrics.payingCustomers}
                accent="green"
                sub="subscription_status = active"
              />
              <StatCard
                label="Churned this week"
                value={metrics.churnedThisWeek}
                accent={metrics.churnedThisWeek > 0 ? 'red' : 'default'}
              />
            </div>
          </div>

          {/* Revenue */}
          {revenue && (
            <div>
              <SectionTitle>Monthly Recurring Revenue</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label="Active customers"
                  value={`$${(revenue.mrrActive / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  accent="green"
                  sub="paying subscriptions"
                />
                <StatCard
                  label="Trialing customers"
                  value={`$${(revenue.mrrTrialing / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  accent="yellow"
                  sub="expected after trial"
                />
                <StatCard
                  label="Total MRR"
                  value={`$${(revenue.mrrTotal / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  accent="green"
                  sub="all subscriptions"
                />
              </div>
            </div>
          )}

          {/* Plans */}
          <div>
            <SectionTitle>Plans</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Starter" value={metrics.starterCount} accent="blue" />
              <StatCard label="Professional" value={metrics.professionalCount} accent="purple" />
              <StatCard label="Premium / Enterprise" value={metrics.premiumCount} accent="green" />
            </div>
          </div>

          {/* Activity */}
          <div>
            <SectionTitle>Activity (last 7 days)</SectionTitle>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="New customers"
                value={metrics.newCustomersThisWeek}
                accent={metrics.newCustomersThisWeek > 0 ? 'green' : 'default'}
                sub="this week"
              />
              <StatCard label="Total properties" value={metrics.totalProperties} />
              <StatCard label="Messages sent" value={metrics.totalMessages} sub="this week" />
              <StatCard
                label="Active bots"
                value={metrics.activeBots}
                accent={metrics.activeBots > 0 ? 'blue' : 'default'}
                sub="with Telegram"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
