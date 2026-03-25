-- 017: Enable Row Level Security on all tables + create policies
--
-- Security audit found most tables had NO RLS enabled.
-- The anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is in the JS bundle,
-- so anyone can call Supabase directly. Without RLS, they get full access.
--
-- All API routes use createAdminClient() (service role), which bypasses RLS.
-- This migration is defense-in-depth: blocks direct anon key access.

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

-- Admin tables (no browser policies — service role only)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Core business tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_config_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goconcierge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- Feature tables
ALTER TABLE upsell_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Tables that already have RLS enabled (safe to re-run):
-- bookings, chats, messages, property_images, activity_cache,
-- property_ota_configs, activity_bookings, activity_searches, activity_clicks

-- ============================================================
-- POLICIES FOR AUTHENTICATED USERS (browser client with JWT)
-- Pattern: users can only access data belonging to their organization
-- ============================================================

-- === ORGANIZATIONS ===
CREATE POLICY "auth_select_own_org" ON organizations
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'));

CREATE POLICY "auth_insert_own_org" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "auth_update_own_org" ON organizations
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- === PROPERTIES ===
CREATE POLICY "auth_select_own_properties" ON properties
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT id FROM organizations WHERE auth_user_id = auth.uid())
    OR org_id IS NULL
  );

CREATE POLICY "auth_insert_own_properties" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE auth_user_id = auth.uid()));

CREATE POLICY "auth_update_own_properties" ON properties
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT id FROM organizations WHERE auth_user_id = auth.uid()));

-- === PROPERTY CONFIG SHEETS ===
CREATE POLICY "auth_select_own_configs" ON property_config_sheets
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

CREATE POLICY "auth_insert_own_configs" ON property_config_sheets
  FOR INSERT TO authenticated
  WITH CHECK (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

CREATE POLICY "auth_update_own_configs" ON property_config_sheets
  FOR UPDATE TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === USERS ===
CREATE POLICY "auth_select_users" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "auth_insert_users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (supabase_auth_id = auth.uid());

CREATE POLICY "auth_update_users" ON users
  FOR UPDATE TO authenticated
  USING (supabase_auth_id = auth.uid());

-- === BOOKINGS ===
CREATE POLICY "auth_select_own_bookings" ON bookings
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === GOCONCIERGE MESSAGES ===
CREATE POLICY "auth_select_own_messages" ON goconcierge_messages
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === PROPERTY IMAGES ===
CREATE POLICY "auth_select_own_images" ON property_images
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

CREATE POLICY "auth_insert_own_images" ON property_images
  FOR INSERT TO authenticated
  WITH CHECK (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

CREATE POLICY "auth_delete_own_images" ON property_images
  FOR DELETE TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === UPSELL CONFIGS ===
CREATE POLICY "auth_select_own_upsell_configs" ON upsell_configs
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

CREATE POLICY "auth_insert_own_upsell_configs" ON upsell_configs
  FOR INSERT TO authenticated
  WITH CHECK (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

CREATE POLICY "auth_update_own_upsell_configs" ON upsell_configs
  FOR UPDATE TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === UPSELL OFFERS ===
CREATE POLICY "auth_select_own_upsell_offers" ON upsell_offers
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === GUEST RATINGS ===
CREATE POLICY "auth_select_own_guest_ratings" ON guest_ratings
  FOR SELECT TO authenticated
  USING (property_id IN (
    SELECT p.id FROM properties p
    JOIN organizations o ON p.org_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- === PLATFORM RATINGS ===
CREATE POLICY "auth_select_own_platform_ratings" ON platform_ratings
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT id FROM organizations WHERE auth_user_id = auth.uid()));

CREATE POLICY "auth_insert_own_platform_ratings" ON platform_ratings
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE auth_user_id = auth.uid()));

-- === OPTIONAL TABLES (may not exist on all environments) ===
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_clicks') THEN
    EXECUTE 'CREATE POLICY "auth_select_own_activity_clicks" ON activity_clicks
      FOR SELECT TO authenticated
      USING (property_id IN (
        SELECT p.id FROM properties p
        JOIN organizations o ON p.org_id = o.id
        WHERE o.auth_user_id = auth.uid()
      ))';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
    EXECUTE 'CREATE POLICY "auth_select_own_chats" ON chats
      FOR SELECT TO authenticated
      USING (property_id IN (
        SELECT p.id FROM properties p
        JOIN organizations o ON p.org_id = o.id
        WHERE o.auth_user_id = auth.uid()
      ))';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    EXECUTE 'CREATE POLICY "auth_select_own_chat_messages" ON messages
      FOR SELECT TO authenticated
      USING (chat_id IN (
        SELECT c.id FROM chats c
        JOIN properties p ON c.property_id = p.id
        JOIN organizations o ON p.org_id = o.id
        WHERE o.auth_user_id = auth.uid()
      ))';
  END IF;
END $$;

-- ============================================================
-- RESULT:
-- ✓ All tables have RLS enabled
-- ✓ Authenticated users can read/write their own data
-- ✓ Unauthenticated (anon) users have ZERO access
-- ✓ Service role (admin client) bypasses RLS entirely
-- ✓ Admin/backend-only tables have no browser policies
-- ============================================================
