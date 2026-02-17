import { NextResponse } from 'next/server'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export async function GET() {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabase()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Run all queries in parallel
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
    // Total organizations
    supabase.from('organizations').select('id', { count: 'exact', head: true }),

    // In trial
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'trialing'),

    // Paying customers
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active'),

    // Churned this week
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'churned')
      .gte('churned_at', oneWeekAgo),

    // New customers this week
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo),

    // Starter plan
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'starter'),

    // Professional plan
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'professional'),

    // Premium/Enterprise plan
    supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .in('plan', ['premium', 'enterprise']),

    // Total properties
    supabase.from('properties').select('id', { count: 'exact', head: true }),

    // Active bots (telegram set up)
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .not('telegram_bot_token', 'is', null),

    // Total messages last 7 days
    supabase
      .from('goconcierge_messages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo),
  ])

  return NextResponse.json({
    // Overview
    totalCustomers: orgsResult.count ?? 0,
    inTrial: trialingResult.count ?? 0,
    payingCustomers: activeResult.count ?? 0,
    churnedThisWeek: churnedResult.count ?? 0,

    // Plans
    starterCount: planStarterResult.count ?? 0,
    professionalCount: planProResult.count ?? 0,
    premiumCount: planPremiumResult.count ?? 0,

    // Activity
    newCustomersThisWeek: newOrgsResult.count ?? 0,
    totalProperties: propertiesResult.count ?? 0,
    totalMessages: messagesResult.count ?? 0,
    activeBots: activeBotsResult.count ?? 0,
  })
}
