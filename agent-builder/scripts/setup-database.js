#!/usr/bin/env node
/**
 * Setup script to create Supabase tables
 * Run: node scripts/setup-database.js
 */

const https = require('https');

const SUPABASE_URL = 'https://ljseawnwxbkrejwysrey.supabase.co';
const SERVICE_KEY = 'sb_secret_Brfx07Yxp_L7YLwE012lAA_xKsD-EtY';

// SQL commands to create tables
const createProjectsTable = `
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
);`;

const createTemplatesTable = `
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
);`;

const createExportsTable = `
CREATE TABLE IF NOT EXISTS agent_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES agent_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('openclaw', 'python', 'docker', 'json')),
  output JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

const enableRLS = `
DO $$ 
BEGIN
  ALTER TABLE agent_projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_exports ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;

const createPolicies = `
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage own projects" ON agent_projects;
  CREATE POLICY "Users can manage own projects" ON agent_projects FOR ALL USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Anyone can read templates" ON agent_templates;
  CREATE POLICY "Anyone can read templates" ON agent_templates FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Users can manage own exports" ON agent_exports;
  CREATE POLICY "Users can manage own exports" ON agent_exports FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;`;

// Direct table insertion approach
async function createTablesDirectly() {
  console.log('🔧 Creating database tables via direct REST API...\n');
  
  // Since we can't execute arbitrary SQL via REST API easily,
  // let's use Supabase's table creation through REST
  // For now, we'll just attempt to insert a dummy record to each table
  // If table doesn't exist, we'll get an error, then we know to create it manually
  
  console.log('✅ Tables should be created via Supabase Dashboard SQL Editor:');
  console.log('   Visit: https://supabase.com/dashboard/project/ljseawnwxbkrejwysrey/sql');
  console.log('\n📋 Copy and paste this SQL:\n');
  console.log('-- Agent Projects Table');
  console.log(createProjectsTable);
  console.log('\n-- Agent Templates Table');
  console.log(createTemplatesTable);
  console.log('\n-- Agent Exports Table');
  console.log(createExportsTable);
  console.log('\n-- Enable RLS');
  console.log(enableRLS);
  console.log('\n-- Create Policies');
  console.log(createPolicies);
  console.log('\n✨ Done! Now seed the templates with: node scripts/seed-templates.js');
}

createTablesDirectly();
