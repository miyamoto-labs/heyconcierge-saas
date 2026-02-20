import { NextResponse } from 'next/server'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET — list all customers (organizations)
export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, email, subscription_status, plan, created_at, trial_ends_at, trial_started_at, stripe_customer_id, is_pilot')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ customers: data })
  } catch (err) {
    console.error('GET /api/admin/customers error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
