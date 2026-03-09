-- Guest ratings (submitted by guests after checkout via Telegram/WhatsApp)
-- Guest phone is NOT stored here — looked up from bookings table at send time
CREATE TABLE guest_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  channel TEXT CHECK (channel IN ('whatsapp', 'telegram')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'completed', 'expired')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guest_ratings_property ON guest_ratings(property_id);
CREATE INDEX idx_guest_ratings_status ON guest_ratings(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_guest_ratings_booking ON guest_ratings(booking_id);

-- Platform ratings (hosts rate the HeyConcierge service)
CREATE TABLE platform_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_ratings_org ON platform_ratings(org_id);
