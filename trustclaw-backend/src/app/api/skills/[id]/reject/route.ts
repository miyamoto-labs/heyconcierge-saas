import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isAdmin } from '@/lib/supabase'

// POST /api/skills/[id]/reject - Admin reject skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body
    
    // Check admin auth
    const walletAddress = request.headers.get('x-wallet-address')
    
    if (!walletAddress || !isAdmin(walletAddress)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify skill exists
    const { data: skill, error: fetchError } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }
    
    if (skill.status === 'rejected') {
      return NextResponse.json({ error: 'Skill is already rejected' }, { status: 400 })
    }
    
    // Update skill status
    const { data: updatedSkill, error } = await supabaseAdmin
      .from('skills')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error rejecting skill:', error)
      return NextResponse.json({ error: 'Failed to reject skill' }, { status: 500 })
    }
    
    return NextResponse.json({
      message: 'Skill rejected',
      reason: reason || 'No reason provided',
      skill: updatedSkill,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
