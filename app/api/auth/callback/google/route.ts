import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface GoogleTokenResponse {
  access_token: string
  id_token: string
}

interface GoogleUserInfo {
  sub: string // Google user ID
  email: string
  name: string
  picture: string
}

export async function GET(request: NextRequest) {
  console.log('🔵 Callback hit!')
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Get redirect URI from request origin
  const origin = request.headers.get('origin') || request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/callback/google`
  
  console.log('🔵 Code:', code?.substring(0, 10) + '...')
  console.log('🔵 State:', state)
  console.log('🔵 Redirect URI:', redirectUri)
  
  // Verify state to prevent CSRF
  const storedState = cookies().get('oauth_state')?.value
  console.log('🔵 Stored state:', storedState)
  
  if (!state || state !== storedState) {
    console.log('❌ State mismatch!')
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
  }

  if (!code) {
    console.log('❌ No code!')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    console.log('🔵 Exchanging code for token...')
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()
    console.log('🔵 Got tokens!')

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoResponse.ok) {
      console.log('❌ Failed to fetch user info')
      throw new Error('Failed to fetch user info')
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json()
    console.log('🔵 Raw Google userinfo response:', userInfo)
    console.log('🔵 User info:', userInfo.email)

    // Create or update user in Supabase
    console.log('🔵 Checking if user exists...')
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    if (checkError) {
      console.log('🔵 Check error (might be normal):', checkError.message)
    }

    let isNewUser = false
    if (!existingUser) {
      console.log('🔵 Creating new user...')
      const { error: insertError } = await supabase.from('users').insert({
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture,
      })
      
      if (insertError) {
        console.log('❌ Insert error:', insertError)
        throw insertError
      }
      console.log('✅ User created!')
      isNewUser = true
    } else {
      console.log('✅ User exists!')
    }

    // Check if user has completed onboarding (has organization)
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('email', userInfo.email)
      .single()

    // Redirect to signup if new user or no organization (start at step 1 to pre-fill info)
    const finalRedirect = isNewUser || !org ? '/signup?step=1' : '/dashboard'
    
    console.log('[Google OAuth] User info:', {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      isNewUser,
      hasOrg: !!org,
      finalRedirect
    })

    // Redirect to auth-success page which will set cookies client-side
    const authSuccessUrl = new URL('/auth-success', request.url)
    authSuccessUrl.searchParams.set('user_id', userInfo.sub)
    authSuccessUrl.searchParams.set('user_email', userInfo.email)
    authSuccessUrl.searchParams.set('user_name', userInfo.name)
    authSuccessUrl.searchParams.set('redirect', finalRedirect)
    
    const response = NextResponse.redirect(authSuccessUrl)
    response.cookies.delete('oauth_state')

    console.log('✅ All done! Redirecting to auth-success page...')
    return response
  } catch (error) {
    console.error('❌ OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
