-- Add users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
