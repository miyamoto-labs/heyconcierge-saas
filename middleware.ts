import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Admin routes — keep existing admin auth (separate system, untouched)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Skip auth for admin login, legal pages, and public pages
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/legal') ||
    pathname === '/access' ||
    pathname === '/faq' ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Create Supabase client with cookie handling for JWT refresh
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate the JWT — this also refreshes expired tokens
  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that don't require auth
  const publicPaths = ['/login', '/signup', '/auth']
  const isPublicRoute = publicPaths.some(path => pathname.startsWith(path))

  // API routes that don't require auth
  const publicApiPaths = [
    '/api/auth',
    '/api/admin',
    '/api/telegram-webhook',
    '/api/telegram-setup',
    '/api/test-concierge',
    '/api/gdpr',
  ]
  const isPublicApi = publicApiPaths.some(path => pathname.startsWith(path))

  if (isPublicRoute || isPublicApi) {
    return supabaseResponse
  }

  // Protected API routes — return 401 if not authenticated
  if (pathname.startsWith('/api') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Protected pages — redirect to login if not authenticated
  if (!user && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
