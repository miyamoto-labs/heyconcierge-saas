import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const validCode = process.env.ACCESS_CODE
    if (!validCode) {
      // If no access code is configured, access gate is disabled — allow through
      return NextResponse.json({ valid: true })
    }

    if (code !== validCode) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const response = NextResponse.json({ valid: true })
    response.cookies.set('heyconcierge_access', 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
