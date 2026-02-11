import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/skills/submit - Submit a new skill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      version = '1.0.0', 
      git_url, 
      package_url, 
      wallet_address, 
      github_username,
      category,
      tags,
      readme,
    } = body
    
    // Validate required fields
    if (!name || !wallet_address) {
      return NextResponse.json(
        { error: 'Name and wallet_address are required' },
        { status: 400 }
      )
    }
    
    if (!git_url && !package_url) {
      return NextResponse.json(
        { error: 'Either git_url or package_url is required' },
        { status: 400 }
      )
    }
    
    // Get or create publisher
    let { data: publisher } = await supabaseAdmin
      .from('publishers')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single()
    
    if (!publisher) {
      // Create new publisher
      const { data: newPublisher, error: createError } = await supabaseAdmin
        .from('publishers')
        .insert({
          wallet_address,
          github_username: github_username || null,
          display_name: github_username || wallet_address.substring(0, 8) + '...',
          verified: false,
          stake_amount: 0,
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating publisher:', createError)
        return NextResponse.json({ error: 'Failed to create publisher' }, { status: 500 })
      }
      
      publisher = newPublisher
    }
    
    // Check for duplicate skill name from same publisher
    const { data: existingSkill } = await supabaseAdmin
      .from('skills')
      .select('id')
      .eq('name', name)
      .eq('publisher_id', publisher.id)
      .single()
    
    if (existingSkill) {
      return NextResponse.json(
        { error: 'You have already submitted a skill with this name' },
        { status: 409 }
      )
    }
    
    // Create skill submission
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .insert({
        name,
        description,
        version,
        git_url,
        package_url,
        publisher_id: publisher.id,
        status: 'pending',
        category,
        tags,
        readme,
      })
      .select(`
        *,
        publisher:publishers(id, wallet_address, display_name, github_username)
      `)
      .single()
    
    if (skillError) {
      console.error('Error creating skill:', skillError)
      return NextResponse.json({ error: 'Failed to submit skill' }, { status: 500 })
    }
    
    return NextResponse.json({
      message: 'Skill submitted successfully',
      skill,
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
