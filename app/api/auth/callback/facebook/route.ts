import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID!
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FacebookTokenResponse {
  access_token: string
}

interface FacebookUserInfo {
  id: string
  email: string
  name: string
  picture?: {
    data: {
      url: string
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Get redirect URI from request origin
  const origin = request.headers.get('origin') || request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/callback/facebook`
  
  // Verify state to prevent CSRF
  const storedState = cookies().get('oauth_state')?.value
  
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.text()).then(text => {
      const url = `https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
        client_id: FACEBOOK_CLIENT_ID,
        client_secret: FACEBOOK_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code,
      })}`
      return fetch(url)
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokens: FacebookTokenResponse = await tokenResponse.json()

    // Get user info from Facebook
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,email,name,picture&access_token=${tokens.access_token}`
    )

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo: FacebookUserInfo = await userInfoResponse.json()

    // Create or update user in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    let isNewUser = false
    if (!existingUser) {
      await supabase.from('users').insert({
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture?.data?.url || null,
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
    const redirectUrl = isNewUser || !org ? '/signup?step=2' : '/dashboard'
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))
    
    response.cookies.set('user_id', userInfo.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.cookies.set('user_email', userInfo.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('Facebook OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
