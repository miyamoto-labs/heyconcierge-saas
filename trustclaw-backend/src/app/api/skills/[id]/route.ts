import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/skills/[id] - Get skill details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Use admin client to bypass RLS and access scans
    const supabase = getSupabaseAdmin()
    
    const { data: skill, error } = await supabase
      .from('skills')
      .select(`
        *,
        publisher:publishers(id, wallet_address, display_name, github_username, verified, reputation_score),
        scans!left(id, result, findings, scanned_at)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Skill not found', details: error.message }, { status: 404 })
    }
    
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }
    
    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
