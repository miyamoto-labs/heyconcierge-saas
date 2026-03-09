import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { user, org } = await requireAuth()
  if (!user || !org) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('platform_ratings')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ rating: existing || null })
}

export async function POST(request: NextRequest) {
  const { user, org } = await requireAuth()
  if (!user || !org) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rating, comment } = await request.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('platform_ratings')
    .insert({
      org_id: org.id,
      user_id: user.id,
      rating,
      comment: comment || null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
