-- Admin settings (key-value store for platform configuration)
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default: all plans visible
INSERT INTO admin_settings (key, value) VALUES
  ('visible_plans', '["starter", "professional", "premium"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
