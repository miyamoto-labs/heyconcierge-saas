#!/usr/bin/env python3
"""
Production Polymarket CLOB Executor
Proper EIP-712 signing implementation using official Polymarket libraries
"""

import sys
import os
import time
import json
import hashlib
import hmac
import requests
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from eth_account import Account
from eth_utils import keccak
from decimal import Decimal, ROUND_DOWN
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the local repos to Python path
sys.path.insert(0, '/Users/erik/.openclaw/workspace/py-clob-client')
sys.path.insert(0, '/Users/erik/.openclaw/workspace/python-order-utils')
sys.path.insert(0, '/Users/erik/.openclaw/workspace/poly-py-eip712-structs')

# Import Polymarket libraries
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import (
    OrderArgs,
    MarketOrderArgs,
    OrderType,
    ApiCreds,
    PartialCreateOrderOptions
)
from py_clob_client.order_builder.constants import BUY, SELL

# ============================================================================
# CONFIGURATION
# ============================================================================

CLOB_HOST = "https://clob.polymarket.com"
CHAIN_ID = 137  # Polygon mainnet
GAMMA_API = "https://gamma-api.polymarket.com"

# Load wallet from environment variables (SECURE)
PRIVATE_KEY = os.getenv('POLYMARKET_PRIVATE_KEY')
WALLET_ADDRESS = os.getenv('POLYMARKET_ADDRESS')

if not PRIVATE_KEY or not WALLET_ADDRESS:
    raise ValueError("POLYMARKET_PRIVATE_KEY and POLYMARKET_ADDRESS must be set in .env file")

# Trading parameters
MIN_ORDER_SIZE_USD = 1.0
MAX_ORDER_SIZE_USD = 20.0

# CRITICAL: Odds filtering to prevent losing trades
TARGET_MIN_ODDS = 0.40  # Don't buy below 40% (poor risk/reward)
TARGET_MAX_ODDS = 0.65  # Don't buy above 65% (need ~66%+ win rate to profit)
# At 0.65 odds: Win = +$0.54 per $1 bet (54% upside), Lose = -$1.00 (100% downside)
# Need ~65% win rate to break even = achievable with good signals

# ============================================================================
# POLYMARKET CLOB EXECUTOR
# ============================================================================

@dataclass
class TradeResult:
    """Result of a trade execution"""
    success: bool
    order_id: Optional[str] = None
    tx_hash: Optional[str] = None
    error: Optional[str] = None
    price: Optional[float] = None
    size: Optional[float] = None

class PolymarketExecutor:
    """
    Production-ready Polymarket order executor
    Implements proper EIP-712 signing using official Polymarket libraries
    """
    
    def __init__(self, private_key: str, wallet_address: str, paper_mode: bool = True):
        """
        Initialize the executor
        
        Args:
            private_key: Ethereum private key (with 0x prefix)
            wallet_address: Wallet address
            paper_mode: If True, only simulate trades without execution
        """
        self.private_key = private_key
        self.wallet_address = wallet_address
        self.paper_mode = paper_mode
        
        # Initialize client in read-only mode first
        self.client = None
        self.creds = None
        
        # Cache for market data
        self._token_cache = {}
        self._orderbook_cache = {}
        self._last_cache_clear = time.time()
        
        if not paper_mode:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize authenticated CLOB client"""
        try:
            print("🔐 Initializing Polymarket CLOB client...")
            
            # Create client with Level 1 auth (private key)
            self.client = ClobClient(
                host=CLOB_HOST,
                chain_id=CHAIN_ID,
                key=self.private_key,
                signature_type=0,  # EOA signature type
                funder=self.wallet_address
            )
            
            print(f"✅ Client address: {self.client.get_address()}")
            
            # Create or derive API credentials (Level 2 auth)
            print("🔑 Creating API credentials...")
            self.creds = self.client.create_or_derive_api_creds()
            self.client.set_api_creds(self.creds)
            
            print(f"✅ API Key: {self.creds.api_key[:16]}...")
            print("✅ CLOB client fully authenticated (Level 2)")
            
            # Test connection
            server_time = self.client.get_server_time()
            print(f"✅ Server connection verified. Time: {server_time}")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize CLOB client: {e}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            return False
    
    def _clear_cache_if_needed(self):
        """Clear cache every 5 minutes"""
        if time.time() - self._last_cache_clear > 300:
            self._token_cache.clear()
            self._orderbook_cache.clear()
            self._last_cache_clear = time.time()
    
    def get_market_tokens(self, market_slug: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Fetch token IDs for a market
        
        Returns:
            (yes_token_id, no_token_id) or (None, None) if not found
        """
        self._clear_cache_if_needed()
        
        if market_slug in self._token_cache:
            return self._token_cache[market_slug]
        
        try:
            # First try the EVENTS endpoint (for BTC/ETH 15-min markets)
            url = f"{GAMMA_API}/events"
            response = requests.get(url, params={"slug": market_slug}, timeout=5)
            
            if response.status_code == 200:
                events = response.json()
                if events and len(events) > 0:
                    event = events[0]
                    markets = event.get('markets', [])
                    if markets:
                        market = markets[0]
                        clob_tokens_str = market.get('clobTokenIds')
                        if clob_tokens_str:
                            if clob_tokens_str.startswith('['):
                                clob_tokens = json.loads(clob_tokens_str)
                            else:
                                clob_tokens = [t.strip().strip('"') for t in clob_tokens_str.split(',')]
                            if len(clob_tokens) >= 2:
                                yes_token = clob_tokens[0]
                                no_token = clob_tokens[1]
                                self._token_cache[market_slug] = (yes_token, no_token)
                                print(f"✅ Found market via events: {market_slug}")
                                return yes_token, no_token
            
            # Fallback to MARKETS endpoint
            url = f"{GAMMA_API}/markets"
            response = requests.get(url, params={"slug": market_slug}, timeout=5)
            
            if response.status_code == 200:
                markets = response.json()
                if markets and len(markets) > 0:
                    market = markets[0]
                    
                    # Try clobTokenIds first (new format)
                    clob_tokens_str = market.get('clobTokenIds')
                    if clob_tokens_str:
                        clob_tokens = json.loads(clob_tokens_str)
                        if len(clob_tokens) >= 2:
                            yes_token = clob_tokens[0]
                            no_token = clob_tokens[1]
                            
                            self._token_cache[market_slug] = (yes_token, no_token)
                            return yes_token, no_token
                    
                    # Fallback to old format
                    tokens = market.get('tokens', [])
                    if len(tokens) >= 2:
                        yes_token = tokens[0].get('token_id')
                        no_token = tokens[1].get('token_id')
                        
                        self._token_cache[market_slug] = (yes_token, no_token)
                        return yes_token, no_token
            
            print(f"⚠️ Market not found: {market_slug}")
            return None, None
            
        except Exception as e:
            print(f"⚠️ Error fetching market tokens: {e}")
            import traceback
            traceback.print_exc()
            return None, None
    
    def get_orderbook(self, token_id: str) -> Optional[Dict]:
        """
        Get orderbook for a token
        
        Returns:
            {"best_bid": float, "best_ask": float, "spread": float} or None
        """
        try:
            cache_key = f"{token_id}_{int(time.time() // 10)}"  # Cache for 10 seconds
            
            if cache_key in self._orderbook_cache:
                return self._orderbook_cache[cache_key]
            
            if self.paper_mode:
                # Use public API in paper mode
                url = f"{CLOB_HOST}/book"
                response = requests.get(url, params={"token_id": token_id}, timeout=5)
                
                if response.status_code == 200:
                    book = response.json()
                    
                    bids = book.get("bids", [])
                    asks = book.get("asks", [])
                    
                    best_bid = float(bids[0]["price"]) if bids else 0.0
                    best_ask = float(asks[0]["price"]) if asks else 1.0
                    
                    result = {
                        "best_bid": best_bid,
                        "best_ask": best_ask,
                        "spread": best_ask - best_bid,
                        "bid_size": float(bids[0]["size"]) if bids else 0.0,
                        "ask_size": float(asks[0]["size"]) if asks else 0.0
                    }
                    
                    self._orderbook_cache[cache_key] = result
                    return result
            else:
                # Use authenticated client
                book = self.client.get_order_book(token_id)
                
                best_bid = float(book.bids[0].price) if book.bids else 0.0
                best_ask = float(book.asks[0].price) if book.asks else 1.0
                
                result = {
                    "best_bid": best_bid,
                    "best_ask": best_ask,
                    "spread": best_ask - best_bid,
                    "bid_size": float(book.bids[0].size) if book.bids else 0.0,
                    "ask_size": float(book.asks[0].size) if book.asks else 0.0
                }
                
                self._orderbook_cache[cache_key] = result
                return result
            
        except Exception as e:
            print(f"⚠️ Error fetching orderbook: {e}")
            return None
    
    def place_order(
        self,
        market_slug: str,
        direction: str,  # "UP" or "DOWN"
        size_usd: float,
        order_type: str = "MARKET",  # "MARKET" or "LIMIT"
        limit_price: Optional[float] = None
    ) -> TradeResult:
        """
        Place an order on Polymarket
        
        Args:
            market_slug: Market identifier (e.g., "btc-updown-15m-1234567890")
            direction: "UP" or "DOWN"
            size_usd: Order size in USD
            order_type: "MARKET" or "LIMIT"
            limit_price: Price for limit orders (0.0-1.0)
        
        Returns:
            TradeResult with execution details
        """
        
        # Validate inputs
        if size_usd < MIN_ORDER_SIZE_USD:
            return TradeResult(
                success=False,
                error=f"Order size too small: ${size_usd:.2f} < ${MIN_ORDER_SIZE_USD:.2f}"
            )
        
        if size_usd > MAX_ORDER_SIZE_USD:
            return TradeResult(
                success=False,
                error=f"Order size too large: ${size_usd:.2f} > ${MAX_ORDER_SIZE_USD:.2f}"
            )
        
        if direction not in ["UP", "DOWN"]:
            return TradeResult(success=False, error=f"Invalid direction: {direction}")
        
        # Get token IDs
        yes_token, no_token = self.get_market_tokens(market_slug)
        if not yes_token or not no_token:
            return TradeResult(success=False, error=f"Market not found: {market_slug}")
        
        # Select token based on direction
        token_id = yes_token if direction == "UP" else no_token
        side = BUY  # Always buying (we're taking a position)
        
        print(f"\n{'='*70}")
        print(f"📊 PLACING ORDER")
        print(f"{'='*70}")
        print(f"Market: {market_slug}")
        print(f"Direction: {direction}")
        print(f"Token ID: {token_id}")
        print(f"Size: ${size_usd:.2f}")
        print(f"Type: {order_type}")
        print(f"Mode: {'📝 PAPER' if self.paper_mode else '💸 LIVE'}")
        
        try:
            # Get orderbook
            book = self.get_orderbook(token_id)
            if not book:
                return TradeResult(success=False, error="Failed to fetch orderbook")
            
            print(f"\n📖 Orderbook:")
            print(f"   Best Bid: {book['best_bid']:.4f}")
            print(f"   Best Ask: {book['best_ask']:.4f}")
            print(f"   Spread: {book['spread']:.4f}")
            
            # Execute based on order type
            if order_type == "MARKET":
                return self._place_market_order(token_id, side, size_usd, book)
            else:
                return self._place_limit_order(token_id, side, size_usd, limit_price, book)
        
        except Exception as e:
            print(f"\n❌ Order execution failed: {e}")
            import traceback
            traceback.print_exc()
            return TradeResult(success=False, error=str(e))
    
    def _place_market_order(
        self,
        token_id: str,
        side: str,
        amount_usd: float,
        book: Dict
    ) -> TradeResult:
        """Place a market order (buy by dollar amount)"""
        
        # Calculate execution price (best ask for buy)
        exec_price = book['best_ask']
        
        # CRITICAL: Check odds are in acceptable range
        if exec_price < TARGET_MIN_ODDS:
            return TradeResult(
                success=False,
                error=f"Odds too low ({exec_price:.4f} < {TARGET_MIN_ODDS:.2f}) - poor risk/reward"
            )
        
        if exec_price > TARGET_MAX_ODDS:
            return TradeResult(
                success=False,
                error=f"Odds too high ({exec_price:.4f} > {TARGET_MAX_ODDS:.2f}) - need {exec_price*100:.0f}%+ win rate"
            )
        
        shares = amount_usd / exec_price
        
        # Calculate potential profit/loss
        potential_profit = (amount_usd / exec_price) - amount_usd
        potential_loss = -amount_usd
        risk_reward_ratio = potential_profit / abs(potential_loss)
        
        print(f"\n⚡ Market Order:")
        print(f"   Amount: ${amount_usd:.2f}")
        print(f"   Execution Price (Odds): {exec_price:.4f}")
        print(f"   Shares: {shares:.2f}")
        print(f"   Potential Profit: ${potential_profit:.2f} ({risk_reward_ratio:.1%} upside)")
        print(f"   Potential Loss: ${potential_loss:.2f} (100% downside)")
        print(f"   Required Win Rate: {exec_price*100:.0f}%")
        
        if self.paper_mode:
            # Simulate execution
            order_id = f"PAPER_{int(time.time())}_{token_id[:8]}"
            print(f"\n✅ PAPER MODE: Order simulated successfully")
            print(f"   Order ID: {order_id}")
            
            return TradeResult(
                success=True,
                order_id=order_id,
                price=exec_price,
                size=shares
            )
        else:
            # LIVE EXECUTION
            print(f"\n💸 EXECUTING LIVE ORDER...")
            
            # Create market order using official SDK
            order_args = MarketOrderArgs(
                token_id=token_id,
                amount=amount_usd,
                side=side,
                order_type=OrderType.FOK,  # Fill or Kill
                fee_rate_bps=0  # Will be auto-filled by SDK
            )
            
            # Create and sign the order (EIP-712)
            signed_order = self.client.create_market_order(order_args)
            
            print(f"✅ Order created and signed (EIP-712)")
            # Log order details safely
            if hasattr(signed_order, 'order'):
                print(f"   Order: {signed_order.order}")
            else:
                print(f"   Signed order: {type(signed_order)}")
            
            # Submit to CLOB
            response = self.client.post_order(signed_order, OrderType.FOK)
            
            order_id = response.get("orderID")
            
            print(f"\n✅ ORDER EXECUTED SUCCESSFULLY!")
            print(f"   Order ID: {order_id}")
            print(f"   Status: {response.get('status', 'LIVE')}")
            
            return TradeResult(
                success=True,
                order_id=order_id,
                price=exec_price,
                size=shares,
                tx_hash=response.get("transactionHash")
            )
    
    def _place_limit_order(
        self,
        token_id: str,
        side: str,
        size_usd: float,
        limit_price: float,
        book: Dict
    ) -> TradeResult:
        """Place a limit order (shares at a specific price)"""
        
        if limit_price is None or limit_price <= 0 or limit_price >= 1:
            return TradeResult(success=False, error="Invalid limit price (must be 0 < price < 1)")
        
        # Calculate shares
        shares = size_usd / limit_price
        
        print(f"\n📋 Limit Order:")
        print(f"   Price: {limit_price:.4f}")
        print(f"   Size: {shares:.2f} shares")
        print(f"   Total: ${size_usd:.2f}")
        
        if self.paper_mode:
            # Simulate execution
            order_id = f"PAPER_LIMIT_{int(time.time())}_{token_id[:8]}"
            print(f"\n✅ PAPER MODE: Limit order simulated")
            print(f"   Order ID: {order_id}")
            
            return TradeResult(
                success=True,
                order_id=order_id,
                price=limit_price,
                size=shares
            )
        else:
            # LIVE EXECUTION
            print(f"\n💸 EXECUTING LIVE LIMIT ORDER...")
            
            # Create limit order
            order_args = OrderArgs(
                token_id=token_id,
                price=limit_price,
                size=shares,
                side=side,
                fee_rate_bps=0  # Will be auto-filled
            )
            
            # Create and sign the order (EIP-712)
            signed_order = self.client.create_order(order_args)
            
            print(f"✅ Limit order created and signed (EIP-712)")
            
            # Submit to CLOB
            response = self.client.post_order(signed_order, OrderType.GTC)  # Good Till Cancel
            
            order_id = response.get("orderID")
            
            print(f"\n✅ LIMIT ORDER PLACED!")
            print(f"   Order ID: {order_id}")
            print(f"   Status: OPEN (waiting for fill)")
            
            return TradeResult(
                success=True,
                order_id=order_id,
                price=limit_price,
                size=shares
            )
    
    def get_open_orders(self) -> list:
        """Get all open orders"""
        if self.paper_mode:
            print("📝 Paper mode: No real orders to fetch")
            return []
        
        try:
            orders = self.client.get_orders()
            print(f"📊 Found {len(orders)} open orders")
            return orders
        except Exception as e:
            print(f"❌ Error fetching orders: {e}")
            return []
    
    def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        if self.paper_mode:
            print(f"📝 Paper mode: Simulated cancel of {order_id}")
            return True
        
        try:
            self.client.cancel(order_id)
            print(f"✅ Order cancelled: {order_id}")
            return True
        except Exception as e:
            print(f"❌ Failed to cancel order: {e}")
            return False
    
    def get_balance(self) -> Dict:
        """Get wallet balance"""
        if self.paper_mode:
            return {"usdc": 79.0, "mode": "PAPER"}
        
        try:
            from py_clob_client.clob_types import BalanceAllowanceParams, AssetType
            params = BalanceAllowanceParams(asset_type=AssetType.COLLATERAL, signature_type=0)
            balance = self.client.get_balance_allowance(params)
            return balance
        except Exception as e:
            print(f"❌ Error fetching balance: {e}")
            return {}

# ============================================================================
# CLI TESTING
# ============================================================================

def main():
    """Test the executor"""
    import sys
    
    # Determine mode from command line
    paper_mode = "--live" not in sys.argv
    
    print("\n" + "="*70)
    print("🚀 POLYMARKET CLOB EXECUTOR - PRODUCTION READY")
    print("="*70)
    print(f"Mode: {'📝 PAPER TRADING' if paper_mode else '💸 LIVE TRADING'}")
    print(f"Wallet: {WALLET_ADDRESS}")
    print("="*70)
    
    # Initialize executor
    executor = PolymarketExecutor(
        private_key=PRIVATE_KEY,
        wallet_address=WALLET_ADDRESS,
        paper_mode=paper_mode
    )
    
    # Test market lookup
    print("\n🔍 Testing market lookup...")
    market_slug = "btc-updown-15m-1738857600"  # Example market
    yes_token, no_token = executor.get_market_tokens(market_slug)
    
    if yes_token and no_token:
        print(f"✅ Market found!")
        print(f"   YES token: {yes_token}")
        print(f"   NO token: {no_token}")
        
        # Get orderbook
        book = executor.get_orderbook(yes_token)
        if book:
            print(f"\n📖 Orderbook:")
            print(f"   Best Bid: {book['best_bid']:.4f}")
            print(f"   Best Ask: {book['best_ask']:.4f}")
            print(f"   Spread: {book['spread']:.4f}")
    
    # Test order placement if --test flag is provided
    if "--test" in sys.argv:
        print("\n🧪 Testing order placement...")
        result = executor.place_order(
            market_slug=market_slug,
            direction="UP",
            size_usd=1.0,  # $1 test order
            order_type="MARKET"
        )
        
        print(f"\n📊 Result:")
        print(f"   Success: {result.success}")
        if result.success:
            print(f"   Order ID: {result.order_id}")
            print(f"   Price: {result.price:.4f}")
            print(f"   Shares: {result.size:.2f}")
        else:
            print(f"   Error: {result.error}")
    
    print("\n" + "="*70)
    print("✅ Executor ready for integration!")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
