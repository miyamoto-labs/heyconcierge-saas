import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback/microsoft`

// Initiate Microsoft OAuth
export async function GET() {
  const state = Math.random().toString(36).substring(7)
  
  // Store state in cookie for CSRF protection
  cookies().set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    response_mode: 'query',
  })

  return NextResponse.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`)
}
