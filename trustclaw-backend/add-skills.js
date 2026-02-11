const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ljseawnwxbkrejwysrey.supabase.co',
  'sb_secret_Brfx07Yxp_L7YLwE012lAA_xKsD-EtY'
);

const newSkills = [
  {
    name: 'hyperliquid-trader',
    description: 'Automated trading on Hyperliquid DEX. Supports limit orders, market orders, and position management.',
    version: '1.0.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/hyperliquid-trader',
    status: 'verified',
    downloads: 847,
    scan_result: 'pass',
  },
  {
    name: 'polymarket-oracle',
    description: 'Real-time prediction market data from Polymarket. Get odds, volumes, and market details.',
    version: '1.2.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/polymarket-oracle',
    status: 'verified',
    downloads: 623,
    scan_result: 'pass',
  },
  {
    name: 'twitter-poster',
    description: 'Post tweets and threads via OAuth. Supports images, polls, and scheduled posts.',
    version: '2.1.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/twitter-poster',
    status: 'verified',
    downloads: 1203,
    scan_result: 'pass',
  },
  {
    name: 'discord-bot',
    description: 'Full Discord bot integration. Send messages, manage channels, respond to commands.',
    version: '1.5.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/discord-bot',
    status: 'verified',
    downloads: 956,
    scan_result: 'pass',
  },
  {
    name: 'onchain-data',
    description: 'Query blockchain data across 40+ chains. Token prices, wallet balances, transaction history.',
    version: '1.3.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/onchain-data',
    status: 'verified',
    downloads: 789,
    scan_result: 'pass',
  },
  {
    name: 'email-sender',
    description: 'Send emails via SMTP or Gmail API. Supports HTML templates and attachments.',
    version: '1.0.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/email-sender',
    status: 'verified',
    downloads: 567,
    scan_result: 'pass',
  },
  {
    name: 'pdf-generator',
    description: 'Generate PDFs from HTML or markdown. Perfect for invoices, reports, and documents.',
    version: '1.1.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/pdf-generator',
    status: 'verified',
    downloads: 432,
    scan_result: 'pass',
  },
  {
    name: 'browser-automation',
    description: 'Control a headless browser via Playwright. Navigate, click, fill forms, and scrape.',
    version: '2.0.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/browser-automation',
    status: 'verified',
    downloads: 1456,
    scan_result: 'warn',
  },
  {
    name: 'github-actions',
    description: 'Trigger GitHub Actions, manage repos, create issues/PRs, and read workflow status.',
    version: '1.2.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/github-actions',
    status: 'verified',
    downloads: 678,
    scan_result: 'pass',
  },
  {
    name: 'voice-synthesis',
    description: 'Text-to-speech with ElevenLabs, OpenAI, or Google Cloud. Clone voices and adjust tone.',
    version: '1.0.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/voice-synthesis',
    status: 'verified',
    downloads: 534,
    scan_result: 'pass',
  },
  {
    name: 'image-generator',
    description: 'Generate images with DALL-E, Stable Diffusion, or Flux. Supports img2img and inpainting.',
    version: '1.4.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/image-generator',
    status: 'verified',
    downloads: 1089,
    scan_result: 'pass',
  },
  {
    name: 'notion-sync',
    description: 'Full Notion API integration. Read/write pages, databases, and blocks.',
    version: '1.1.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/notion-sync',
    status: 'verified',
    downloads: 423,
    scan_result: 'pass',
  },
  {
    name: 'slack-messenger',
    description: 'Send Slack messages, manage channels, respond to events. Supports blocks and threads.',
    version: '1.3.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/slack-messenger',
    status: 'verified',
    downloads: 756,
    scan_result: 'pass',
  },
  {
    name: 'stripe-payments',
    description: 'Create payment links, subscriptions, and invoices. Manage customers and webhooks.',
    version: '1.0.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/stripe-payments',
    status: 'verified',
    downloads: 345,
    scan_result: 'pass',
  },
  {
    name: 'airtable-sync',
    description: 'Full Airtable API. Create, read, update records across bases for database workflows.',
    version: '1.0.0',
    git_url: 'https://github.com/openclaw/skills/tree/main/airtable-sync',
    status: 'verified',
    downloads: 289,
    scan_result: 'pass',
  },
];

async function addSkills() {
  console.log('Adding skills to TrustClaw...\n');
  
  for (const skill of newSkills) {
    const { data, error } = await supabase
      .from('skills')
      .insert(skill);
    
    if (error) {
      if (error.message.includes('duplicate')) {
        console.log(`⏭️  Skipped: ${skill.name} (already exists)`);
      } else {
        console.log(`❌ Error adding ${skill.name}:`, error.message);
      }
    } else {
      console.log(`✅ Added: ${skill.name}`);
    }
  }
  
  // Get final count
  const { count } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified');
  
  console.log(`\n📊 Total verified skills: ${count}`);
}

addSkills();
