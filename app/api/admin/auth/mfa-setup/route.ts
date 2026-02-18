import { NextRequest, NextResponse } from 'next/server'
import { generateSecret, verifySync, generateURI } from 'otplib'
import QRCode from 'qrcode'
import { getAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = generateSecret()
    const adminUser = session.admin_users as { email: string; name: string }

    const uri = generateURI({
      issuer: 'HeyConcierge Admin',
      label: adminUser.email,
      secret,
    })

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

    // verifySync returns { valid: boolean } — wrap in try/catch in case of bad input
    let isValid = false
    try {
      const result = verifySync({ token: String(code), secret: String(secret) })
      isValid = result.valid
    } catch (verifyErr) {
      console.error('TOTP verify error:', verifyErr)
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    if (!isValid) {
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
