-- Migration 002: Add escalation tracking and booking URL

-- Create escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  ai_response TEXT,
  reason TEXT NOT NULL, -- 'cant_answer', 'needs_human', 'urgent'
  status TEXT NOT NULL DEFAULT 'pending', -- pending, acknowledged, resolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add booking_url to property_config_sheets
ALTER TABLE property_config_sheets 
ADD COLUMN IF NOT EXISTS booking_url TEXT;

-- Create index for faster escalation queries
CREATE INDEX IF NOT EXISTS idx_escalations_property_status 
ON escalations(property_id, status);

-- Create index for unresolved escalations
CREATE INDEX IF NOT EXISTS idx_escalations_pending 
ON escalations(status) WHERE status = 'pending';
