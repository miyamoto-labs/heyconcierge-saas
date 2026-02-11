#!/usr/bin/env python3
"""
Polymarket Autonomous Trading Bot v2 - PRODUCTION
Integrates proper CLOB executor with EIP-712 signing
Now with ADAPTIVE LEARNING - gets smarter with every trade!
"""

import sys
sys.path.insert(0, '/Users/erik/.openclaw/workspace')

import asyncio
import websockets
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict
from collections import deque
import os

from polymarket_clob_executor import PolymarketExecutor
from polymarket_learning import LearningEngine

# ============================================================================
# CONFIGURATION
# ============================================================================

# MODE
PAPER_TRADING = False  # LIVE TRADING ENABLED
AUTO_EXECUTE = True

# POSITION SIZING
POSITION_SIZE = 5.0  # $5 per trade for production
MAX_DAILY_LOSS = 20.0  # Pause if lose $20 in a day
MAX_CONSECUTIVE_LOSSES = 3

# SIGNAL THRESHOLDS - HYPERACTIVE MODE (50+ trades/day target)
MIN_PRICE_MOVE = 0.0005  # 0.05% minimum move (very sensitive)
MAX_TRADE_WINDOW = 840   # Trade in first 14 minutes (almost full window)
MIN_CONFIDENCE = 0.20    # Very low threshold - trade on any signal
TRADE_COOLDOWN = 90      # Can re-trade same window after 90 sec cooldown

# WALLET
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class MarketWindow:
    """15-minute market window"""
    asset: str
    start_time: datetime
    end_time: datetime
    start_price: Optional[float] = None
    current_price: Optional[float] = None
    market_slug: Optional[str] = None
    token_yes_id: Optional[str] = None
    token_no_id: Optional[str] = None
    trade_count: int = 0
    last_trade_time: Optional[datetime] = None
    last_trade_direction: Optional[str] = None
    
    @property
    def seconds_elapsed(self) -> int:
        return int((datetime.now() - self.start_time).total_seconds())
    
    @property
    def can_trade(self) -> bool:
        # Can trade if: within window AND (never traded OR cooldown passed)
        if self.seconds_elapsed >= MAX_TRADE_WINDOW:
            return False
        if self.last_trade_time is None:
            return True
        seconds_since_trade = (datetime.now() - self.last_trade_time).total_seconds()
        return seconds_since_trade >= TRADE_COOLDOWN
    
    @property
    def price_change_pct(self) -> float:
        if not self.start_price or not self.current_price:
            return 0.0
        return (self.current_price - self.start_price) / self.start_price

@dataclass
class ExecutedTrade:
    timestamp: datetime
    asset: str
    direction: str
    size: float
    entry_price: float
    market_slug: str
    confidence: float
    order_id: str
    result: Optional[str] = None
    pnl: Optional[float] = None

@dataclass
class DailyStats:
    date: str
    total_trades: int = 0
    winning_trades: int = 0
    total_pnl: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    consecutive_losses: int = 0

# ============================================================================
# TRADING BOT
# ============================================================================

class PolymarketTradingBot:
    """Production trading bot with proper order execution and ADAPTIVE LEARNING"""
    
    def __init__(self):
        self.prices = {'BTC': deque(maxlen=1000), 'ETH': deque(maxlen=1000)}
        self.current_windows = {'BTC': None, 'ETH': None}
        self.completed_windows = []  # Track windows for resolution
        
        # Initialize executor
        self.executor = PolymarketExecutor(
            private_key=PRIVATE_KEY,
            wallet_address=WALLET_ADDRESS,
            paper_mode=PAPER_TRADING
        )
        
        # Initialize learning engine
        self.learning = LearningEngine()
        
        # Trading state
        self.trades: List[ExecutedTrade] = []
        self.pending_trade_ids = {}  # market_slug -> trade_id for resolution
        self.daily_stats = self._load_daily_stats()
        self.running = False
        self.paused = False
        
        # Rate limiting
        self.trades_this_hour = deque(maxlen=20)
        self.trades_today = []
    
    def _load_daily_stats(self) -> DailyStats:
        """Load or create today's stats"""
        today = datetime.now().strftime("%Y-%m-%d")
        return DailyStats(date=today)
    
    def log(self, msg: str, level: str = "INFO"):
        """Enhanced logging"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        emoji = {
            "INFO": "📊",
            "SIGNAL": "🎯",
            "EXECUTE": "⚡",
            "WIN": "✅",
            "LOSS": "❌",
            "PAUSE": "🛑",
            "ERROR": "🔥",
            "LEARN": "🧠",
            "ADAPT": "🔧"
        }.get(level, "ℹ️")
        
        print(f"[{timestamp}] {emoji} {msg}")
    
    def check_safety_limits(self) -> bool:
        """Check if bot should pause trading"""
        if abs(self.daily_stats.total_pnl) >= MAX_DAILY_LOSS:
            if not self.paused:
                self.paused = True
                self.log(f"Daily loss limit hit: ${abs(self.daily_stats.total_pnl):.2f}", "PAUSE")
            return False
        
        if self.daily_stats.consecutive_losses >= MAX_CONSECUTIVE_LOSSES:
            if not self.paused:
                self.paused = True
                self.log(f"{MAX_CONSECUTIVE_LOSSES} consecutive losses", "PAUSE")
            return False
        
        return True
    
    def update_price(self, asset: str, price: float):
        """Update price and check for opportunities"""
        self.prices[asset].append({
            'timestamp': datetime.now(),
            'price': price
        })
        
        window = self.current_windows.get(asset)
        
        if not window or datetime.now() >= window.end_time:
            # 🧠 LEARNING: Resolve trades from the ending window
            if window and window.market_slug:
                self._resolve_window_trades(window, price)
            
            new_window = self._create_market_window(asset, price)
            if new_window:
                self.current_windows[asset] = new_window
                self.log(f"{asset} - New 15-min window at ${price:,.2f}")
                window = new_window
        
        if window:
            window.current_price = price
            
            if window.can_trade and AUTO_EXECUTE and not self.paused:
                signal = self._analyze_opportunity(window)
                # Use learned MIN_CONFIDENCE instead of hardcoded
                effective_min_confidence = self.learning.learned_params.min_confidence
                if signal and signal['confidence'] >= effective_min_confidence:
                    self._auto_execute_trade(signal, window)
    
    def _resolve_window_trades(self, window: MarketWindow, end_price: float):
        """🧠 LEARNING: Resolve all trades from a completed window"""
        if not window.market_slug:
            return
        
        if window.market_slug not in self.pending_trade_ids:
            return
        
        pending = self.pending_trade_ids.pop(window.market_slug)
        
        # Resolve in the learning engine
        self.learning.resolve_by_market_slug(
            market_slug=window.market_slug,
            window_end_price=end_price,
            window_start_price=pending['window_start_price']
        )
        
        # Update local trade records
        for trade in self.trades:
            if trade.market_slug == window.market_slug and trade.result == "PENDING":
                actual_direction = "UP" if end_price > pending['window_start_price'] else "DOWN"
                if trade.direction == actual_direction:
                    trade.result = "WIN"
                    trade.pnl = 4.50  # Conservative win estimate
                    self.daily_stats.winning_trades += 1
                    self.daily_stats.consecutive_losses = 0
                else:
                    trade.result = "LOSS"
                    trade.pnl = -5.00
                    self.daily_stats.consecutive_losses += 1
                
                self.daily_stats.total_pnl += trade.pnl
    
    def _create_market_window(self, asset: str, price: float) -> MarketWindow:
        """Create new market window"""
        now = datetime.now()
        minute = now.minute
        
        window_start_minute = (minute // 15) * 15
        window_start = now.replace(minute=window_start_minute, second=0, microsecond=0)
        window_end = window_start + timedelta(minutes=15)
        
        timestamp = int(window_start.timestamp())
        market_slug = f"{asset.lower()}-updown-15m-{timestamp}"
        
        # Fetch token IDs from Polymarket
        yes_token, no_token = self.executor.get_market_tokens(market_slug)
        
        return MarketWindow(
            asset=asset,
            start_time=window_start,
            end_time=window_end,
            start_price=price,
            market_slug=market_slug,
            token_yes_id=yes_token,
            token_no_id=no_token
        )
    
    def _analyze_opportunity(self, window: MarketWindow) -> Optional[Dict]:
        """Analyze if there's a tradeable opportunity - NOW WITH ADAPTIVE LEARNING"""
        if not window.start_price or not window.current_price:
            return None
        
        price_change = window.price_change_pct
        
        if abs(price_change) < MIN_PRICE_MOVE:
            return None
        
        direction = "UP" if price_change > 0 else "DOWN"
        
        # Calculate BASE confidence - more aggressive scoring
        magnitude_score = min(abs(price_change) / 0.005, 1.0)  # Full score at 0.5%
        timing_score = 1.0 - (window.seconds_elapsed / MAX_TRADE_WINDOW) * 0.5  # Less time penalty
        momentum_bonus = 0.1 if abs(price_change) > 0.002 else 0  # Bonus for stronger moves
        
        base_confidence = (magnitude_score * 0.6 + timing_score * 0.3 + momentum_bonus + 0.1)  # Base 10% boost
        
        # 🧠 LEARNING: Adjust confidence based on historical performance
        adjusted_confidence, adjustments = self.learning.get_adjusted_confidence(
            asset=window.asset,
            direction=direction,
            base_confidence=base_confidence,
            time_in_window=window.seconds_elapsed
        )
        
        # 🧠 LEARNING: Check if we should skip this trade entirely
        should_skip, skip_reason = self.learning.should_skip_trade(
            asset=window.asset,
            direction=direction,
            adjusted_confidence=adjusted_confidence
        )
        
        if should_skip:
            # Log but don't spam - only log occasionally
            if window.trade_count == 0 and window.seconds_elapsed % 60 < 2:
                self.log(f"🧠 Skipping {window.asset} {direction}: {skip_reason}", "LEARN")
            return None
        
        # Use learned MIN_CONFIDENCE instead of hardcoded
        effective_min_confidence = self.learning.learned_params.min_confidence
        if adjusted_confidence < effective_min_confidence:
            return None
        
        # Log adjustment if significant
        total_adjustment = adjusted_confidence - base_confidence
        if abs(total_adjustment) >= 0.02:
            adj_str = f"{total_adjustment:+.1%}"
            self.log(f"🧠 {window.asset} {direction}: confidence {base_confidence:.1%} → {adjusted_confidence:.1%} ({adj_str})", "LEARN")
        
        return {
            'asset': window.asset,
            'direction': direction,
            'confidence': min(adjusted_confidence, 0.95),  # Cap at 95%
            'base_confidence': base_confidence,
            'adjustments': adjustments,
            'price_change': price_change,
            'entry_price': window.start_price,
            'current_price': window.current_price,
            'seconds': window.seconds_elapsed,
            'window_trades': window.trade_count
        }
    
    def _auto_execute_trade(self, signal: Dict, window: MarketWindow):
        """Execute trade using proper CLOB executor - NOW WITH LEARNING INTEGRATION"""
        if not self.check_safety_limits():
            return
        
        # Skip if same direction as last trade in this window
        if window.last_trade_direction == signal['direction']:
            return
        
        window.trade_count += 1
        window.last_trade_time = datetime.now()
        window.last_trade_direction = signal['direction']
        
        self.log(
            f"{signal['asset']} - AUTO-EXECUTING: {signal['direction']} | "
            f"Confidence: {signal['confidence']:.1%} | "
            f"Move: {signal['price_change']*100:+.2f}%",
            "EXECUTE"
        )
        
        # EXECUTE ON POLYMARKET using proper executor
        result = self.executor.place_order(
            market_slug=window.market_slug,
            direction=signal['direction'],
            size_usd=POSITION_SIZE,
            order_type="MARKET"
        )
        
        if not result.success:
            self.log(f"Trade execution failed: {result.error}", "ERROR")
            return
        
        # 🧠 LEARNING: Record trade for learning
        trade_id = self.learning.record_trade(
            asset=signal['asset'],
            direction=signal['direction'],
            confidence=signal['confidence'],
            price_at_entry=signal['current_price'],
            price_change_at_entry=signal['price_change'],
            time_in_window=signal['seconds'],
            window_start_price=signal['entry_price'],
            order_id=result.order_id,
            market_slug=window.market_slug
        )
        
        # Track for resolution when window ends
        self.pending_trade_ids[window.market_slug] = {
            'trade_id': trade_id,
            'window_start_price': window.start_price,
            'window_end_time': window.end_time
        }
        
        # Record trade in local state
        trade = ExecutedTrade(
            timestamp=datetime.now(),
            asset=signal['asset'],
            direction=signal['direction'],
            size=POSITION_SIZE,
            entry_price=result.price,
            market_slug=window.market_slug,
            confidence=signal['confidence'],
            order_id=result.order_id,
            result="PENDING"
        )
        
        self.trades.append(trade)
        self.trades_this_hour.append(time.time())
        self.trades_today.append(trade)
        self.daily_stats.total_trades += 1
        
        mode_str = "📝 PAPER" if PAPER_TRADING else "💸 LIVE"
        self.log(
            f"{mode_str} - Trade executed: {signal['direction']} "
            f"${POSITION_SIZE:.2f} @ {result.price:.4f} "
            f"({result.size:.2f} shares) - {result.order_id}",
            "EXECUTE"
        )
    
    async def binance_websocket(self, asset: str):
        """Monitor Binance WebSocket"""
        url = f"wss://stream.binance.com:9443/ws/{asset.lower()}usdt@trade"
        
        while self.running:
            try:
                async with websockets.connect(url) as ws:
                    self.log(f"✅ Connected to Binance {asset} WebSocket", "INFO")
                    
                    while self.running:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        price = float(data['p'])
                        self.update_price(asset, price)
                        
            except Exception as e:
                self.log(f"WebSocket error for {asset}: {e}", "ERROR")
                await asyncio.sleep(5)
    
    async def status_reporter(self):
        """Report status periodically - NOW WITH LEARNING STATS"""
        while self.running:
            await asyncio.sleep(180)  # Every 3 minutes
            
            # Get learning stats
            lp = self.learning.learned_params
            overall = self.learning._get_overall_stats()
            
            win_rate_str = f"{overall['win_rate']:.1%}" if overall['total'] > 0 else "N/A"
            
            status = [
                "📊 BOT STATUS",
                f"   Mode: {'📝 PAPER' if PAPER_TRADING else '💸 LIVE'}",
                f"   State: {'🛑 PAUSED' if self.paused else '✅ ACTIVE'}",
                f"   Trades today: {self.daily_stats.total_trades}",
                f"   Win rate (today): {self.daily_stats.winning_trades}/{self.daily_stats.total_trades}",
                f"   P&L (today): ${self.daily_stats.total_pnl:.2f}",
                "",
                "🧠 LEARNING ENGINE",
                f"   Historical trades: {overall['total']}",
                f"   Historical win rate: {win_rate_str}",
                f"   Historical P&L: ${overall['total_pnl']:.2f}",
                f"   Min confidence: {lp.min_confidence:.0%}",
                f"   Params version: v{lp.version}",
            ]
            
            # Show any active modifiers
            active_mods = []
            for asset, mod in lp.asset_modifiers.items():
                if mod != 0:
                    active_mods.append(f"{asset}:{mod:+.0%}")
            for direction, mod in lp.direction_modifiers.items():
                if mod != 0:
                    active_mods.append(f"{direction}:{mod:+.0%}")
            
            if active_mods:
                status.append(f"   Active modifiers: {', '.join(active_mods)}")
            
            self.log("\n".join(status))
    
    async def run(self):
        """Main run loop"""
        self.running = True
        
        # Get learning stats for startup
        lp = self.learning.learned_params
        overall = self.learning._get_overall_stats()
        
        self.log("🚀 POLYMARKET BOT STARTING - PRODUCTION VERSION WITH ADAPTIVE LEARNING")
        self.log(f"⚙️  Mode: {'📝 PAPER TRADING' if PAPER_TRADING else '💸 LIVE TRADING'}")
        self.log(f"⚙️  Position size: ${POSITION_SIZE:.2f}")
        self.log(f"⚙️  Wallet: {WALLET_ADDRESS}")
        self.log("")
        self.log("🧠 LEARNING ENGINE LOADED")
        self.log(f"   Historical trades: {overall['total']}")
        if overall['total'] > 0:
            self.log(f"   Historical win rate: {overall['win_rate']:.1%}")
            self.log(f"   Historical P&L: ${overall['total_pnl']:.2f}")
        self.log(f"   Learned min confidence: {lp.min_confidence:.0%}")
        self.log(f"   Params version: v{lp.version}")
        self.log("")
        
        try:
            tasks = [
                self.binance_websocket('BTC'),
                self.binance_websocket('ETH'),
                self.status_reporter()
            ]
            
            await asyncio.gather(*tasks)
            
        except KeyboardInterrupt:
            self.log("👋 Shutting down...", "INFO")
            self.running = False
        finally:
            self._print_summary()
    
    def _print_summary(self):
        """Print final summary - NOW WITH FULL LEARNING REPORT"""
        self.log("\n" + "="*70)
        self.log("📊 SESSION SUMMARY")
        self.log("="*70)
        self.log(f"   Total trades: {self.daily_stats.total_trades}")
        self.log(f"   Winning trades: {self.daily_stats.winning_trades}")
        if self.daily_stats.total_trades > 0:
            self.log(f"   Win rate: {self.daily_stats.winning_trades/self.daily_stats.total_trades*100:.1f}%")
        self.log(f"   Total P&L: ${self.daily_stats.total_pnl:.2f}")
        self.log("="*70)
        
        # Print full learning report
        self.log("")
        self.log(self.learning.get_performance_report())

# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Start the bot"""
    bot = PolymarketTradingBot()
    await bot.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bot stopped by user")
