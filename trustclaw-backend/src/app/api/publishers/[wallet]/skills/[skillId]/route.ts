import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// DELETE /api/publishers/[wallet]/skills/[skillId] - Delete a skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string; skillId: string }> }
) {
  try {
    const { wallet, skillId } = await params

    // Verify publisher owns this skill
    const { data: publisher } = await supabaseAdmin
      .from('publishers')
      .select('id')
      .eq('wallet_address', wallet)
      .single()

    if (!publisher) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }

    const { data: skill } = await supabaseAdmin
      .from('skills')
      .select('id, publisher_id')
      .eq('id', skillId)
      .single()

    if (!skill || skill.publisher_id !== publisher.id) {
      return NextResponse.json({ error: 'Skill not found or not owned by you' }, { status: 403 })
    }

    // Delete related records first
    await supabaseAdmin.from('scans').delete().eq('skill_id', skillId)
    await supabaseAdmin.from('reviews').delete().eq('skill_id', skillId)
    await supabaseAdmin.from('reports').delete().eq('skill_id', skillId)

    const { error } = await supabaseAdmin.from('skills').delete().eq('id', skillId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Skill deleted' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/publishers/[wallet]/skills/[skillId] - Update a skill
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string; skillId: string }> }
) {
  try {
    const { wallet, skillId } = await params
    const body = await request.json()

    const { data: publisher } = await supabaseAdmin
      .from('publishers')
      .select('id')
      .eq('wallet_address', wallet)
      .single()

    if (!publisher) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }

    const { data: skill } = await supabaseAdmin
      .from('skills')
      .select('id, publisher_id')
      .eq('id', skillId)
      .single()

    if (!skill || skill.publisher_id !== publisher.id) {
      return NextResponse.json({ error: 'Skill not found or not owned by you' }, { status: 403 })
    }

    // Only allow updating certain fields
    const allowedFields: Record<string, unknown> = {}
    if (body.description !== undefined) allowedFields.description = body.description
    if (body.version !== undefined) allowedFields.version = body.version
    if (body.category !== undefined) allowedFields.category = body.category
    if (body.tags !== undefined) allowedFields.tags = body.tags

    const { data: updated, error } = await supabaseAdmin
      .from('skills')
      .update(allowedFields)
      .eq('id', skillId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
    }

    return NextResponse.json({ skill: updated })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
