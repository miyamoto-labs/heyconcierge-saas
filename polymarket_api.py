#!/usr/bin/env python3
"""
Polymarket API Integration
Handles order placement, market data, and wallet management
"""

import requests
import json
import time
from typing import Dict, List, Optional
from web3 import Web3
from eth_account import Account
from datetime import datetime

# API Endpoints
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"

class PolymarketAPI:
    """Interface to Polymarket CLOB and Gamma APIs"""
    
    def __init__(self, private_key: Optional[str] = None):
        """
        Initialize API client
        
        Args:
            private_key: Ethereum private key (for signing trades)
        """
        self.private_key = private_key
        self.account = None
        
        if private_key:
            self.account = Account.from_key(private_key)
            print(f"✅ Wallet loaded: {self.account.address}")
    
    def get_15min_markets(self, asset: str) -> List[Dict]:
        """
        Get current 15-minute markets for an asset
        
        Args:
            asset: 'BTC', 'ETH', 'SOL', or 'XRP'
            
        Returns:
            List of active 15-min markets
        """
        try:
            # Current timestamp
            now = int(time.time())
            
            # Search pattern
            slug_pattern = f"{asset.lower()}-updown-15m"
            
            # Fetch markets
            params = {
                "limit": 20,
                "active": "true",
                "closed": "false"
            }
            
            resp = requests.get(f"{GAMMA_API}/markets", params=params, timeout=10)
            resp.raise_for_status()
            
            markets = resp.json()
            
            # Filter for 15-min markets
            fifteen_min_markets = [
                m for m in markets 
                if slug_pattern in m.get('slug', '').lower()
            ]
            
            return fifteen_min_markets
            
        except Exception as e:
            print(f"❌ Error fetching markets: {e}")
            return []
    
    def get_market_by_slug(self, slug: str) -> Optional[Dict]:
        """Get specific market by slug"""
        try:
            # Try direct market lookup
            resp = requests.get(f"{GAMMA_API}/markets/{slug}", timeout=10)
            
            if resp.status_code == 200:
                return resp.json()
            
            # Fallback: search all markets
            markets = self.get_15min_markets("BTC")
            markets.extend(self.get_15min_markets("ETH"))
            
            for m in markets:
                if m.get('slug') == slug:
                    return m
            
            return None
            
        except Exception as e:
            print(f"❌ Error fetching market: {e}")
            return None
    
    def get_orderbook(self, token_id: str, side: str = "buy") -> Dict:
        """
        Get orderbook for a token
        
        Args:
            token_id: CLOB token ID
            side: 'buy' or 'sell'
            
        Returns:
            Orderbook data with best prices
        """
        try:
            resp = requests.get(
                f"{CLOB_API}/book",
                params={"token_id": token_id},
                timeout=5
            )
            
            if resp.status_code == 200:
                book = resp.json()
                
                asks = book.get("asks", [])
                bids = book.get("bids", [])
                
                return {
                    "best_ask": float(asks[0]["price"]) if asks else None,
                    "best_bid": float(bids[0]["price"]) if bids else None,
                    "ask_size": float(asks[0]["size"]) if asks else 0,
                    "bid_size": float(bids[0]["size"]) if bids else 0,
                    "spread": float(asks[0]["price"]) - float(bids[0]["price"]) if (asks and bids) else None
                }
            
            return {}
            
        except Exception as e:
            print(f"❌ Error fetching orderbook: {e}")
            return {}
    
    def get_market_odds(self, market_slug: str, outcome: str = "UP") -> Optional[float]:
        """
        Get current odds for a specific outcome
        
        Args:
            market_slug: Market identifier
            outcome: 'UP' or 'DOWN'
            
        Returns:
            Current odds (price) for the outcome, or None
        """
        try:
            market = self.get_market_by_slug(market_slug)
            
            if not market:
                return None
            
            # Get outcomes and prices
            outcomes = json.loads(market.get("outcomes", "[]"))
            prices = json.loads(market.get("outcomePrices", "[]"))
            clob_tokens = json.loads(market.get("clobTokenIds", "[]"))
            
            # Find index of desired outcome
            outcome_idx = None
            for i, o in enumerate(outcomes):
                if o.upper() == outcome.upper():
                    outcome_idx = i
                    break
            
            if outcome_idx is None:
                return None
            
            # Get price from Gamma API (mid-market)
            mid_price = float(prices[outcome_idx]) if outcome_idx < len(prices) else None
            
            # Get actual executable price from CLOB orderbook
            if outcome_idx < len(clob_tokens):
                token_id = clob_tokens[outcome_idx]
                book = self.get_orderbook(token_id)
                
                # For buying, use best ask
                executable_price = book.get("best_ask", mid_price)
                
                return executable_price or mid_price
            
            return mid_price
            
        except Exception as e:
            print(f"❌ Error getting odds: {e}")
            return None
    
    def place_order(
        self,
        market_slug: str,
        outcome: str,
        side: str,
        size_usd: float,
        price: Optional[float] = None
    ) -> Dict:
        """
        Place an order on Polymarket
        
        Args:
            market_slug: Market identifier
            outcome: 'UP' or 'DOWN'
            side: 'BUY' or 'SELL'
            size_usd: Position size in USD
            price: Limit price (None for market order)
            
        Returns:
            Order result dict
        """
        
        if not self.account:
            return {
                "success": False,
                "error": "No wallet configured",
                "simulated": True
            }
        
        try:
            # Get market data
            market = self.get_market_by_slug(market_slug)
            
            if not market:
                return {
                    "success": False,
                    "error": f"Market not found: {market_slug}"
                }
            
            # Get token IDs
            outcomes = json.loads(market.get("outcomes", "[]"))
            clob_tokens = json.loads(market.get("clobTokenIds", "[]"))
            
            outcome_idx = None
            for i, o in enumerate(outcomes):
                if o.upper() == outcome.upper():
                    outcome_idx = i
                    break
            
            if outcome_idx is None or outcome_idx >= len(clob_tokens):
                return {
                    "success": False,
                    "error": f"Outcome not found: {outcome}"
                }
            
            token_id = clob_tokens[outcome_idx]
            
            # Get current price if not specified
            if price is None:
                book = self.get_orderbook(token_id)
                price = book.get("best_ask" if side.upper() == "BUY" else "best_bid")
            
            if price is None:
                return {
                    "success": False,
                    "error": "Could not determine price"
                }
            
            # Calculate size in shares
            size_shares = size_usd / price
            
            # TODO: Implement actual order signing and submission
            # This requires:
            # 1. Create order object
            # 2. Sign with private key
            # 3. Submit to CLOB API
            # 4. Handle response
            
            # For now, return simulated order
            return {
                "success": True,
                "simulated": True,
                "order": {
                    "market": market_slug,
                    "outcome": outcome,
                    "side": side,
                    "size_usd": size_usd,
                    "size_shares": size_shares,
                    "price": price,
                    "token_id": token_id,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_position_value(self, market_slug: str, outcome: str, shares: float) -> float:
        """
        Calculate current value of a position
        
        Args:
            market_slug: Market identifier
            outcome: 'UP' or 'DOWN'
            shares: Number of shares held
            
        Returns:
            Current USD value
        """
        try:
            current_price = self.get_market_odds(market_slug, outcome)
            
            if current_price is None:
                return 0.0
            
            return shares * current_price
            
        except:
            return 0.0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def load_wallet_from_file(filepath: str = "/Users/erik/.openclaw/workspace/.polymarket_wallet.json") -> Optional[PolymarketAPI]:
    """Load wallet from JSON file"""
    try:
        with open(filepath, 'r') as f:
            wallet_data = json.load(f)
        
        private_key = wallet_data.get("private_key")
        
        if private_key:
            return PolymarketAPI(private_key=private_key)
        else:
            print("⚠️  No private key in wallet file")
            return PolymarketAPI()
            
    except FileNotFoundError:
        print(f"⚠️  Wallet file not found: {filepath}")
        return PolymarketAPI()
    except Exception as e:
        print(f"❌ Error loading wallet: {e}")
        return PolymarketAPI()

# ============================================================================
# TEST/DEMO
# ============================================================================

if __name__ == "__main__":
    print("🧪 Testing Polymarket API\n")
    
    # Initialize (without wallet for testing)
    api = PolymarketAPI()
    
    # Test 1: Fetch 15-min markets
    print("1️⃣ Fetching BTC 15-min markets...")
    btc_markets = api.get_15min_markets("BTC")
    print(f"   Found {len(btc_markets)} markets")
    
    if btc_markets:
        market = btc_markets[0]
        slug = market.get('slug', 'N/A')
        print(f"   Latest: {slug}\n")
        
        # Test 2: Get market odds
        print("2️⃣ Fetching market odds...")
        up_odds = api.get_market_odds(slug, "UP")
        down_odds = api.get_market_odds(slug, "DOWN")
        
        if up_odds and down_odds:
            print(f"   UP: {up_odds:.4f} ({up_odds*100:.1f}%)")
            print(f"   DOWN: {down_odds:.4f} ({down_odds*100:.1f}%)")
            print(f"   Sum: {up_odds + down_odds:.4f}")
            print(f"   Spread: {abs(1.0 - (up_odds + down_odds))*100:.2f}%")
        else:
            print("   ⚠️  Could not fetch odds")
    
    print("\n✅ API test complete")
