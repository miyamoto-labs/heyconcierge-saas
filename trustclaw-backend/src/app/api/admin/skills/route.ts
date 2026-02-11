import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isAdmin } from '@/lib/supabase'

// GET /api/admin/skills - List all skills (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const walletAddress = request.headers.get('x-wallet-address')
    
    if (!walletAddress || !isAdmin(walletAddress)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    
    let query = supabaseAdmin
      .from('skills')
      .select(`
        *,
        publisher:publishers(id, wallet_address, display_name, github_username, verified),
        scans(id, scan_type, result, findings, scanned_at)
      `)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: skills, error } = await query
    
    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
    }
    
    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
