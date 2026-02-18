import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdminSupabase, generateToken } from '@/lib/admin-auth'

const SESSION_HOURS = 8

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = getAdminSupabase()

    // Look up admin user
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check if account is frozen
    if (user.frozen) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact a super admin.' }, { status: 403 })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Generate session token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString()

    // Create session
    const { error: sessionError } = await supabase.from('admin_sessions').insert({
      admin_user_id: user.id,
      token,
      mfa_verified: false,
      expires_at: expiresAt,
    })

    if (sessionError) {
      console.error('Session insert error:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Set cookie
    const response = NextResponse.json(
      user.mfa_enabled
        ? { mfa_required: true }
        : !user.mfa_secret
        ? { mfa_setup_required: true }
        : { success: true }
    )

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_HOURS * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
