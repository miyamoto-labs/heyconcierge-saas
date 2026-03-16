-- Migration 003: Add revenue tracking for affiliate and upsell revenue
-- HeyConcierge Revenue Dashboard

-- Revenue config columns on upsell_configs (per-property settings)
ALTER TABLE upsell_configs
  ADD COLUMN IF NOT EXISTS affiliate_revenue_share_host_pct NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS affiliate_avg_commission_pct NUMERIC(5,2) DEFAULT 8,
  ADD COLUMN IF NOT EXISTS affiliate_estimated_conversion_pct NUMERIC(5,2) DEFAULT 3;

-- Add estimated commission to activity clicks for per-click revenue tracking
ALTER TABLE activity_clicks
  ADD COLUMN IF NOT EXISTS estimated_commission NUMERIC(10,2) DEFAULT NULL;

-- Monthly revenue summary materialized view
-- Aggregates upsell + affiliate revenue per property per month
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT
  p.id AS property_id,
  p.name AS property_name,
  date_trunc('month', COALESCE(o.responded_at, o.sent_at, o.created_at)) AS month,

  -- Upsell revenue (accepted offers)
  COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) AS accepted_offers,
  COALESCE(SUM(CASE WHEN o.status = 'accepted' THEN o.price ELSE 0 END), 0) AS upsell_revenue,

  -- Offer stats
  COUNT(o.id) AS total_offers,
  COUNT(CASE WHEN o.status = 'sent' THEN 1 END) AS sent_offers,
  COUNT(CASE WHEN o.status = 'declined' THEN 1 END) AS declined_offers,

  -- Affiliate clicks (joined separately)
  0 AS affiliate_clicks

FROM properties p
LEFT JOIN upsell_offers o ON o.property_id = p.id
GROUP BY p.id, p.name, date_trunc('month', COALESCE(o.responded_at, o.sent_at, o.created_at));
