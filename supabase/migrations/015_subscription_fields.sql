-- Migration 015: Add subscription management fields to organizations
-- Supports per-property pricing, webhook sync, and Stripe state mirroring

-- Add missing Stripe sync columns
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_webhook_event_id TEXT;

-- Update subscription_status CHECK to include 'past_due' for failed payments
-- First drop the existing constraint, then re-add with new values
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled', 'churned'));

-- Update trial_ends_at default for new 30-day trial (doesn't affect existing rows)
-- Trial length is set in application code, this is just documentation

-- Webhook event log for idempotency and audit
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB,
  organization_id UUID REFERENCES organizations(id),
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id
  ON stripe_webhook_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_org_id
  ON stripe_webhook_events(organization_id);

-- Index for looking up orgs by Stripe customer ID (used in webhook handler)
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id
  ON organizations(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
