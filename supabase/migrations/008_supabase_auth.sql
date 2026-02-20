-- Migration 008: Add Supabase Auth support
-- Run in Supabase SQL Editor

-- Add Supabase Auth UUID to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS supabase_auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON public.users(supabase_auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Add auth UUID to organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS auth_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_organizations_auth_user_id ON public.organizations(auth_user_id);

-- Auto-sync: when user gets mapped, update their org too
CREATE OR REPLACE FUNCTION sync_org_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.organizations SET auth_user_id = NEW.supabase_auth_id
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_org_auth_user_id ON public.users;
CREATE TRIGGER trigger_sync_org_auth_user_id
  AFTER UPDATE OF supabase_auth_id ON public.users
  FOR EACH ROW
  WHEN (NEW.supabase_auth_id IS NOT NULL AND OLD.supabase_auth_id IS NULL)
  EXECUTE FUNCTION sync_org_auth_user_id();
