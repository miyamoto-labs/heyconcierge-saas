#!/usr/bin/env python3
"""
Polymarket Chainlink Lag Arbitrage Bot
Exploits lag between Binance real-time prices and Chainlink oracle updates
Target: 15-minute BTC/ETH markets on Polymarket

STRATEGY:
- Monitor Binance WebSocket for real-time BTC/ETH prices
- Track price at START of each 15-minute market window
- When Binance shows significant move (±0.3%+) in first 5 minutes
- Execute trade BEFORE market odds fully adjust
- Market settles based on Chainlink data (which lags spot markets)

RISK MANAGEMENT:
- Paper trading mode by default
- $15 position size per trade
- Stop after 3 consecutive losses
- Only trade in first 5 minutes of 15-min window
"""

import asyncio
import websockets
import requests
import json
import time
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.insert(0, '/Users/erik/.openclaw/workspace')
from datetime import datetime, timedelta
from typing import Dict, Optional
from dataclasses import dataclass
from collections import deque

# Import the working CLOB executor
from polymarket_clob_executor import PolymarketExecutor

# Load wallet from environment variables (SECURE)
PRIVATE_KEY = os.getenv('POLYMARKET_PRIVATE_KEY')
WALLET_ADDRESS = os.getenv('POLYMARKET_ADDRESS')

if not PRIVATE_KEY or not WALLET_ADDRESS:
    raise ValueError("POLYMARKET_PRIVATE_KEY and POLYMARKET_ADDRESS must be set in .env file")

# ============================================================================
# CONFIGURATION
# ============================================================================

PAPER_TRADING = True  # Paper mode for testing fixes
POSITION_SIZE = 3.0   # $3 per trade (reduced - low funds)
MIN_PRICE_MOVE = 0.005  # 0.5% minimum price movement to trigger trade (increased from 0.3%)
MAX_TRADE_WINDOW = 300  # Only trade in first 5 minutes of 15-min window
MAX_CONSECUTIVE_LOSSES = 3  # Stop trading after this many losses in a row
TELEGRAM_ALERTS = True  # Send Telegram alerts (via OpenClaw)

# Arbitrage detection - ACTUAL LAG, not just price movement
MIN_ODDS_INEFFICIENCY = 0.10  # Odds must be at least 10% off from fair value
# Example: If BTC moved +0.8%, fair odds for UP should be ~0.65-0.70
# If market still shows 0.50, that's 15-20% inefficiency = TRADE
# If market already adjusted to 0.68, that's only 2% inefficiency = SKIP

# Binance WebSocket
BINANCE_WS = {
    'BTC': 'wss://stream.binance.com:9443/ws/btcusdt@trade',
    'ETH': 'wss://stream.binance.com:9443/ws/ethusdt@trade'
}

# Polymarket API
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class MarketWindow:
    """Represents a 15-minute market window"""
    asset: str  # BTC or ETH
    start_time: datetime
    end_time: datetime
    start_price: Optional[float] = None
    current_price: Optional[float] = None
    market_slug: Optional[str] = None
    market_id: Optional[str] = None
    traded: bool = False
    
    @property
    def seconds_elapsed(self) -> int:
        return int((datetime.now() - self.start_time).total_seconds())
    
    @property
    def can_trade(self) -> bool:
        """Can only trade in first 5 minutes"""
        return not self.traded and self.seconds_elapsed < MAX_TRADE_WINDOW
    
    @property
    def price_change_pct(self) -> float:
        """Calculate price change %"""
        if not self.start_price or not self.current_price:
            return 0.0
        return (self.current_price - self.start_price) / self.start_price

@dataclass
class TradeSignal:
    """Trading signal"""
    asset: str
    direction: str  # 'UP' or 'DOWN'
    confidence: float  # 0-1
    entry_price: float
    current_price: float
    price_change_pct: float
    seconds_into_window: int
    reason: str

@dataclass
class Trade:
    """Executed trade"""
    timestamp: datetime
    asset: str
    direction: str
    size: float
    entry_odds: float
    exit_odds: Optional[float] = None
    pnl: Optional[float] = None
    market_slug: str = ""
    
# ============================================================================
# BOT CLASS
# ============================================================================

class ChainlinkLagBot:
    def __init__(self):
        self.prices = {'BTC': deque(maxlen=1000), 'ETH': deque(maxlen=1000)}
        self.current_windows = {'BTC': None, 'ETH': None}
        self.trades = []
        self.consecutive_losses = 0
        self.running = False
        
        # Stats
        self.total_trades = 0
        self.winning_trades = 0
        self.total_pnl = 0.0
        
        # Initialize CLOB executor for live trading
        if not PAPER_TRADING:
            self.executor = PolymarketExecutor(
                private_key=PRIVATE_KEY,
                wallet_address=WALLET_ADDRESS,
                paper_mode=False
            )
        else:
            self.executor = None
        
    def log(self, msg: str, level: str = "INFO"):
        """Logging with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        prefix = {
            "INFO": "📊",
            "SIGNAL": "🎯",
            "TRADE": "💰",
            "ERROR": "❌",
            "SUCCESS": "✅"
        }.get(level, "ℹ️")
        print(f"[{timestamp}] {prefix} {msg}")
        
    def telegram_alert(self, message: str):
        """Send Telegram alert via OpenClaw"""
        if not TELEGRAM_ALERTS:
            return
        
        print("\n" + "="*70)
        print("TELEGRAM_ALERT")
        print(message)
        print("="*70 + "\n")
    
    def get_current_market_window(self, asset: str) -> Optional[MarketWindow]:
        """Get current 15-minute market window"""
        try:
            # Markets are created at :00, :15, :30, :45 of each hour
            now = datetime.now()
            minute = now.minute
            
            # Find current 15-min window
            window_start_minute = (minute // 15) * 15
            window_start = now.replace(minute=window_start_minute, second=0, microsecond=0)
            window_end = window_start + timedelta(minutes=15)
            
            # Search for matching market on Polymarket
            slug_pattern = f"{asset.lower()}-updown-15m-{int(window_start.timestamp())}"
            
            return MarketWindow(
                asset=asset,
                start_time=window_start,
                end_time=window_end,
                market_slug=slug_pattern
            )
            
        except Exception as e:
            self.log(f"Error getting market window: {e}", "ERROR")
            return None
    
    def update_price(self, asset: str, price: float):
        """Update price and check for trading opportunities"""
        self.prices[asset].append({
            'timestamp': datetime.now(),
            'price': price
        })
        
        # Get or create current market window
        window = self.current_windows.get(asset)
        
        if not window or datetime.now() >= window.end_time:
            # New window started
            new_window = self.get_current_market_window(asset)
            if new_window:
                new_window.start_price = price
                self.current_windows[asset] = new_window
                self.log(f"{asset} - New 15-min window started at ${price:,.2f}")
                window = new_window
        
        if window:
            window.current_price = price
            
            # Check for trading signal
            if window.can_trade:
                signal = self.analyze_opportunity(window)
                if signal:
                    self.execute_trade(signal, window)
    
    def analyze_opportunity(self, window: MarketWindow) -> Optional[TradeSignal]:
        """
        Analyze if there's a REAL arbitrage opportunity.
        
        CRITICAL: Only trade when:
        1. Binance price moved significantly (±0.5%+)
        2. Polymarket odds haven't fully adjusted yet
        3. There's clear odds inefficiency (10%+ gap)
        
        This is NOT about predicting direction - it's about catching LAG!
        """
        if not window.start_price or not window.current_price:
            return None
        
        price_change = window.price_change_pct
        
        # Need significant move
        if abs(price_change) < MIN_PRICE_MOVE:
            return None
        
        # Determine direction
        direction = "UP" if price_change > 0 else "DOWN"
        
        # === CRITICAL: Check for ACTUAL arbitrage (odds lag) ===
        # Fetch current Polymarket odds for this market
        if not window.market_slug:
            return None
        
        try:
            # Get current market odds (this would be a real API call)
            # For now, we'll simulate - in production, fetch from CLOB orderbook
            from polymarket_clob_executor import PolymarketExecutor
            executor = PolymarketExecutor(PRIVATE_KEY, WALLET_ADDRESS, paper_mode=True)
            yes_token, no_token = executor.get_market_tokens(window.market_slug)
            
            if not yes_token:
                return None  # Market not found
            
            # Get orderbook
            token_id = yes_token if direction == "UP" else no_token
            book = executor.get_orderbook(token_id)
            
            if not book:
                return None
            
            current_odds = book['best_ask']  # What we'd pay to buy
            
            # Calculate "fair" odds based on price movement
            # Simple model: abs(price_change) maps to probability
            # 0.5% move ≈ 60% probability, 1.0% move ≈ 70% probability
            fair_odds = 0.50 + (abs(price_change) * 20)  # Rough heuristic
            fair_odds = min(fair_odds, 0.85)  # Cap at 85%
            
            # Calculate odds inefficiency
            odds_gap = fair_odds - current_odds
            
            # Only trade if there's ACTUAL inefficiency
            if odds_gap < MIN_ODDS_INEFFICIENCY:
                self.log(
                    f"{window.asset} - No arbitrage: fair={fair_odds:.2f}, "
                    f"market={current_odds:.2f}, gap={odds_gap:.2f} (need {MIN_ODDS_INEFFICIENCY})",
                    "INFO"
                )
                return None
            
            # Found arbitrage opportunity!
            confidence = min(odds_gap / 0.20, 1.0)  # Higher gap = higher confidence
            
            reason = (
                f"ARBITRAGE: Price moved {price_change*100:+.2f}%, "
                f"fair odds ~{fair_odds:.2f} but market still at {current_odds:.2f} "
                f"(inefficiency: {odds_gap:.2f})"
            )
            
            return TradeSignal(
                asset=window.asset,
                direction=direction,
                confidence=confidence,
                entry_price=window.start_price,
                current_price=window.current_price,
                price_change_pct=price_change,
                seconds_into_window=window.seconds_elapsed,
                reason=reason
            )
            
        except Exception as e:
            self.log(f"Error checking arbitrage: {e}", "ERROR")
            return None
    
    def execute_trade(self, signal: TradeSignal, window: MarketWindow):
        """Execute trade (paper or real)"""
        
        # Check if we should stop trading
        if self.consecutive_losses >= MAX_CONSECUTIVE_LOSSES:
            self.log(f"🛑 STOPPED: {MAX_CONSECUTIVE_LOSSES} consecutive losses", "ERROR")
            return
        
        window.traded = True
        
        # Get market odds (simulate for now)
        # In real implementation, fetch from Polymarket CLOB API
        entry_odds = 0.5  # Simplified - would fetch real odds
        
        # Calculate position size
        position_size = POSITION_SIZE
        
        # Log trade
        trade = Trade(
            timestamp=datetime.now(),
            asset=signal.asset,
            direction=signal.direction,
            size=position_size,
            entry_odds=entry_odds,
            market_slug=window.market_slug or ""
        )
        
        self.trades.append(trade)
        self.total_trades += 1
        
        # Log signal
        self.log(
            f"{signal.asset} - TRADE SIGNAL: {signal.direction} | "
            f"Confidence: {signal.confidence:.1%} | "
            f"Price Δ: {signal.price_change_pct*100:+.2f}% | "
            f"Window: {signal.seconds_into_window}s/{MAX_TRADE_WINDOW}s",
            "SIGNAL"
        )
        
        if PAPER_TRADING:
            self.log(
                f"📝 PAPER TRADE: {signal.direction} {signal.asset} | "
                f"Size: ${position_size:.2f} | "
                f"Reason: {signal.reason}",
                "TRADE"
            )
        else:
            self.log(
                f"💸 LIVE TRADE: {signal.direction} {signal.asset} | "
                f"Size: ${position_size:.2f}",
                "TRADE"
            )
            # Execute real trade via Polymarket CLOB API
            if self.executor and window.market_slug:
                result = self.executor.place_order(
                    market_slug=window.market_slug,
                    direction=signal.direction,
                    size_usd=position_size,
                    order_type="MARKET"
                )
                if result.success:
                    self.log(f"✅ Order executed: {result.order_id} @ {result.price:.4f}", "SUCCESS")
                    trade.entry_odds = result.price
                else:
                    self.log(f"❌ Order failed: {result.error}", "ERROR")
        
        # Send Telegram alert
        alert_msg = f"""🤖 **CHAINLINK LAG BOT - TRADE EXECUTED**

📈 **Asset:** {signal.asset}
🎯 **Direction:** {signal.direction}
💰 **Position:** ${position_size:.2f}
📊 **Confidence:** {signal.confidence:.1%}

📉 **Price Move:** {signal.price_change_pct*100:+.2f}%
⏱️ **Window Position:** {signal.seconds_into_window}s / {MAX_TRADE_WINDOW}s
💡 **Reason:** {signal.reason}

{'📝 **MODE:** PAPER TRADING' if PAPER_TRADING else '💸 **MODE:** LIVE TRADING'}

**Strategy:** Binance moved but Chainlink hasn't settled yet!
"""
        self.telegram_alert(alert_msg)
    
    async def binance_websocket(self, asset: str):
        """Monitor Binance WebSocket for real-time prices"""
        url = BINANCE_WS[asset]
        
        while self.running:
            try:
                async with websockets.connect(url) as ws:
                    self.log(f"✅ Connected to Binance {asset} WebSocket", "SUCCESS")
                    
                    while self.running:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        
                        price = float(data['p'])
                        self.update_price(asset, price)
                        
            except Exception as e:
                self.log(f"WebSocket error for {asset}: {e}", "ERROR")
                await asyncio.sleep(5)
    
    async def monitor_markets(self):
        """Monitor all markets"""
        tasks = [
            self.binance_websocket('BTC'),
            self.binance_websocket('ETH'),
            self.status_reporter()
        ]
        
        await asyncio.gather(*tasks)
    
    async def status_reporter(self):
        """Report status every 60 seconds"""
        while self.running:
            await asyncio.sleep(60)
            
            btc_window = self.current_windows.get('BTC')
            eth_window = self.current_windows.get('ETH')
            
            status_lines = [
                "📊 STATUS UPDATE",
                f"   Total trades: {self.total_trades}",
                f"   Win rate: {self.winning_trades}/{self.total_trades}" if self.total_trades > 0 else "   Win rate: N/A",
                f"   P&L: ${self.total_pnl:.2f}" if self.total_pnl != 0 else "   P&L: $0.00",
            ]
            
            if btc_window:
                status_lines.append(
                    f"   BTC: ${btc_window.current_price:,.2f} "
                    f"({btc_window.price_change_pct*100:+.2f}% | {btc_window.seconds_elapsed}s)"
                )
            
            if eth_window:
                status_lines.append(
                    f"   ETH: ${eth_window.current_price:,.2f} "
                    f"({eth_window.price_change_pct*100:+.2f}% | {eth_window.seconds_elapsed}s)"
                )
            
            self.log("\n".join(status_lines))
    
    async def run(self):
        """Main run loop"""
        self.running = True
        
        self.log("🚀 CHAINLINK LAG BOT STARTING")
        self.log(f"⚙️  Mode: {'📝 PAPER TRADING' if PAPER_TRADING else '💸 LIVE TRADING'}")
        self.log(f"⚙️  Position size: ${POSITION_SIZE:.2f}")
        self.log(f"⚙️  Min price move: {MIN_PRICE_MOVE*100:.2f}%")
        self.log(f"⚙️  Trade window: First {MAX_TRADE_WINDOW}s of 15-min markets")
        self.log("")
        
        try:
            await self.monitor_markets()
        except KeyboardInterrupt:
            self.log("👋 Shutting down...")
            self.running = False
        finally:
            self.print_summary()
    
    def print_summary(self):
        """Print trading summary"""
        self.log("\n" + "="*70)
        self.log("📊 TRADING SUMMARY")
        self.log("="*70)
        self.log(f"   Total trades: {self.total_trades}")
        self.log(f"   Winning trades: {self.winning_trades}")
        self.log(f"   Win rate: {self.winning_trades/self.total_trades*100:.1f}%" if self.total_trades > 0 else "   Win rate: N/A")
        self.log(f"   Total P&L: ${self.total_pnl:.2f}")
        self.log("="*70)

# ============================================================================
# MAIN
# ============================================================================

async def main():
    bot = ChainlinkLagBot()
    await bot.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Stopped by user")
