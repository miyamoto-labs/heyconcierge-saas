import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapSupabaseAuthUser } from '@/lib/auth/map-user'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Map Supabase Auth user to public.users record
    await mapSupabaseAuthUser(
      user.id,
      user.email!,
      user.user_metadata?.full_name || user.user_metadata?.name || '',
      user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
    )

    // Check if user has an organization (completed onboarding)
    const adminSupabase = createAdminClient()
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .limit(1)
      .single()

    if (!org) {
      return NextResponse.redirect(`${origin}/signup?step=1`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
