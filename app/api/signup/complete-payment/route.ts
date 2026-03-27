import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, stripeCustomerId } = await request.json()
  const adminSupabase = createAdminClient()

  const { data: org } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  await adminSupabase
    .from('organizations')
    .update({
      plan: plan || 'professional',
      stripe_customer_id: stripeCustomerId || null,
      subscription_status: 'trialing',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', org.id)

  return NextResponse.json({ org })
}
