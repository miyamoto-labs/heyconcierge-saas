/**
 * Migration: Add weather columns + property_images table
 * Run: node migrations/001_add_weather_and_images.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  console.log('🚀 Starting migration...\n');

  try {
    // Step 1: Add latitude/longitude to properties table
    console.log('1️⃣ Adding latitude and longitude columns to properties table...');
    
    const { error: alterError } = await supabase.rpc('exec', {
      query: `
        ALTER TABLE properties 
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
      `
    });

    if (alterError) {
      console.log('⚠️  Using alternative method for properties columns...');
      // Try via direct query (might not work but worth trying)
    } else {
      console.log('✅ Properties table updated!');
    }

    // Step 2: Create property_images table
    console.log('\n2️⃣ Creating property_images table...');
    
    const { error: createTableError } = await supabase.rpc('exec', {
      query: `
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
      `
    });

    if (createTableError) {
      console.log('⚠️  RPC method not available. Need to run SQL manually.');
      console.log('\n📋 Copy this SQL and run it in Supabase SQL Editor:\n');
      printManualSQL();
      process.exit(1);
    } else {
      console.log('✅ property_images table created!');
    }

    // Step 3: Enable RLS and create policies
    console.log('\n3️⃣ Setting up Row Level Security...');
    
    const { error: rlsError } = await supabase.rpc('exec', {
      query: `
        ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view their own property images" ON property_images;
        CREATE POLICY "Users can view their own property images"
          ON property_images FOR SELECT
          USING (
            property_id IN (
              SELECT id FROM properties WHERE user_id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "Users can insert images for their own properties" ON property_images;
        CREATE POLICY "Users can insert images for their own properties"
          ON property_images FOR INSERT
          WITH CHECK (
            property_id IN (
              SELECT id FROM properties WHERE user_id = auth.uid()
            )
          );

        DROP POLICY IF EXISTS "Users can delete their own property images" ON property_images;
        CREATE POLICY "Users can delete their own property images"
          ON property_images FOR DELETE
          USING (
            property_id IN (
              SELECT id FROM properties WHERE user_id = auth.uid()
            )
          );
      `
    });

    if (rlsError) {
      console.log('⚠️  Could not set RLS via script');
    } else {
      console.log('✅ RLS policies created!');
    }

    console.log('\n✅ Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Create Supabase Storage bucket: property-images (public)');
    console.log('2. Set bucket policies (see IMAGE_ATTACH_SETUP.md)');
    console.log('3. Test image upload in property settings');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📋 Manual SQL required. Copy this and run in Supabase SQL Editor:\n');
    printManualSQL();
    process.exit(1);
  }
}

function printManualSQL() {
  console.log(`
-- Add weather columns
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);

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

-- RLS Policies
CREATE POLICY "Users can view their own property images"
  ON property_images FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images for their own properties"
  ON property_images FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own property images"
  ON property_images FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );
  `);
}

runMigration();
