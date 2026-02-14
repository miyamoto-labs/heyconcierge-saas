-- Migration 003: Guest Ratings (Feature 12)

CREATE TABLE IF NOT EXISTS guest_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_phone TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_ratings_property 
ON guest_ratings(property_id, created_at);
