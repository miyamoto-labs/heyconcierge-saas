import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getAdminSession, getAdminSupabase } from '@/lib/admin-auth'
import { generateSecret, generateURI, verifyTOTP } from '@/lib/totp'

export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = generateSecret()
    const adminUser = session.admin_users as { email: string; name: string }
    const uri = generateURI('HeyConcierge Admin', adminUser.email, secret)
    const qrCode = await QRCode.toDataURL(uri)

    return NextResponse.json({ qrCode, secret })
  } catch (err) {
    console.error('MFA setup GET error:', err)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, secret } = body

    if (!code || !secret) {
      return NextResponse.json({ error: 'Code and secret are required' }, { status: 400 })
    }

    if (!verifyTOTP(String(code), String(secret))) {
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const adminUser = session.admin_users as { id: string }

    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ mfa_secret: secret, mfa_enabled: true })
      .eq('id', adminUser.id)

    if (updateError) {
      console.error('MFA update error:', updateError)
      return NextResponse.json({ error: 'Failed to save MFA settings' }, { status: 500 })
    }

    // Invalidate all other sessions for this admin user (force re-login)
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('admin_user_id', adminUser.id)
      .neq('id', session.id)

    // Mark current session as MFA verified
    await supabase
      .from('admin_sessions')
      .update({ mfa_verified: true })
      .eq('id', session.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('MFA setup POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
