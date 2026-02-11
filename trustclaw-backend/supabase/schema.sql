-- TrustClaw Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Publishers table
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  github_username TEXT,
  display_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  stake_amount DECIMAL(20, 9) DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  git_url TEXT,
  package_url TEXT,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'verified', 'rejected', 'blocked')),
  scan_result TEXT CHECK (scan_result IN ('pass', 'warn', 'fail', NULL)),
  downloads INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  readme TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scans table
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'security',
  result TEXT NOT NULL CHECK (result IN ('pass', 'warn', 'fail')),
  findings JSONB DEFAULT '[]'::jsonb,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table (for community flagging)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  reporter_wallet TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_publisher ON skills(publisher_id);
CREATE INDEX idx_skills_created ON skills(created_at DESC);
CREATE INDEX idx_scans_skill ON scans(skill_id);
CREATE INDEX idx_reviews_skill ON reviews(skill_id);
CREATE INDEX idx_publishers_wallet ON publishers(wallet_address);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_publishers_updated_at
  BEFORE UPDATE ON publishers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read access for verified skills
CREATE POLICY "Public can view verified skills"
  ON skills FOR SELECT
  USING (status = 'verified');

-- Public read access for publishers
CREATE POLICY "Public can view publishers"
  ON publishers FOR SELECT
  USING (true);

-- Public read access for scans of verified skills
CREATE POLICY "Public can view scans of verified skills"
  ON scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM skills 
      WHERE skills.id = scans.skill_id 
      AND skills.status = 'verified'
    )
  );

-- Public read access for reviews
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Service role has full access (for API routes)
-- Note: Use service_role key for admin operations
