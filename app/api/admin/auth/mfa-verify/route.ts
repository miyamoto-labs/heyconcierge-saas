import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'otplib'
import { getAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await request.json()

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

  const adminUser = session.admin_users as { mfa_secret: string | null }

  if (!adminUser.mfa_secret) {
    return NextResponse.json({ error: 'MFA not configured' }, { status: 400 })
  }

  // Verify the TOTP code using otplib v13 async API
  const isValid = await verify({ token: code, secret: adminUser.mfa_secret })
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
  }

  // Mark session as MFA verified
  const supabase = getAdminSupabase()
  const { error: updateError } = await supabase
    .from('admin_sessions')
    .update({ mfa_verified: true })
    .eq('id', session.id)

  if (updateError) {
    console.error('MFA verify update error:', updateError)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
