-- HeyConcierge OTA Integration: GetYourGuide + Viator
-- Migration 013: Activity cache, affiliate tracking, search analytics, OTA config

-- ============================================================
-- 0. Add latitude/longitude to properties table (needed for location-based activity search)
-- ============================================================
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- ============================================================
-- 1. Activity Cache — stores normalized activities from OTA APIs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('getyourguide', 'viator')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  price_amount NUMERIC(10,2),
  price_currency TEXT DEFAULT 'EUR',
  rating NUMERIC(3,1),
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  booking_url TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  city TEXT,
  country TEXT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_cache_location ON activity_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_activity_cache_city ON activity_cache(city, country);
CREATE INDEX IF NOT EXISTS idx_activity_cache_provider ON activity_cache(provider);
CREATE INDEX IF NOT EXISTS idx_activity_cache_rating ON activity_cache(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_activity_cache_updated ON activity_cache(updated_at);

-- ============================================================
-- 2. Property OTA Configuration — per-property settings
-- ============================================================
CREATE TABLE IF NOT EXISTS property_ota_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  getyourguide_enabled BOOLEAN DEFAULT true,
  viator_enabled BOOLEAN DEFAULT true,
  auto_recommend BOOLEAN DEFAULT true,
  max_recommendations INTEGER DEFAULT 3,
  min_rating NUMERIC(3,1) DEFAULT 4.0,
  max_price_eur NUMERIC(10,2),
  preferred_categories TEXT[],
  custom_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id)
);

-- ============================================================
-- 3. Activity Bookings — guest bookings through HC (Phase 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_phone TEXT NOT NULL,
  guest_name TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('getyourguide', 'viator')),
  external_booking_id TEXT,
  activity_external_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  booking_date DATE,
  participants INTEGER DEFAULT 1,
  total_price NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  commission_amount NUMERIC(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  voucher_url TEXT,
  raw_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_bookings_property ON activity_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_activity_bookings_guest ON activity_bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_activity_bookings_status ON activity_bookings(status) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_activity_bookings_date ON activity_bookings(booking_date);

-- ============================================================
-- 4. Activity Search Analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_phone TEXT,
  query TEXT,
  location TEXT,
  results_count INTEGER DEFAULT 0,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_searches_property ON activity_searches(property_id, created_at DESC);

-- ============================================================
-- 5. Affiliate Click Tracking — log every click for conversion tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  activity_provider TEXT NOT NULL CHECK (activity_provider IN ('getyourguide', 'viator')),
  activity_external_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  guest_phone TEXT,
  booking_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_clicks_property ON activity_clicks(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_clicks_provider ON activity_clicks(activity_provider);

-- ============================================================
-- 6. Row Level Security
-- ============================================================

-- activity_cache: public read, service role write
ALTER TABLE activity_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cached activities"
  ON activity_cache FOR SELECT TO authenticated USING (true);

-- property_ota_configs: property owners only
ALTER TABLE property_ota_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners manage OTA configs"
  ON property_ota_configs FOR ALL TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      JOIN organizations o ON p.org_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT p.id FROM properties p
      JOIN organizations o ON p.org_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- activity_bookings: property owners see their bookings
ALTER TABLE activity_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners see activity bookings"
  ON activity_bookings FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      JOIN organizations o ON p.org_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- activity_searches: property owners see their analytics
ALTER TABLE activity_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners see search analytics"
  ON activity_searches FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      JOIN organizations o ON p.org_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- activity_clicks: property owners see their click analytics
ALTER TABLE activity_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Property owners see click analytics"
  ON activity_clicks FOR SELECT TO authenticated
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      JOIN organizations o ON p.org_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. Update triggers (reuse existing function)
-- ============================================================
CREATE TRIGGER update_activity_cache_updated_at
  BEFORE UPDATE ON activity_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_property_ota_configs_updated_at
  BEFORE UPDATE ON property_ota_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_activity_bookings_updated_at
  BEFORE UPDATE ON activity_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
