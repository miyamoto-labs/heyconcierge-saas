-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- Enable RLS
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by our admin client)
CREATE POLICY "Service role full access on property_images"
  ON property_images FOR ALL
  USING (true)
  WITH CHECK (true);
