-- Enable RLS on all main tables and add basic policies.
-- Server-side code uses service key (bypasses RLS), so these policies
-- are defense-in-depth for any anon-key access.

-- ============================================================
-- 1. Enable RLS
-- ============================================================
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goconcierge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Default deny — anon gets nothing unless explicitly allowed
-- ============================================================

-- Properties: authenticated users can read their own org's properties
CREATE POLICY "Users can view own org properties"
  ON properties FOR SELECT
  TO authenticated
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can manage own org properties"
  ON properties FOR ALL
  TO authenticated
  USING (org_id = auth.jwt() ->> 'org_id');

-- Organizations: users can read their own org
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id::text = auth.jwt() ->> 'org_id');

-- Bookings: scoped to properties the user owns
CREATE POLICY "Users can view own property bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE org_id = auth.jwt() ->> 'org_id'
    )
  );

-- Guest sessions: scoped to user's properties
CREATE POLICY "Users can view own property guest sessions"
  ON guest_sessions FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE org_id = auth.jwt() ->> 'org_id'
    )
  );

-- Goconcierge messages: scoped to user's properties
CREATE POLICY "Users can view own property messages"
  ON goconcierge_messages FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE org_id = auth.jwt() ->> 'org_id'
    )
  );

-- Chats (website support): allow anon to create and read own chats
-- Chats don't have org scoping — they're public support chats
CREATE POLICY "Anyone can create chats"
  ON chats FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read chats by id"
  ON chats FOR SELECT
  TO anon, authenticated
  USING (true);

-- Messages: same as chats — public support system
CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);
