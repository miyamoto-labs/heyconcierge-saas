import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateExport } from '@/lib/export-generator'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljseawnwxbkrejwysrey.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MEy6zRFneVmATZnAEwDqLQ_3_JwARoa'
  )

  const { data: project, error } = await supabase.from('agent_projects').select('*').eq('id', params.id).single()
  if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const files = generateExport(project.name, project.description || '', project.nodes || [], project.edges || [])
  return NextResponse.json({ files })
}
