-- Add pilot flag to organizations (already applied in init_full_schema.sql)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_pilot BOOLEAN DEFAULT false;
