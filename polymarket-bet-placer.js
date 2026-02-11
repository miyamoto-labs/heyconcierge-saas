#!/usr/bin/env node

/**
 * Polymarket Bet Placer
 * 
 * Places bets on Polymarket using captured CLOB credentials.
 * Called by EasyPoly Telegram bot when users click BET button.
 */

const fs = require('fs');
const { ClobClient } = require('@polymarket/clob-client');
const { ethers } = require('ethers');

// Load auth
const authFile = '/Users/erik/.openclaw/workspace/easypoly-landing/polymarket-auth.json';

class PolymarketBetPlacer {
  constructor() {
    this.authData = null;
    this.client = null;
    this.creds = null;
    this.walletAddress = null;
  }

  loadAuth() {
    if (!fs.existsSync(authFile)) {
      throw new Error('Auth file not found. Run auth capture first.');
    }

    this.authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
    
    // Parse CLOB credentials
    const clobKeyMap = JSON.parse(this.authData.auth.clobApiKey);
    this.walletAddress = Object.keys(clobKeyMap)[0];
    this.creds = clobKeyMap[this.walletAddress];

    console.log('✅ Auth loaded for wallet:', this.walletAddress);
  }

  async initClient(privateKey) {
    // Initialize CLOB client with private key for signing
    // Private key needed for transaction signing, but we have API creds for orders
    this.client = new ClobClient(
      'https://clob.polymarket.com',
      privateKey || process.env.POLYGON_PRIVATE_KEY,
      {
        chainId: 137, // Polygon
        apiKey: this.creds.key,
        apiSecret: this.creds.secret,
        apiPassphrase: this.creds.passphrase,
      }
    );
    console.log('✅ CLOB client initialized');
  }

  async placeBet(params) {
    /**
     * Place a bet on Polymarket
     * 
     * @param {Object} params
     * @param {string} params.tokenId - Token ID from market
     * @param {string} params.side - 'BUY' or 'SELL'
     * @param {number} params.amount - Dollar amount (e.g., 5 = $5)
     * @param {number} params.price - Price in decimal (e.g., 0.65 = 65¢)
     */
    const { tokenId, side, amount, price } = params;

    try {
      console.log('\n🎲 Placing bet...');
      console.log('   Token:', tokenId);
      console.log('   Side:', side);
      console.log('   Amount:', '$' + amount);
      console.log('   Price:', (price * 100).toFixed(1) + '¢');

      // Calculate size (shares to buy)
      const size = (amount / price).toFixed(2);

      // Create order
      const order = await this.client.createOrder({
        tokenID: tokenId,
        price: price.toString(),
        size: size.toString(),
        side: side,
        feeRateBps: '0', // Fee rate in basis points
      });

      console.log('✅ Order created!');
      console.log('   Order ID:', order.orderID);
      console.log('   Status:', order.status);

      return {
        success: true,
        orderId: order.orderID,
        status: order.status,
        size: size,
        price: price,
      };

    } catch (error) {
      console.error('❌ Bet placement failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getMarketData(slug) {
    /**
     * Fetch market data by slug
     */
    const response = await fetch(`https://gamma-api.polymarket.com/markets?slug=${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market: ' + response.statusText);
    }
    const markets = await response.json();
    return markets[0];
  }

  async getOrderStatus(orderId) {
    /**
     * Check order status
     */
    try {
      const order = await this.client.getOrder(orderId);
      return order;
    } catch (error) {
      console.error('Failed to get order status:', error.message);
      return null;
    }
  }
}

// Export for use in other scripts
module.exports = PolymarketBetPlacer;

// CLI usage
if (require.main === module) {
  const placer = new PolymarketBetPlacer();
  
  // Example: node polymarket-bet-placer.js <tokenId> <side> <amount> <price>
  const [tokenId, side, amount, price] = process.argv.slice(2);
  
  if (!tokenId || !side || !amount || !price) {
    console.log('Usage: node polymarket-bet-placer.js <tokenId> <side> <amount> <price>');
    console.log('Example: node polymarket-bet-placer.js 12345 BUY 5 0.65');
    process.exit(1);
  }

  (async () => {
    try {
      placer.loadAuth();
      
      // Note: Private key needed for signing. For now, this will fail until we add wallet integration.
      // The Telegram bot will need to prompt users to connect their MetaMask for tx signing.
      console.log('\n⚠️  Note: Transaction signing requires MetaMask connection');
      console.log('⚠️  API credentials are ready, but signing needs user wallet\n');
      
      // await placer.initClient();
      // const result = await placer.placeBet({
      //   tokenId,
      //   side: side.toUpperCase(),
      //   amount: parseFloat(amount),
      //   price: parseFloat(price),
      // });
      
      // console.log('\nResult:', result);
      
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
