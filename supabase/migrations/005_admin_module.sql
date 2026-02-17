-- Admin users table (internal employees only, separate from host users)
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'support'
                CHECK (role IN ('super_admin','admin','support','finance')),
  password_hash TEXT NOT NULL,
  mfa_secret    TEXT,
  mfa_enabled   BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  invited_by    UUID REFERENCES admin_users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Session store for admin logins
CREATE TABLE IF NOT EXISTS admin_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token         TEXT UNIQUE NOT NULL,
  mfa_verified  BOOLEAN DEFAULT false,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Billing state on organizations (pending Erik approval — add columns safely)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing'
  CHECK (subscription_status IN ('trialing','active','cancelled','churned'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
