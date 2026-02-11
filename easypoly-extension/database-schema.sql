-- Polymarket auth storage table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS polymarket_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL UNIQUE,
  auth_data TEXT NOT NULL, -- Encrypted JSON blob containing all auth data
  bearer_token TEXT, -- Extracted bearer token for quick access
  magic_api_key TEXT, -- Magic API key
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional: when we think the auth might expire
  last_used_at TIMESTAMPTZ, -- Last time this auth was used for a trade
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

-- Index for quick lookups
CREATE INDEX idx_polymarket_auth_telegram_user_id ON polymarket_auth(telegram_user_id);
CREATE INDEX idx_polymarket_auth_status ON polymarket_auth(status);

-- Enable RLS (Row Level Security)
ALTER TABLE polymarket_auth ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything
CREATE POLICY "Service role can manage polymarket_auth"
  ON polymarket_auth
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_polymarket_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_polymarket_auth_updated_at
  BEFORE UPDATE ON polymarket_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_polymarket_auth_updated_at();

-- Sample query to check stored auth
-- SELECT telegram_user_id, bearer_token IS NOT NULL as has_bearer, magic_api_key IS NOT NULL as has_magic, captured_at, status FROM polymarket_auth;
