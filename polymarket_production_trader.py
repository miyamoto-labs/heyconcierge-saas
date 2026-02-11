#!/usr/bin/env python3
"""
Polymarket Production Trading Bot - MIYAMOTO LABS
==================================================
Full EIP-712 implementation using official Polymarket libraries.

Architecture:
- Uses py-clob-client for CLOB API interactions
- Uses py-order-utils for EIP-712 order signing
- Uses poly-eip712-structs for EIP-712 struct encoding

IMPORTANT: This bot uses EOA (signature_type=0) signing.
The wallet must have USDC deposited on Polymarket for trading.

Author: Miyamoto Labs
Date: 2026-02-06
"""

import asyncio
import websockets
import requests
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass, asdict
from collections import deque
import os

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import (
    OrderArgs, 
    MarketOrderArgs, 
    OrderType,
    BalanceAllowanceParams,
    AssetType,
    OpenOrderParams,
)
from py_clob_client.order_builder.constants import BUY, SELL

# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Trading configuration - adjust as needed"""
    
    # API
    CLOB_HOST = "https://clob.polymarket.com"
    GAMMA_HOST = "https://gamma-api.polymarket.com"
    CHAIN_ID = 137  # Polygon
    
    # Wallet - EOA (signature_type=0)
    PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
    WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
    SIGNATURE_TYPE = 0  # EOA signing - IMPORTANT!
    
    # Trading
    PAPER_TRADING = True  # Set to False for live trading
    POSITION_SIZE_USD = 5.0  # Default position size
    MAX_POSITION_SIZE_USD = 50.0
    MIN_LIQUIDITY_USD = 100.0  # Minimum orderbook liquidity
    MAX_SLIPPAGE_PCT = 2.0  # Maximum slippage percentage
    
    # Safety
    MAX_DAILY_LOSS_USD = 50.0
    MAX_CONSECUTIVE_LOSSES = 5
    MAX_TRADES_PER_HOUR = 20
    MAX_TRADES_PER_DAY = 100
    
    # Signals (for Binance price strategy)
    MIN_PRICE_MOVE_PCT = 0.3  # Minimum price move to trigger
    MAX_TRADE_WINDOW_SECONDS = 300  # Trade within first 5 minutes
    MIN_CONFIDENCE = 0.5
    
    # Logging
    LOG_FILE = "/Users/erik/.openclaw/workspace/polymarket_trader.log"
    STATE_FILE = "/Users/erik/.openclaw/workspace/.polymarket_state.json"


# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging():
    """Configure logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler(Config.LOG_FILE),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class TradeResult:
    """Result of a trade execution"""
    success: bool
    order_id: Optional[str] = None
    error: Optional[str] = None
    price: Optional[float] = None
    size: Optional[float] = None
    side: Optional[str] = None
    token_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    
@dataclass
class MarketInfo:
    """Information about a tradeable market"""
    condition_id: str
    question: str
    token_yes_id: str
    token_no_id: str
    yes_price: float
    no_price: float
    tick_size: str
    min_order_size: float
    liquidity_yes: float
    liquidity_no: float
    neg_risk: bool

@dataclass
class DailyStats:
    """Daily trading statistics"""
    date: str
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    total_pnl: float = 0.0
    consecutive_losses: int = 0
    paused: bool = False
    pause_reason: str = ""


# ============================================================================
# POLYMARKET TRADING CLIENT
# ============================================================================

class PolymarketTrader:
    """
    Production-ready Polymarket trading client using official py-clob-client.
    
    Features:
    - Proper EIP-712 signing for all orders
    - Market and limit order support
    - Balance and allowance checking
    - Order management (place, cancel, query)
    - Market discovery
    """
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
        self.client: Optional[ClobClient] = None
        self.authenticated = False
        self._balance_cache = None
        self._balance_cache_time = 0
        
    def connect(self) -> bool:
        """
        Initialize the CLOB client and authenticate.
        Returns True if successful.
        """
        try:
            # Create client with EOA signing
            self.client = ClobClient(
                host=self.config.CLOB_HOST,
                key=self.config.PRIVATE_KEY,
                chain_id=self.config.CHAIN_ID,
                signature_type=self.config.SIGNATURE_TYPE,
            )
            
            logger.info(f"Wallet address: {self.client.get_address()}")
            
            # Create or derive API credentials
            creds = self.client.create_or_derive_api_creds()
            self.client.set_api_creds(creds)
            
            self.authenticated = True
            logger.info("✅ Successfully authenticated with Polymarket CLOB")
            
            # Check balance
            balance = self.get_balance()
            logger.info(f"💰 Available balance: ${balance:.2f} USDC")
            
            if balance < 1.0:
                logger.warning("⚠️ Low balance! Deposit USDC to trade.")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect: {e}")
            self.authenticated = False
            return False
    
    def get_balance(self, force_refresh: bool = False) -> float:
        """
        Get current USDC balance on Polymarket.
        Cached for 30 seconds to reduce API calls.
        """
        if not force_refresh and self._balance_cache is not None:
            if time.time() - self._balance_cache_time < 30:
                return self._balance_cache
        
        try:
            params = BalanceAllowanceParams(
                asset_type=AssetType.COLLATERAL,
                signature_type=self.config.SIGNATURE_TYPE
            )
            result = self.client.get_balance_allowance(params)
            # USDC has 6 decimals
            balance = int(result['balance']) / 1_000_000
            self._balance_cache = balance
            self._balance_cache_time = time.time()
            return balance
        except Exception as e:
            logger.error(f"Failed to get balance: {e}")
            return 0.0
    
    def get_market_info(self, token_id: str) -> Optional[Dict]:
        """Get market information for a token."""
        try:
            book = self.client.get_order_book(token_id)
            tick_size = self.client.get_tick_size(token_id)
            neg_risk = self.client.get_neg_risk(token_id)
            
            best_ask = float(book.asks[0].price) if book.asks else None
            best_bid = float(book.bids[0].price) if book.bids else None
            ask_liquidity = sum(float(a.size) * float(a.price) for a in (book.asks or [])[:5])
            bid_liquidity = sum(float(b.size) * float(b.price) for b in (book.bids or [])[:5])
            
            return {
                'token_id': token_id,
                'best_ask': best_ask,
                'best_bid': best_bid,
                'tick_size': tick_size,
                'neg_risk': neg_risk,
                'ask_liquidity': ask_liquidity,
                'bid_liquidity': bid_liquidity,
                'spread': (best_ask - best_bid) if (best_ask and best_bid) else None
            }
        except Exception as e:
            logger.error(f"Failed to get market info: {e}")
            return None
    
    def find_active_markets(self, limit: int = 20) -> List[MarketInfo]:
        """
        Find active markets with good liquidity.
        """
        markets = []
        
        try:
            # Get events from Gamma API
            resp = requests.get(
                f"{self.config.GAMMA_HOST}/events",
                params={"limit": 100, "active": True, "closed": False},
                timeout=30
            )
            events = resp.json()
            
            for event in events:
                for market in event.get('markets', []):
                    clob_tokens = market.get('clobTokenIds', [])
                    if isinstance(clob_tokens, str):
                        try:
                            clob_tokens = json.loads(clob_tokens)
                        except:
                            continue
                    
                    if not clob_tokens or len(clob_tokens) < 2:
                        continue
                    
                    token_yes = clob_tokens[0]
                    token_no = clob_tokens[1]
                    
                    try:
                        # Get orderbook for YES token
                        book = self.client.get_order_book(token_yes)
                        if not book.asks or not book.bids:
                            continue
                        
                        yes_price = float(book.asks[0].price)
                        yes_liquidity = sum(float(a.size) * float(a.price) for a in book.asks[:5])
                        
                        # Get orderbook for NO token  
                        book_no = self.client.get_order_book(token_no)
                        no_price = float(book_no.asks[0].price) if book_no.asks else 1 - yes_price
                        no_liquidity = sum(float(a.size) * float(a.price) for a in (book_no.asks or [])[:5])
                        
                        if yes_liquidity + no_liquidity < self.config.MIN_LIQUIDITY_USD:
                            continue
                        
                        info = MarketInfo(
                            condition_id=market.get('conditionId', ''),
                            question=market.get('question', ''),
                            token_yes_id=token_yes,
                            token_no_id=token_no,
                            yes_price=yes_price,
                            no_price=no_price,
                            tick_size=book.tick_size or '0.01',
                            min_order_size=float(market.get('minOrderSize', 5)),
                            liquidity_yes=yes_liquidity,
                            liquidity_no=no_liquidity,
                            neg_risk=market.get('negRisk', False)
                        )
                        markets.append(info)
                        
                        if len(markets) >= limit:
                            break
                            
                    except Exception as e:
                        continue
                
                if len(markets) >= limit:
                    break
                    
        except Exception as e:
            logger.error(f"Failed to find markets: {e}")
        
        return markets
    
    def place_limit_order(
        self,
        token_id: str,
        side: str,
        price: float,
        size: float,
        time_in_force: OrderType = OrderType.GTC
    ) -> TradeResult:
        """
        Place a limit order.
        
        Args:
            token_id: The conditional token ID
            side: "BUY" or "SELL"
            price: Price in USDC (0.00 to 1.00)
            size: Number of shares
            time_in_force: GTC, GTD, FOK, or FAK
            
        Returns:
            TradeResult with order details
        """
        if self.config.PAPER_TRADING:
            logger.info(f"📝 PAPER: Limit {side} {size:.2f} @ ${price:.4f}")
            return TradeResult(
                success=True,
                order_id=f"PAPER_{int(time.time())}",
                price=price,
                size=size,
                side=side,
                token_id=token_id,
                timestamp=datetime.now()
            )
        
        try:
            order_side = BUY if side.upper() == "BUY" else SELL
            
            order_args = OrderArgs(
                token_id=token_id,
                price=price,
                size=size,
                side=order_side,
            )
            
            signed_order = self.client.create_order(order_args)
            response = self.client.post_order(signed_order, time_in_force)
            
            logger.info(f"✅ Limit order placed: {response.get('orderID', 'N/A')}")
            
            return TradeResult(
                success=True,
                order_id=response.get('orderID'),
                price=price,
                size=size,
                side=side,
                token_id=token_id,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"❌ Limit order failed: {e}")
            return TradeResult(success=False, error=str(e))
    
    def place_market_order(
        self,
        token_id: str,
        side: str,
        amount_usd: float
    ) -> TradeResult:
        """
        Place a market order (FOK - Fill or Kill).
        
        Args:
            token_id: The conditional token ID
            side: "BUY" or "SELL"
            amount_usd: Dollar amount to trade
            
        Returns:
            TradeResult with order details
        """
        if self.config.PAPER_TRADING:
            logger.info(f"📝 PAPER: Market {side} ${amount_usd:.2f}")
            return TradeResult(
                success=True,
                order_id=f"PAPER_MKT_{int(time.time())}",
                size=amount_usd,
                side=side,
                token_id=token_id,
                timestamp=datetime.now()
            )
        
        try:
            order_side = BUY if side.upper() == "BUY" else SELL
            
            market_args = MarketOrderArgs(
                token_id=token_id,
                amount=amount_usd,
                side=order_side,
                order_type=OrderType.FOK
            )
            
            signed_order = self.client.create_market_order(market_args)
            response = self.client.post_order(signed_order, OrderType.FOK)
            
            logger.info(f"✅ Market order filled: {response.get('orderID', 'N/A')}")
            
            return TradeResult(
                success=True,
                order_id=response.get('orderID'),
                size=amount_usd,
                side=side,
                token_id=token_id,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"❌ Market order failed: {e}")
            return TradeResult(success=False, error=str(e))
    
    def cancel_order(self, order_id: str) -> bool:
        """Cancel an order by ID."""
        try:
            self.client.cancel(order_id)
            logger.info(f"✅ Order cancelled: {order_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Cancel failed: {e}")
            return False
    
    def cancel_all_orders(self) -> bool:
        """Cancel all open orders."""
        try:
            self.client.cancel_all()
            logger.info("✅ All orders cancelled")
            return True
        except Exception as e:
            logger.error(f"❌ Cancel all failed: {e}")
            return False
    
    def get_open_orders(self) -> List[Dict]:
        """Get all open orders."""
        try:
            return self.client.get_orders(OpenOrderParams())
        except Exception as e:
            logger.error(f"Failed to get orders: {e}")
            return []
    
    def get_trade_history(self) -> List[Dict]:
        """Get trade history."""
        try:
            return self.client.get_trades()
        except Exception as e:
            logger.error(f"Failed to get trades: {e}")
            return []


# ============================================================================
# AUTONOMOUS TRADING BOT
# ============================================================================

class AutonomousTradingBot:
    """
    Autonomous trading bot that monitors Binance prices and trades on Polymarket.
    
    Strategy:
    - Monitor BTC/ETH prices on Binance via WebSocket
    - When significant price movement detected in first 5 minutes of a 15-minute window
    - Place trades on Polymarket UP/DOWN markets
    """
    
    def __init__(self):
        self.trader = PolymarketTrader()
        self.running = False
        self.paused = False
        self.pause_reason = ""
        
        # Price tracking
        self.prices = {'BTC': deque(maxlen=1000), 'ETH': deque(maxlen=1000)}
        self.current_windows = {'BTC': None, 'ETH': None}
        
        # Stats
        self.daily_stats = self._load_stats()
        self.trades_this_hour = deque(maxlen=Config.MAX_TRADES_PER_HOUR)
        
    def _load_stats(self) -> DailyStats:
        """Load or create daily stats."""
        today = datetime.now().strftime("%Y-%m-%d")
        
        if os.path.exists(Config.STATE_FILE):
            try:
                with open(Config.STATE_FILE, 'r') as f:
                    data = json.load(f)
                    if data.get('date') == today:
                        return DailyStats(**data)
            except:
                pass
        
        return DailyStats(date=today)
    
    def _save_stats(self):
        """Save daily stats."""
        with open(Config.STATE_FILE, 'w') as f:
            json.dump(asdict(self.daily_stats), f, indent=2)
    
    def check_safety(self) -> bool:
        """Check if trading is safe to continue."""
        # Check daily loss limit
        if self.daily_stats.total_pnl <= -Config.MAX_DAILY_LOSS_USD:
            self.paused = True
            self.pause_reason = f"Daily loss limit hit: ${abs(self.daily_stats.total_pnl):.2f}"
            logger.warning(f"🛑 {self.pause_reason}")
            return False
        
        # Check consecutive losses
        if self.daily_stats.consecutive_losses >= Config.MAX_CONSECUTIVE_LOSSES:
            self.paused = True
            self.pause_reason = f"{Config.MAX_CONSECUTIVE_LOSSES} consecutive losses"
            logger.warning(f"🛑 {self.pause_reason}")
            return False
        
        # Check hourly rate
        now = time.time()
        self.trades_this_hour = deque(
            [t for t in self.trades_this_hour if now - t < 3600],
            maxlen=Config.MAX_TRADES_PER_HOUR
        )
        if len(self.trades_this_hour) >= Config.MAX_TRADES_PER_HOUR:
            logger.info("⏸️ Hourly trade limit reached")
            return False
        
        return True
    
    async def monitor_binance(self, asset: str):
        """Monitor Binance WebSocket for price updates."""
        url = f"wss://stream.binance.com:9443/ws/{asset.lower()}usdt@trade"
        
        while self.running:
            try:
                async with websockets.connect(url) as ws:
                    logger.info(f"✅ Connected to Binance {asset} WebSocket")
                    
                    while self.running:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        price = float(data['p'])
                        
                        self.prices[asset].append({
                            'timestamp': datetime.now(),
                            'price': price
                        })
                        
                        # Check for trading opportunity
                        await self._check_opportunity(asset, price)
                        
            except Exception as e:
                logger.error(f"WebSocket error for {asset}: {e}")
                await asyncio.sleep(5)
    
    async def _check_opportunity(self, asset: str, price: float):
        """Check if there's a trading opportunity."""
        # This is a simplified version - implement your actual strategy here
        pass
    
    async def run(self):
        """Main run loop."""
        self.running = True
        
        # Connect to Polymarket
        if not self.trader.connect():
            logger.error("Failed to connect to Polymarket")
            return
        
        logger.info("🚀 Autonomous Trading Bot Started")
        logger.info(f"📊 Mode: {'PAPER' if Config.PAPER_TRADING else 'LIVE'}")
        logger.info(f"💰 Balance: ${self.trader.get_balance():.2f}")
        
        try:
            tasks = [
                self.monitor_binance('BTC'),
                self.monitor_binance('ETH'),
            ]
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("👋 Shutting down...")
            self.running = False


# ============================================================================
# INTERACTIVE TESTING
# ============================================================================

def test_trading():
    """Interactive test of trading functionality."""
    print("\n" + "="*60)
    print("POLYMARKET TRADING TEST - MIYAMOTO LABS")
    print("="*60 + "\n")
    
    trader = PolymarketTrader()
    
    print("1. Connecting to Polymarket...")
    if not trader.connect():
        print("❌ Failed to connect")
        return
    
    print(f"\n2. Balance: ${trader.get_balance():.2f} USDC")
    
    if trader.get_balance() < 1.0:
        print("\n⚠️ IMPORTANT: Your wallet needs USDC to trade!")
        print(f"   Wallet address: {trader.config.WALLET_ADDRESS}")
        print("   Transfer USDC (Polygon) to this address via Polymarket's deposit feature.")
        print("\n   Current wallet setup is using signature_type=0 (EOA)")
        print("   The funds are currently in a Magic wallet (signature_type=1)")
        print("\n   To use this bot:")
        print("   1. Go to polymarket.com")
        print("   2. Click on your profile → Wallet → Withdraw")
        print("   3. Withdraw to your EOA wallet address above")
        print("   4. Or deposit fresh USDC directly to the wallet")
        return
    
    print("\n3. Finding active markets...")
    markets = trader.find_active_markets(limit=5)
    print(f"   Found {len(markets)} markets with liquidity")
    
    for i, m in enumerate(markets[:5], 1):
        print(f"\n   [{i}] {m.question[:50]}...")
        print(f"       YES: ${m.yes_price:.4f} (${m.liquidity_yes:.0f})")
        print(f"       NO:  ${m.no_price:.4f} (${m.liquidity_no:.0f})")
    
    if markets:
        print("\n4. Test order (PAPER MODE)...")
        Config.PAPER_TRADING = True
        result = trader.place_limit_order(
            token_id=markets[0].token_yes_id,
            side="BUY",
            price=0.01,
            size=5.0
        )
        print(f"   Result: {'✅ Success' if result.success else '❌ Failed'}")
        if result.order_id:
            print(f"   Order ID: {result.order_id}")
    
    print("\n5. Trade history...")
    trades = trader.get_trade_history()
    print(f"   {len(trades)} historical trades found")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


def main():
    """Entry point."""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_trading()
    else:
        bot = AutonomousTradingBot()
        asyncio.run(bot.run())


if __name__ == "__main__":
    main()
