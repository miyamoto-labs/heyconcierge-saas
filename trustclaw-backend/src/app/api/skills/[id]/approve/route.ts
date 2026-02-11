import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isAdmin } from '@/lib/supabase'

// POST /api/skills/[id]/approve - Admin approve skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
    
    if (skill.status === 'verified') {
      return NextResponse.json({ error: 'Skill is already verified' }, { status: 400 })
    }
    
    // Update skill status
    const { data: updatedSkill, error } = await supabaseAdmin
      .from('skills')
      .update({ status: 'verified' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error approving skill:', error)
      return NextResponse.json({ error: 'Failed to approve skill' }, { status: 500 })
    }
    
    // Update publisher reputation (optional - RPC might not exist)
    if (skill.publisher_id) {
      try {
        await supabaseAdmin.rpc('increment_reputation', {
          publisher_id: skill.publisher_id,
          amount: 10,
        })
      } catch {
        // RPC might not exist yet, ignore
      }
    }
    
    return NextResponse.json({
      message: 'Skill approved',
      skill: updatedSkill,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
