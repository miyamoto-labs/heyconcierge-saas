import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

const ROLES = ['super_admin', 'admin', 'support', 'finance']

// PATCH — update role or frozen state
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = session.admin_users as { id: string; role: string }
    if (!['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      if (body.role === 'super_admin' && adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only super admins can assign super admin role' }, { status: 403 })
      }
      updates.role = body.role
    }

    if (body.frozen !== undefined) {
      updates.frozen = Boolean(body.frozen)
    }

    const supabase = getAdminSupabase()
    const { error } = await supabase.from('admin_users').update(updates).eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/users/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove admin user
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = session.admin_users as { id: string; role: string }
    if (adminUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 403 })
    }

    // Can't delete yourself
    if (params.id === adminUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { error } = await supabase.from('admin_users').delete().eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/users/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
