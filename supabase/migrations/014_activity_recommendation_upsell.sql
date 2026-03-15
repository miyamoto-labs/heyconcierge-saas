-- Migration 014: Activity recommendation as proactive upsell type
-- Extends upsell_configs with activity recommendation settings
-- Expands upsell_offers offer_type CHECK to include 'activity_recommendation'
-- Adds offer_id tracking to activity_clicks for attribution

-- ============================================================
-- 1. Add activity recommendation config columns to upsell_configs
-- ============================================================

ALTER TABLE upsell_configs
  ADD COLUMN IF NOT EXISTS activity_recommendation_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS activity_recommendation_send_hours_after_checkin INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS activity_recommendation_max_activities INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS activity_recommendation_category_preference TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS activity_recommendation_radius_km INTEGER NOT NULL DEFAULT 25;

-- ============================================================
-- 2. Expand offer_type CHECK constraint on upsell_offers
-- ============================================================

ALTER TABLE upsell_offers
  DROP CONSTRAINT IF EXISTS upsell_offers_offer_type_check;

ALTER TABLE upsell_offers
  ADD CONSTRAINT upsell_offers_offer_type_check
  CHECK (offer_type IN (
    'late_checkout', 'early_checkin', 'gap_night',
    'stay_extension', 'review_request', 'activity_recommendation'
  ));

-- ============================================================
-- 3. Add offer_id to activity_clicks for proactive offer attribution
-- ============================================================

ALTER TABLE activity_clicks
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES upsell_offers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_clicks_offer ON activity_clicks(offer_id)
  WHERE offer_id IS NOT NULL;
