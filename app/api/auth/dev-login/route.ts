import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🚨 DEV ONLY — never runs in production
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Look up existing user by email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Create a dev user
    userId = `dev-${Date.now()}`
    await supabase.from('users').insert({
      id: userId,
      email,
      name: email.split('@')[0],
    })
  }

  const response = NextResponse.json({ ok: true })
  const cookieOpts = {
    httpOnly: false,
    secure: false,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
  response.cookies.set('user_id', userId, cookieOpts)
  response.cookies.set('user_email', email, cookieOpts)

  return response
}
