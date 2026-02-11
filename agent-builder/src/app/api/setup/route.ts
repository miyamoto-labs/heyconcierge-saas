import { createServiceClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createServiceClient()
  
  // Create tables using raw SQL
  const sql = `
    -- Agent Projects
    CREATE TABLE IF NOT EXISTS agent_projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      template_id UUID,
      config JSONB DEFAULT '{}',
      nodes JSONB DEFAULT '[]',
      edges JSONB DEFAULT '[]',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deployed')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Agent Templates
    CREATE TABLE IF NOT EXISTS agent_templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL,
      icon TEXT DEFAULT '🤖',
      config JSONB DEFAULT '{}',
      nodes JSONB DEFAULT '[]',
      edges JSONB DEFAULT '[]',
      is_premium BOOLEAN DEFAULT false,
      uses INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Agent Exports
    CREATE TABLE IF NOT EXISTS agent_exports (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID REFERENCES agent_projects(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      format TEXT NOT NULL CHECK (format IN ('openclaw', 'python', 'docker', 'json')),
      output JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- RLS Policies
    ALTER TABLE agent_projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE agent_exports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can manage own projects" ON agent_projects;
    CREATE POLICY "Users can manage own projects" ON agent_projects FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Anyone can read templates" ON agent_templates;
    CREATE POLICY "Anyone can read templates" ON agent_templates FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Users can manage own exports" ON agent_exports;
    CREATE POLICY "Users can manage own exports" ON agent_exports FOR ALL USING (auth.uid() = user_id);
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('Database setup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Database tables created successfully' })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
