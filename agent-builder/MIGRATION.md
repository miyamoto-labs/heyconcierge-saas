# Database Migration Guide

## Prerequisites

- Access to Supabase Dashboard for project `ljseawnwxbkrejwysrey`
- Service role key configured in `.env.local`

## Steps

### 1. Create Tables

Go to: https://supabase.com/dashboard/project/ljseawnwxbkrejwysrey/sql

Paste and run the following SQL:

```sql
-- Agent Projects Table
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

-- Agent Templates Table
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
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

-- Agent Exports Table
CREATE TABLE IF NOT EXISTS agent_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES agent_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('openclaw', 'python', 'docker', 'json')),
  output JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_exports ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage own projects" ON agent_projects;
CREATE POLICY "Users can manage own projects" ON agent_projects 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read templates" ON agent_templates;
CREATE POLICY "Anyone can read templates" ON agent_templates 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON agent_templates;
CREATE POLICY "Admins can manage templates" ON agent_templates 
  FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@miyamotolabs.com'));

DROP POLICY IF EXISTS "Users can manage own exports" ON agent_exports;
CREATE POLICY "Users can manage own exports" ON agent_exports 
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Seed Templates

After tables are created, seed the templates:

```bash
node scripts/seed-templates.js
```

Or via API after deployment:

```bash
curl -X POST 'https://agent-builder-gamma.vercel.app/api/migrate?secret=agentforge-2026'
```

## Verification

Check that tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'agent_%';
```

Check template count:

```sql
SELECT COUNT(*) FROM agent_templates;
-- Should return 5 (or more if additional templates were added)
```

## Rollback

To remove tables:

```sql
DROP TABLE IF EXISTS agent_exports CASCADE;
DROP TABLE IF EXISTS agent_projects CASCADE;
DROP TABLE IF EXISTS agent_templates CASCADE;
```

## Notes

- Tables use UUID primary keys
- RLS (Row Level Security) is enabled for all tables
- Templates are publicly readable
- Projects and exports are private (user_id scoped)
- Auto-timestamps on all tables
