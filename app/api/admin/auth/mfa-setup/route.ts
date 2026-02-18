import { NextRequest, NextResponse } from 'next/server'
import { generateSecret, generate, verify, generateURI } from 'otplib'
import QRCode from 'qrcode'
import { getAdminSession, getAdminSupabase } from '@/lib/admin-auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate a new TOTP secret
  const secret = generateSecret()
  const adminUser = session.admin_users as { email: string; name: string }

  // Generate OTPAuth URI for QR code
  const uri = generateURI({
    issuer: 'HeyConcierge Admin',
    label: adminUser.email,
    secret,
  })

  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(uri)

  return NextResponse.json({ qrCode, secret })
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code, secret } = await request.json()

  if (!code || !secret) {
    return NextResponse.json({ error: 'Code and secret are required' }, { status: 400 })
  }

  // Verify the TOTP code — verify() returns { valid: boolean }, not a plain boolean
  const result = await verify({ token: code, secret })
  if (!result.valid) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const adminUser = session.admin_users as { id: string }

  // Save secret and enable MFA
  const { error: updateError } = await supabase
    .from('admin_users')
    .update({ mfa_secret: secret, mfa_enabled: true })
    .eq('id', adminUser.id)

  if (updateError) {
    console.error('MFA update error:', updateError)
    return NextResponse.json({ error: 'Failed to save MFA settings' }, { status: 500 })
  }

  // Mark session as MFA verified
  await supabase
    .from('admin_sessions')
    .update({ mfa_verified: true })
    .eq('id', session.id)

  return NextResponse.json({ success: true })
}

// Suppress unused import warning — generate is exported for potential future use
void generate
