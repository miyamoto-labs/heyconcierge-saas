#!/usr/bin/env node
// Seed TrustClaw database with starter skills

const seedData = require('./seeds/seed-data.json');

const SUPABASE_URL = 'https://ljseawnwxbkrejwysrey.supabase.co';
const SERVICE_KEY = 'sb_secret_Brfx07Yxp_L7YLwE012lAA_xKsD-EtY';

async function seed() {
  console.log('🌱 Seeding TrustClaw database...\n');
  
  // First, create a seed publisher
  const publisherRes = await fetch(`${SUPABASE_URL}/rest/v1/publishers`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      wallet_address: '0x0000000000000000000000000000000000000SEED',
      display_name: 'TrustClaw Team',
      github_username: 'trustclaw',
      verified: true,
      reputation_score: 100
    })
  });
  
  let publisher;
  if (publisherRes.ok) {
    const publishers = await publisherRes.json();
    publisher = publishers[0];
    console.log('✅ Created seed publisher:', publisher.display_name);
  } else {
    // Publisher might already exist, try to fetch it
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/publishers?wallet_address=eq.0x0000000000000000000000000000000000000SEED`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      }
    );
    const existing = await existingRes.json();
    if (existing.length > 0) {
      publisher = existing[0];
      console.log('ℹ️  Using existing seed publisher:', publisher.display_name);
    } else {
      console.error('❌ Failed to create publisher:', await publisherRes.text());
      process.exit(1);
    }
  }
  
  // Insert skills (using only columns that exist in the actual DB)
  let inserted = 0;
  for (const skill of seedData.seeds) {
    const skillData = {
      name: skill.name,
      description: skill.description + ` [${skill.category}]`,  // Append category to description
      version: skill.version,
      publisher_id: publisher.id,
      status: 'verified',  // Pre-verified seed skills
      scan_result: skill.scan_result.toLowerCase(),
      downloads: Math.floor(Math.random() * 500) + 50  // Random downloads for display
    };
    
    const res = await fetch(`${SUPABASE_URL}/rest/v1/skills`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(skillData)
    });
    
    if (res.ok) {
      console.log(`  ✅ ${skill.name}`);
      inserted++;
    } else {
      const errText = await res.text();
      if (errText.includes('duplicate')) {
        console.log(`  ⏭️  ${skill.name} (already exists)`);
      } else {
        console.log(`  ❌ ${skill.name}: ${errText}`);
      }
    }
  }
  
  console.log(`\n🎉 Done! Inserted ${inserted} skills.`);
  console.log('   View at: https://trustclaw-backend.vercel.app/skills');
}

seed().catch(console.error);
