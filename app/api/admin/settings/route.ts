import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('admin_settings')
    .select('key, value')

  const settings: Record<string, any> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only super_admin and admin can change settings
  const role = admin.admin_users?.role || admin.role
  if (!['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { key, value } = await request.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
