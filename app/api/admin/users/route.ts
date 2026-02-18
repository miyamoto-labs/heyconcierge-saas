import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdminSession, getAdminSupabase } from '@/lib/admin-auth'

const ROLES = ['super_admin', 'admin', 'support', 'finance']

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// GET — list all admin users
export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, mfa_enabled, frozen, last_login_at, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ users: data })
  } catch (err) {
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — invite new admin user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = session.admin_users as { id: string; role: string }
    if (!['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { email, name, role } = await request.json()

    if (!email || !role) return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    if (!ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    if (role === 'super_admin' && adminUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can invite super admins' }, { status: 403 })
    }

    const supabase = getAdminSupabase()

    // Check duplicate
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) return NextResponse.json({ error: 'An admin with this email already exists' }, { status: 409 })

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const { error: insertError } = await supabase.from('admin_users').insert({
      email: email.toLowerCase().trim(),
      name: name || email.split('@')[0],
      role,
      password_hash: passwordHash,
      invited_by: adminUser.id,
    })

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ success: true, tempPassword })
  } catch (err) {
    console.error('POST /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
