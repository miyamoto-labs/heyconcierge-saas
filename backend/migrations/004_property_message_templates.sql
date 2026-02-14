-- Migration 004: Property Message Templates (Feature 5)

CREATE TABLE IF NOT EXISTS property_message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('welcome', 'midstay', 'checkout')),
  message_template TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, template_type)
);

-- Default templates will be inserted per-property when first accessed
