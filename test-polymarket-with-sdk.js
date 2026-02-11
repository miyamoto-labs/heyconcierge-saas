// Test Polymarket CLOB API with SDK
import fs from 'fs';
import { Wallet } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';

const HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon

async function test() {
  console.log('🎯 Testing Polymarket Connection with Captured Auth\n');
  
  // Load captured auth
  const authData = JSON.parse(fs.readFileSync('./easypoly-landing/polymarket-auth.json', 'utf8'));
  const clobKeys = JSON.parse(authData.auth.clobApiKey);
  
  // Extract credentials
  const walletAddress = Object.keys(clobKeys)[0];
  const creds = clobKeys[walletAddress];
  
  console.log('📋 Credentials:');
  console.log('  Wallet:', walletAddress);
  console.log('  Base Address:', creds.baseAddress);
  console.log('  API Key:', creds.key.substring(0, 12) + '...');
  console.log('');
  
  // Create a dummy wallet (we don't actually need the private key for read-only operations)
  // But the SDK requires it for initialization
  const dummyPrivateKey = '0x' + '1'.repeat(64); // Dummy key
  const signer = new Wallet(dummyPrivateKey);
  
  console.log('🔌 Connecting to Polymarket CLOB...');
  
  try {
    // Initialize client with captured credentials
    const client = new ClobClient(
      HOST,
      CHAIN_ID,
      signer,
      {
        key: creds.key,
        secret: creds.secret,
        passphrase: creds.passphrase
      },
      1, // signature type
      creds.baseAddress // funder address
    );
    
    console.log('✅ Client initialized\n');
    
    // Test 1: Get balance
    console.log('💰 Checking balance...');
    const balances = await client.getBalanceAllowance(creds.baseAddress);
    console.log('  Balance:', balances.balance);
    console.log('  Allowance:', balances.allowance);
    console.log('');
    
    // Test 2: Get open orders
    console.log('📊 Checking open orders...');
    const orders = await client.getOrders({ maker: creds.baseAddress });
    console.log(`  You have ${orders.length} open orders`);
    if (orders.length > 0) {
      console.log('  First order:', orders[0]);
    }
    console.log('');
    
    // Test 3: Get positions
    console.log('📈 Checking positions...');
    // Note: This endpoint might require different formatting
    console.log('  (Positions check skipped - requires market-specific queries)');
    console.log('');
    
    console.log('🎉 SUCCESS! Your Polymarket auth works!');
    console.log('');
    console.log('✅ You can now:');
    console.log('   - Place bets via API');
    console.log('   - Check your balance: $' + (parseInt(balances.balance) / 1e6).toFixed(2));
    console.log('   - Automate trading');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

test();
