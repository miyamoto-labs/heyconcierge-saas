-- Multi-tenant WhatsApp routing for HeyConcierge
-- Run this in Supabase SQL Editor

-- 1. Add property_code to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_code TEXT UNIQUE;

-- 2. Generate codes for existing properties
UPDATE properties 
SET property_code = 'HC-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 6))
WHERE property_code IS NULL;

-- 3. Create guest_sessions table
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, property_id)
);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_guest_sessions_phone ON guest_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_property ON guest_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_code ON properties(property_code);

-- 5. Auto-generate property_code on new properties
CREATE OR REPLACE FUNCTION generate_property_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_code IS NULL THEN
    NEW.property_code := 'HC-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_code ON properties;
CREATE TRIGGER trg_property_code
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_property_code();
