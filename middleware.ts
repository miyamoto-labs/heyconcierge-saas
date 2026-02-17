import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Admin routes — check admin session cookie
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Skip password check for API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Existing host access cookie check
  const accessCookie = request.cookies.get('heyconcierge_access')
  const validPassword = process.env.NEXT_PUBLIC_ACCESS_CODE || 'heyc2026'

  if (accessCookie?.value === validPassword) {
    return NextResponse.next()
  }

  if (pathname !== '/access') {
    return NextResponse.redirect(new URL('/access', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
