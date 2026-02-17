import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin-auth'

export async function POST() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_session')?.value

  if (token) {
    const supabase = getAdminSupabase()
    await supabase.from('admin_sessions').delete().eq('token', token)
  }

  const response = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  response.cookies.delete('admin_session')
  return response
}

export async function GET() {
  return POST()
}
