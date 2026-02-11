-- Run this in Supabase SQL Editor to create the subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow service role full access (RLS disabled for this table since we use service key)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: service role can do everything (API routes use service key)
CREATE POLICY "Service role full access" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
