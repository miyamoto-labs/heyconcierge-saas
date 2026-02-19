import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID!
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback/facebook`

// Initiate Facebook OAuth
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
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'email,public_profile',
    state,
  })

  return NextResponse.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`)
}
