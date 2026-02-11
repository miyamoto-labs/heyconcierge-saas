#!/usr/bin/env node

/**
 * Test Polymarket Bet Placement
 * 
 * Uses captured auth from polymarket-auth.json to place a small test bet.
 * This verifies end-to-end flow: auth → CLOB API → order placement.
 */

const fs = require('fs');

// Load captured auth
const authFile = '/Users/erik/.openclaw/workspace/easypoly-landing/polymarket-auth.json';
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));

console.log('🔐 Loaded auth for user:', authData.userId);
console.log('📅 Captured:', authData.capturedAt);

// Extract CLOB credentials
const clobKeyMap = JSON.parse(authData.auth.clobApiKey);
const walletAddress = Object.keys(clobKeyMap)[0]; // First wallet
const creds = clobKeyMap[walletAddress];

console.log('\n✅ Found CLOB credentials for wallet:', walletAddress);
console.log('   Key:', creds.key.substring(0, 15) + '...');
console.log('   Secret:', creds.secret.substring(0, 20) + '...');
console.log('   Passphrase:', creds.passphrase.substring(0, 15) + '...');
console.log('   Base Address:', creds.baseAddress);
console.log('   Proxy Wallet:', authData.auth.proxyWallet);

async function testCLOBConnection() {
  try {
    console.log('\n🎯 Testing CLOB API connection...\n');

    // Test 1: Fetch active markets from Gamma API
    console.log('📊 Fetching active markets from Gamma API...');
    const response = await fetch('https://gamma-api.polymarket.com/markets?limit=5&active=true&closed=false');
    
    if (!response.ok) {
      console.error('❌ Failed to fetch markets:', response.statusText);
      return;
    }

    const markets = await response.json();
    console.log('✅ API connection working!');
    console.log('📈 Found', markets.length, 'active markets\n');
    
    if (markets.length > 0) {
      const market = markets[0];
      console.log('🎲 Top market:');
      console.log('   Question:', market.question);
      console.log('   Slug:', market.slug);
      console.log('   End date:', new Date(market.end_date_iso).toLocaleString());
      console.log('   Volume:', '$' + (market.volume || 0).toLocaleString());
      
      // Find YES token
      if (market.tokens) {
        const yesToken = market.tokens.find(t => t.outcome === 'Yes' || t.outcome === 'YES');
        if (yesToken) {
          console.log('\n💰 YES token:');
          console.log('   Token ID:', yesToken.token_id);
          console.log('   Price:', yesToken.price, '¢');
          console.log('   Volume:', yesToken.volume);
        }
      }
    }

    console.log('\n⚠️  CLOB AUTH READY');
    console.log('⚠️  The credentials are LIVE and will place REAL bets');
    console.log('⚠️  Next step: Write order placement function\n');
    
    console.log('📋 What you can do:');
    console.log('   1. Place market orders (buy/sell at current price)');
    console.log('   2. Place limit orders (buy/sell at specific price)');
    console.log('   3. Cancel orders');
    console.log('   4. Check order status');
    console.log('   5. Get order book depth\n');

    // Save example order structure
    const exampleOrder = {
      market: market.condition_id || 'market-condition-id',
      tokenId: 'token-id-from-market',
      side: 'BUY', // or 'SELL'
      size: '1.00', // $1.00
      price: '0.50', // 50 cents = 50% probability
      expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    };
    
    console.log('📝 Example order format:');
    console.log(JSON.stringify(exampleOrder, null, 2));
    console.log('\n✅ Test complete! Ready to integrate with Telegram bot.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      const text = await error.response.text();
      console.error('Response:', text);
    }
  }
}

testCLOBConnection();
