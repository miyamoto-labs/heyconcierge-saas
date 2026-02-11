import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`

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
  
  console.log('🔵 Code:', code?.substring(0, 10) + '...')
  console.log('🔵 State:', state)
  
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
        redirect_uri: REDIRECT_URI,
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
    } else {
      console.log('✅ User exists!')
    }

    // Create session cookie
    console.log('🔵 Setting cookies...')
    
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    // Set cookies on the response
    response.cookies.set('user_id', userInfo.sub, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.cookies.set('user_email', userInfo.email, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    // Clean up state cookie
    response.cookies.delete('oauth_state')

    console.log('✅ All done! Redirecting to dashboard...')
    // Redirect to dashboard
    return response
  } catch (error) {
    console.error('❌ OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
