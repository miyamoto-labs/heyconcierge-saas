import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/skills/[id]/report - Report a skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { wallet_address, reason, description } = body
    
    if (!wallet_address || !reason) {
      return NextResponse.json(
        { error: 'wallet_address and reason are required' },
        { status: 400 }
      )
    }
    
    // Verify skill exists
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('id')
      .eq('id', id)
      .single()
    
    if (skillError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }
    
    // Create report
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        skill_id: id,
        reporter_wallet: wallet_address,
        reason,
        description,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }
    
    return NextResponse.json({
      message: 'Report submitted successfully',
      report,
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
