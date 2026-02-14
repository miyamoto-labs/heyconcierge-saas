/**
 * Add latitude/longitude columns to properties table
 * Run once: node add_weather_columns.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addColumns() {
  try {
    console.log('Adding latitude and longitude columns to properties table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE properties 
        ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
      `
    });
    
    if (error) {
      // Try direct approach if RPC doesn't exist
      console.log('RPC not available, columns may already exist or need manual migration');
      console.log('Run this SQL in Supabase SQL Editor:');
      console.log(`
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
      `);
    } else {
      console.log('✅ Columns added successfully!');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nManual migration required. Run this in Supabase SQL Editor:');
    console.log(`
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
    `);
  }
}

addColumns();
