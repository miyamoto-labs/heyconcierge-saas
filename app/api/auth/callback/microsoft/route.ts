import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface MicrosoftTokenResponse {
  access_token: string
  id_token: string
}

interface MicrosoftUserInfo {
  sub: string
  email: string
  name: string
  picture?: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Get redirect URI from request origin
  const origin = request.headers.get('origin') || request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/callback/microsoft`
  
  // Verify state to prevent CSRF
  const storedState = cookies().get('oauth_state')?.value
  
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    // Exchange code for tokens
    console.log('[Microsoft OAuth] Exchanging code for token...')
    console.log('[Microsoft OAuth] Redirect URI:', redirectUri)
    
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Microsoft OAuth] Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        redirectUri
      })
      throw new Error(`Failed to exchange code for token: ${errorText}`)
    }

    const tokens: MicrosoftTokenResponse = await tokenResponse.json()

    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo: MicrosoftUserInfo = await userInfoResponse.json()

    // Create or update user in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    let isNewUser = false
    if (!existingUser) {
      await supabase.from('users').insert({
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture || null,
      })
      isNewUser = true
    }

    // Check if user has completed onboarding (has organization)
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    // Redirect to signup if new user or no organization
    const finalRedirect = isNewUser || !org ? '/signup?step=2' : '/dashboard'
    
    console.log('[Microsoft OAuth] User info:', {
      sub: userInfo.sub,
      email: userInfo.email,
      isNewUser,
      hasOrg: !!org,
      finalRedirect
    })
    
    // Redirect to auth-success page which will set cookies client-side
    const authSuccessUrl = new URL('/auth-success', request.url)
    authSuccessUrl.searchParams.set('user_id', userInfo.sub)
    authSuccessUrl.searchParams.set('user_email', userInfo.email)
    authSuccessUrl.searchParams.set('redirect', finalRedirect)
    
    const response = NextResponse.redirect(authSuccessUrl)
    response.cookies.delete('oauth_state')
    
    console.log('[Microsoft OAuth] Redirecting to auth-success page')

    return response
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
