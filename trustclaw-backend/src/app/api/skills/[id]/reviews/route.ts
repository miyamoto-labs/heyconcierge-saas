import { NextRequest, NextResponse } from 'next/server'
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase'

// GET /api/skills/[id]/reviews - Get reviews for a skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        publisher:publishers(id, display_name, github_username, verified)
      `)
      .eq('skill_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: reviews || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/skills/[id]/reviews - Submit a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { wallet_address, rating, comment } = body

    if (!wallet_address || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'wallet_address and rating (1-5) are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Find publisher by wallet
    const { data: publisher } = await supabaseAdmin
      .from('publishers')
      .select('id')
      .eq('wallet_address', wallet_address)
      .single()

    if (!publisher) {
      return NextResponse.json({ error: 'Publisher not found. Create a profile first.' }, { status: 404 })
    }

    // Check for existing review
    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('skill_id', id)
      .eq('publisher_id', publisher.id)
      .single()

    if (existing) {
      // Update existing review
      const { data: review, error } = await supabaseAdmin
        .from('reviews')
        .update({ rating, comment })
        .eq('id', existing.id)
        .select(`*, publisher:publishers(id, display_name, github_username, verified)`)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
      }
      return NextResponse.json({ review })
    }

    // Create new review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        skill_id: id,
        publisher_id: publisher.id,
        rating,
        comment: comment || null,
      })
      .select(`*, publisher:publishers(id, display_name, github_username, verified)`)
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
