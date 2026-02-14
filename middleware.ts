import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip password check for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if user has valid access cookie
  const accessCookie = request.cookies.get('heyconcierge_access')
  const validPassword = process.env.NEXT_PUBLIC_ACCESS_CODE || 'heyc2026'

  if (accessCookie?.value === validPassword) {
    return NextResponse.next()
  }

  // Redirect to password page if not authenticated
  if (request.nextUrl.pathname !== '/access') {
    return NextResponse.redirect(new URL('/access', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
