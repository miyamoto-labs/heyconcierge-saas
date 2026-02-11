import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/publishers/[wallet] - Get publisher profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params
    
    const { data: publisher, error } = await supabaseAdmin
      .from('publishers')
      .select('*')
      .eq('wallet_address', wallet)
      .single()
    
    if (error || !publisher) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }
    
    // Get all publisher's skills (all statuses for profile view)
    const { data: skills } = await supabaseAdmin
      .from('skills')
      .select('id, name, description, version, status, scan_result, downloads, git_url, category, created_at, updated_at')
      .eq('publisher_id', publisher.id)
      .order('created_at', { ascending: false })
    
    // Get stats
    const totalDownloads = skills?.reduce((sum: number, s: { downloads: number }) => sum + (s.downloads || 0), 0) || 0
    
    return NextResponse.json({
      publisher: {
        ...publisher,
        skills_count: skills?.length || 0,
        total_downloads: totalDownloads,
      },
      skills: skills || [],
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
