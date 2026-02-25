-- 011_hostaway_integration.sql
-- Adds Hostaway PMS integration: extends bookings table, adds hostaway_connections, enriches guest_sessions

-- =============================================================================
-- 1. Extend bookings table with Hostaway-specific fields
-- =============================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hostaway_reservation_id BIGINT,
  ADD COLUMN IF NOT EXISTS hostaway_listing_id BIGINT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_first_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_last_name TEXT,
  ADD COLUMN IF NOT EXISTS channel_name TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_code TEXT,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS door_code TEXT,
  ADD COLUMN IF NOT EXISTS hostaway_status TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ical';

-- Unique index for upsert by Hostaway reservation ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_hostaway_res_id
  ON bookings(hostaway_reservation_id) WHERE hostaway_reservation_id IS NOT NULL;

-- =============================================================================
-- 2. Create hostaway_connections table (maps Hostaway listings to HC properties)
-- =============================================================================

CREATE TABLE IF NOT EXISTS hostaway_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  hostaway_listing_id BIGINT NOT NULL,
  hostaway_account_id TEXT,
  webhook_secret TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, hostaway_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_hostaway_connections_listing
  ON hostaway_connections(hostaway_listing_id);

-- =============================================================================
-- 3. Extend guest_sessions with booking context
-- =============================================================================

ALTER TABLE guest_sessions
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;
