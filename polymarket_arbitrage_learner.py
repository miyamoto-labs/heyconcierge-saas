#!/usr/bin/env python3
"""
Polymarket Arbitrage Learner Bot
Combines Chainlink lag arbitrage strategy with adaptive learning.

THE EDGE:
- Polymarket 15-min BTC/ETH markets settle based on Chainlink oracle prices
- Chainlink oracle LAGS behind Binance spot prices by seconds/minutes
- When Binance shows a significant move (0.3%+) in first 5 minutes of window
- Execute trade on Polymarket BEFORE the odds fully adjust
- Market settles based on Chainlink → we profit from the lag

This is NOT momentum trading (gambling).
This IS information arbitrage (exploiting the oracle lag).
"""

import asyncio
import websockets
import json
import time
import sys
sys.path.insert(0, '/Users/erik/.openclaw/workspace')

from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass, asdict
from collections import deque

# Import our components
from polymarket_clob_executor import PolymarketExecutor
from polymarket_learning import LearningEngine

# ============================================================================
# CONFIGURATION
# ============================================================================

# Wallet
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"

# Mode
PAPER_TRADING = False  # 🔥 LIVE TRADING - LET'S MAKE MONEY
POSITION_SIZE = 3.0    # $3 per trade (low funds)

# ARBITRAGE STRATEGY PARAMETERS - HYPERACTIVE MODE
# The edge is exploiting the LAG - not momentum
MIN_PRICE_MOVE = 0.001       # 0.1% minimum move (hyperactive)
MAX_TRADE_WINDOW = 600       # Trade in first 10 minutes (extended arbitrage window)
MIN_BASE_CONFIDENCE = 0.35   # Lower threshold = more trades

# Risk Management
MAX_CONSECUTIVE_LOSSES = 4   # Pause after 4 losses in a row
MAX_DAILY_LOSS = 20.0        # Stop trading if lose $20 in a day
TRADE_COOLDOWN = 45          # 45 sec between trades (faster)

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class ArbitrageWindow:
    """Represents a 15-minute market window for arbitrage"""
    asset: str  # BTC or ETH
    start_time: datetime
    end_time: datetime
    start_price: float
    current_price: Optional[float] = None
    market_slug: Optional[str] = None
    token_yes_id: Optional[str] = None
    token_no_id: Optional[str] = None
    traded: bool = False
    trade_direction: Optional[str] = None
    last_trade_time: Optional[datetime] = None
    
    @property
    def seconds_elapsed(self) -> int:
        return int((datetime.now() - self.start_time).total_seconds())
    
    @property
    def time_remaining(self) -> int:
        return max(0, 900 - self.seconds_elapsed)  # 900 = 15 minutes
    
    @property
    def in_arbitrage_window(self) -> bool:
        """True if we're in the first 5 minutes (where the lag is exploitable)"""
        return self.seconds_elapsed < MAX_TRADE_WINDOW
    
    @property
    def can_trade(self) -> bool:
        """Can we trade right now?"""
        if not self.in_arbitrage_window:
            return False  # Past the arbitrage window
        if self.traded and self.trade_direction:
            # Already traded this direction - check cooldown for reversal
            if self.last_trade_time:
                seconds_since_trade = (datetime.now() - self.last_trade_time).total_seconds()
                return seconds_since_trade >= TRADE_COOLDOWN
        return True
    
    @property
    def price_change_pct(self) -> float:
        """Current price change from window start"""
        if not self.start_price or not self.current_price:
            return 0.0
        return (self.current_price - self.start_price) / self.start_price

@dataclass
class ArbitrageSignal:
    """An arbitrage opportunity signal"""
    asset: str
    direction: str  # UP or DOWN
    base_confidence: float  # Raw confidence from arbitrage signal
    adjusted_confidence: float  # After learning adjustments
    price_change_pct: float
    seconds_in_window: int
    window_start_price: float
    current_price: float
    reason: str

@dataclass
class DailyStats:
    """Track daily performance"""
    date: str
    total_trades: int = 0
    wins: int = 0
    losses: int = 0
    pending: int = 0
    total_pnl: float = 0.0
    consecutive_losses: int = 0

# ============================================================================
# CHAINLINK LAG ARBITRAGE BOT WITH LEARNING
# ============================================================================

class ArbitrageLearnerBot:
    """
    The key insight:
    - Binance moves first (real-time market)
    - Chainlink oracle updates with a lag (seconds to minutes)
    - Polymarket 15-min markets settle based on Chainlink
    - If we see Binance move 0.5%, Polymarket odds haven't caught up yet
    - We bet on the direction BEFORE the market prices it in
    
    This is TRUE arbitrage - not speculation on where price will go.
    We already KNOW where price went (on Binance). We're betting
    that Polymarket will settle in that direction because the oracle
    will eventually update.
    """
    
    def __init__(self):
        # Price tracking
        self.prices = {'BTC': deque(maxlen=1000), 'ETH': deque(maxlen=1000)}
        self.current_windows: Dict[str, ArbitrageWindow] = {}
        self.completed_windows: List[ArbitrageWindow] = []
        
        # Initialize executor
        self.executor = PolymarketExecutor(
            private_key=PRIVATE_KEY,
            wallet_address=WALLET_ADDRESS,
            paper_mode=PAPER_TRADING
        )
        
        # Initialize learning engine
        self.learning = LearningEngine()
        
        # State tracking
        self.pending_trades: Dict[str, dict] = {}  # market_slug -> trade info
        self.daily_stats = self._init_daily_stats()
        self.running = False
        self.paused = False
        
        # Binance WebSocket URLs
        self.ws_urls = {
            'BTC': 'wss://stream.binance.com:9443/ws/btcusdt@trade',
            'ETH': 'wss://stream.binance.com:9443/ws/ethusdt@trade'
        }
    
    def _init_daily_stats(self) -> DailyStats:
        """Initialize daily stats"""
        today = datetime.now().strftime("%Y-%m-%d")
        return DailyStats(date=today)
    
    def log(self, msg: str, level: str = "INFO"):
        """Enhanced logging"""
        import sys
        timestamp = datetime.now().strftime("%H:%M:%S")
        emoji = {
            "INFO": "📊",
            "SIGNAL": "🎯",
            "EXECUTE": "⚡",
            "ARBITRAGE": "💎",
            "WIN": "✅",
            "LOSS": "❌",
            "PAUSE": "🛑",
            "ERROR": "🔥",
            "LEARN": "🧠",
            "ADAPT": "🔧",
            "WINDOW": "⏰"
        }.get(level, "ℹ️")
        print(f"[{timestamp}] {emoji} {msg}", flush=True)
    
    def _check_safety_limits(self) -> bool:
        """Check if we should continue trading"""
        # Daily loss limit
        if self.daily_stats.total_pnl <= -MAX_DAILY_LOSS:
            if not self.paused:
                self.paused = True
                self.log(f"Daily loss limit hit: ${abs(self.daily_stats.total_pnl):.2f}", "PAUSE")
            return False
        
        # Consecutive losses
        if self.daily_stats.consecutive_losses >= MAX_CONSECUTIVE_LOSSES:
            if not self.paused:
                self.paused = True
                self.log(f"{MAX_CONSECUTIVE_LOSSES} consecutive losses - pausing", "PAUSE")
            return False
        
        return True
    
    def _reset_pause_if_needed(self):
        """Reset pause after a win"""
        if self.paused and self.daily_stats.consecutive_losses < MAX_CONSECUTIVE_LOSSES:
            self.paused = False
            self.log("Resuming trading after win", "INFO")
    
    # =========================================================================
    # PRICE & WINDOW MANAGEMENT
    # =========================================================================
    
    def _get_window_key(self, asset: str, window_start: datetime) -> str:
        """Generate unique key for a window"""
        return f"{asset}_{int(window_start.timestamp())}"
    
    def _create_new_window(self, asset: str, price: float) -> ArbitrageWindow:
        """Create a new 15-minute arbitrage window"""
        now = datetime.now()
        minute = now.minute
        
        # Find current 15-min window boundaries
        window_start_minute = (minute // 15) * 15
        window_start = now.replace(minute=window_start_minute, second=0, microsecond=0)
        window_end = window_start + timedelta(minutes=15)
        
        # Market slug format
        timestamp = int(window_start.timestamp())
        market_slug = f"{asset.lower()}-updown-15m-{timestamp}"
        
        # Fetch token IDs
        yes_token, no_token = self.executor.get_market_tokens(market_slug)
        
        window = ArbitrageWindow(
            asset=asset,
            start_time=window_start,
            end_time=window_end,
            start_price=price,
            current_price=price,
            market_slug=market_slug,
            token_yes_id=yes_token,
            token_no_id=no_token
        )
        
        return window
    
    def _resolve_window(self, window: ArbitrageWindow, end_price: float):
        """Resolve all trades when a window ends"""
        if not window.market_slug or window.market_slug not in self.pending_trades:
            return
        
        pending = self.pending_trades.pop(window.market_slug)
        
        # Resolve in learning engine
        self.learning.resolve_by_market_slug(
            market_slug=window.market_slug,
            window_end_price=end_price,
            window_start_price=window.start_price
        )
        
        # Determine actual outcome
        actual_direction = "UP" if end_price > window.start_price else "DOWN"
        is_win = pending['direction'] == actual_direction
        
        # Update stats
        if is_win:
            pnl = 4.50  # Conservative win estimate
            self.daily_stats.wins += 1
            self.daily_stats.consecutive_losses = 0
            self._reset_pause_if_needed()
            self.log(
                f"WIN: {window.asset} {pending['direction']} | "
                f"Start: ${window.start_price:,.2f} → End: ${end_price:,.2f} | "
                f"+${pnl:.2f}",
                "WIN"
            )
        else:
            pnl = -POSITION_SIZE
            self.daily_stats.losses += 1
            self.daily_stats.consecutive_losses += 1
            self.log(
                f"LOSS: {window.asset} {pending['direction']} | "
                f"Start: ${window.start_price:,.2f} → End: ${end_price:,.2f} | "
                f"-${POSITION_SIZE:.2f}",
                "LOSS"
            )
        
        self.daily_stats.pending -= 1
        self.daily_stats.total_pnl += pnl
        
        # Move to completed
        self.completed_windows.append(window)
    
    def update_price(self, asset: str, price: float):
        """Update price and check for arbitrage opportunities"""
        # Store price
        self.prices[asset].append({
            'timestamp': datetime.now(),
            'price': price
        })
        
        # Get current window
        window = self.current_windows.get(asset)
        
        # Check if we need a new window
        if not window or datetime.now() >= window.end_time:
            # Resolve ending window
            if window:
                self._resolve_window(window, price)
            
            # Create new window
            window = self._create_new_window(asset, price)
            self.current_windows[asset] = window
            self.log(
                f"{asset} - New window started at ${price:,.2f} | "
                f"Market: {window.market_slug or 'NOT FOUND'}",
                "WINDOW"
            )
        
        # Update current price
        window.current_price = price
        
        # Check for arbitrage opportunity
        if window.can_trade and self._check_safety_limits():
            signal = self._detect_arbitrage(window)
            if signal:
                self._execute_arbitrage(signal, window)
    
    # =========================================================================
    # ARBITRAGE DETECTION
    # =========================================================================
    
    def _detect_arbitrage(self, window: ArbitrageWindow) -> Optional[ArbitrageSignal]:
        """
        Detect if there's an arbitrage opportunity.
        
        Key insight: We're not predicting where price WILL go.
        We're observing where price HAS gone (on Binance) and betting
        that Polymarket's Chainlink-based settlement will follow.
        """
        if not window.start_price or not window.current_price:
            return None
        
        price_change = window.price_change_pct
        
        # Need significant move to have an edge
        if abs(price_change) < MIN_PRICE_MOVE:
            return None
        
        # Determine direction based on price movement
        direction = "UP" if price_change > 0 else "DOWN"
        
        # Skip if we already traded this direction
        if window.traded and window.trade_direction == direction:
            return None
        
        # =====================================================================
        # CALCULATE BASE CONFIDENCE (the arbitrage edge)
        # =====================================================================
        
        # 1. Magnitude of move (bigger move = stronger signal)
        #    Scale: 0.3% = 50%, 0.5% = 75%, 1%+ = 100%
        magnitude_score = min(abs(price_change) / 0.006, 1.0)  # Full score at 0.6%
        
        # 2. Timing within window (earlier = better for arbitrage)
        #    In the first 5 minutes, the market hasn't fully priced in the move
        #    Early (0-2 min) = higher edge, Late (4-5 min) = lower edge
        time_ratio = window.seconds_elapsed / MAX_TRADE_WINDOW
        timing_score = 1.0 - (time_ratio * 0.5)  # 100% at 0s, 50% at 5min
        
        # 3. Momentum check (is the move continuing or reversing?)
        #    Recent 30 seconds vs previous 30 seconds
        momentum_score = self._calculate_momentum(window.asset, direction)
        
        # Combine scores (weighted)
        base_confidence = (
            magnitude_score * 0.50 +    # 50% weight on move size
            timing_score * 0.30 +       # 30% weight on timing
            momentum_score * 0.20       # 20% weight on momentum
        )
        
        # =====================================================================
        # APPLY LEARNING ADJUSTMENTS
        # =====================================================================
        
        adjusted_confidence, adjustments = self.learning.get_adjusted_confidence(
            asset=window.asset,
            direction=direction,
            base_confidence=base_confidence,
            time_in_window=window.seconds_elapsed
        )
        
        # Check if learning says we should skip
        should_skip, skip_reason = self.learning.should_skip_trade(
            asset=window.asset,
            direction=direction,
            adjusted_confidence=adjusted_confidence
        )
        
        if should_skip:
            return None
        
        # Final threshold check
        effective_min = max(MIN_BASE_CONFIDENCE, self.learning.learned_params.min_confidence)
        if adjusted_confidence < effective_min:
            return None
        
        # Build reason string
        reason = (
            f"Binance {direction} {abs(price_change)*100:.2f}% in {window.seconds_elapsed}s | "
            f"Chainlink lag arbitrage"
        )
        
        return ArbitrageSignal(
            asset=window.asset,
            direction=direction,
            base_confidence=base_confidence,
            adjusted_confidence=adjusted_confidence,
            price_change_pct=price_change,
            seconds_in_window=window.seconds_elapsed,
            window_start_price=window.start_price,
            current_price=window.current_price,
            reason=reason
        )
    
    def _calculate_momentum(self, asset: str, direction: str) -> float:
        """Calculate momentum score (is move continuing or reversing?)"""
        prices = list(self.prices[asset])
        if len(prices) < 20:
            return 0.5  # Neutral
        
        # Last 30 seconds vs previous 30 seconds
        now = datetime.now()
        recent = [p['price'] for p in prices if (now - p['timestamp']).total_seconds() < 30]
        earlier = [p['price'] for p in prices if 30 <= (now - p['timestamp']).total_seconds() < 60]
        
        if not recent or not earlier:
            return 0.5
        
        recent_avg = sum(recent) / len(recent)
        earlier_avg = sum(earlier) / len(earlier)
        
        # Check if momentum matches direction
        if direction == "UP" and recent_avg > earlier_avg:
            return 0.8  # Strong momentum confirmation
        elif direction == "DOWN" and recent_avg < earlier_avg:
            return 0.8
        elif direction == "UP" and recent_avg < earlier_avg:
            return 0.3  # Momentum reversing
        elif direction == "DOWN" and recent_avg > earlier_avg:
            return 0.3
        
        return 0.5  # Neutral
    
    # =========================================================================
    # TRADE EXECUTION
    # =========================================================================
    
    def _execute_arbitrage(self, signal: ArbitrageSignal, window: ArbitrageWindow):
        """Execute an arbitrage trade"""
        
        # Update window state
        window.traded = True
        window.trade_direction = signal.direction
        window.last_trade_time = datetime.now()
        
        # Log the arbitrage opportunity
        self.log(
            f"{signal.asset} - ARBITRAGE DETECTED: {signal.direction} | "
            f"Price Δ: {signal.price_change_pct*100:+.2f}% | "
            f"Base conf: {signal.base_confidence:.0%} → Adj: {signal.adjusted_confidence:.0%} | "
            f"Window: {signal.seconds_in_window}s/{MAX_TRADE_WINDOW}s",
            "ARBITRAGE"
        )
        
        # Execute via CLOB
        result = self.executor.place_order(
            market_slug=window.market_slug,
            direction=signal.direction,
            size_usd=POSITION_SIZE,
            order_type="MARKET"
        )
        
        if not result.success:
            self.log(f"Execution failed: {result.error}", "ERROR")
            window.traded = False  # Allow retry
            return
        
        # Record in learning engine
        trade_id = self.learning.record_trade(
            asset=signal.asset,
            direction=signal.direction,
            confidence=signal.adjusted_confidence,
            price_at_entry=signal.current_price,
            price_change_at_entry=signal.price_change_pct,
            time_in_window=signal.seconds_in_window,
            window_start_price=signal.window_start_price,
            order_id=result.order_id,
            market_slug=window.market_slug
        )
        
        # Track for resolution
        self.pending_trades[window.market_slug] = {
            'trade_id': trade_id,
            'direction': signal.direction,
            'window_start_price': window.start_price,
            'entry_price': result.price,
            'size': result.size,
            'order_id': result.order_id
        }
        
        # Update stats
        self.daily_stats.total_trades += 1
        self.daily_stats.pending += 1
        
        # Log execution
        mode_str = "📝 PAPER" if PAPER_TRADING else "💸 LIVE"
        self.log(
            f"{mode_str} - Executed: {signal.direction} {signal.asset} | "
            f"${POSITION_SIZE:.2f} @ {result.price:.4f} ({result.size:.2f} shares) | "
            f"Order: {result.order_id}",
            "EXECUTE"
        )
    
    # =========================================================================
    # WEBSOCKET & MAIN LOOP
    # =========================================================================
    
    async def binance_websocket(self, asset: str):
        """Monitor Binance WebSocket for real-time prices"""
        url = self.ws_urls[asset]
        
        while self.running:
            try:
                async with websockets.connect(url) as ws:
                    self.log(f"Connected to Binance {asset} WebSocket", "INFO")
                    
                    while self.running:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        price = float(data['p'])
                        self.update_price(asset, price)
                        
            except Exception as e:
                self.log(f"WebSocket error for {asset}: {e}", "ERROR")
                await asyncio.sleep(5)
    
    async def status_reporter(self):
        """Report status periodically"""
        while self.running:
            await asyncio.sleep(120)  # Every 2 minutes
            
            # Get learning stats
            lp = self.learning.learned_params
            overall = self.learning._get_overall_stats()
            
            # Current windows info
            btc_window = self.current_windows.get('BTC')
            eth_window = self.current_windows.get('ETH')
            
            status = [
                "",
                "=" * 60,
                "📊 ARBITRAGE LEARNER STATUS",
                "=" * 60,
                f"Mode: {'📝 PAPER' if PAPER_TRADING else '💸 LIVE'} | State: {'🛑 PAUSED' if self.paused else '✅ ACTIVE'}",
                "",
                "💰 TODAY",
                f"   Trades: {self.daily_stats.total_trades} | Pending: {self.daily_stats.pending}",
                f"   W/L: {self.daily_stats.wins}/{self.daily_stats.losses}",
                f"   P&L: ${self.daily_stats.total_pnl:.2f}",
                f"   Consecutive losses: {self.daily_stats.consecutive_losses}",
                "",
                "🧠 LEARNING ENGINE",
                f"   Historical: {overall['total']} trades | {overall['win_rate']:.0%} WR",
                f"   Total P&L: ${overall['total_pnl']:.2f}",
                f"   Min confidence: {lp.min_confidence:.0%}",
            ]
            
            if btc_window:
                status.append("")
                status.append("📈 CURRENT WINDOWS")
                status.append(
                    f"   BTC: ${btc_window.current_price:,.2f} | "
                    f"Δ: {btc_window.price_change_pct*100:+.2f}% | "
                    f"Elapsed: {btc_window.seconds_elapsed}s | "
                    f"{'✅ Traded' if btc_window.traded else '⏳ Watching'}"
                )
            
            if eth_window:
                status.append(
                    f"   ETH: ${eth_window.current_price:,.2f} | "
                    f"Δ: {eth_window.price_change_pct*100:+.2f}% | "
                    f"Elapsed: {eth_window.seconds_elapsed}s | "
                    f"{'✅ Traded' if eth_window.traded else '⏳ Watching'}"
                )
            
            status.append("=" * 60)
            self.log("\n".join(status))
    
    async def run(self):
        """Main run loop"""
        self.running = True
        
        # Get learning stats
        lp = self.learning.learned_params
        overall = self.learning._get_overall_stats()
        
        import sys
        def p(msg): print(msg, flush=True)
        
        p("\n" + "=" * 70)
        p("💎 POLYMARKET ARBITRAGE LEARNER BOT")
        p("=" * 70)
        p("")
        p("📋 STRATEGY:")
        p("   • Monitor Binance for real-time BTC/ETH prices")
        p("   • Detect significant moves (0.3%+) in first 5 min of window")
        p("   • Execute on Polymarket BEFORE odds adjust (Chainlink lag)")
        p("   • Market settles based on Chainlink → profit from the lag")
        p("")
        p("⚙️  CONFIGURATION:")
        p(f"   Mode: {'📝 PAPER TRADING' if PAPER_TRADING else '💸 LIVE TRADING'}")
        p(f"   Position size: ${POSITION_SIZE:.2f}")
        p(f"   Min price move: {MIN_PRICE_MOVE*100:.1f}%")
        p(f"   Trade window: First {MAX_TRADE_WINDOW}s of 15-min markets")
        p(f"   Wallet: {WALLET_ADDRESS}")
        p("")
        p("🧠 LEARNING ENGINE:")
        p(f"   Historical trades: {overall['total']}")
        if overall['total'] > 0:
            p(f"   Historical win rate: {overall['win_rate']:.1%}")
            p(f"   Historical P&L: ${overall['total_pnl']:.2f}")
        p(f"   Learned min confidence: {lp.min_confidence:.0%}")
        p(f"   Params version: v{lp.version}")
        p("")
        p("=" * 70)
        p("🚀 Starting...")
        p("")
        
        try:
            tasks = [
                self.binance_websocket('BTC'),
                self.binance_websocket('ETH'),
                self.status_reporter()
            ]
            await asyncio.gather(*tasks)
            
        except KeyboardInterrupt:
            self.log("Shutting down...", "INFO")
            self.running = False
        finally:
            self._print_summary()
    
    def _print_summary(self):
        """Print final summary"""
        print("\n" + "=" * 70)
        print("📊 SESSION SUMMARY")
        print("=" * 70)
        print(f"   Total trades: {self.daily_stats.total_trades}")
        print(f"   Wins: {self.daily_stats.wins}")
        print(f"   Losses: {self.daily_stats.losses}")
        print(f"   Pending: {self.daily_stats.pending}")
        if self.daily_stats.wins + self.daily_stats.losses > 0:
            wr = self.daily_stats.wins / (self.daily_stats.wins + self.daily_stats.losses)
            print(f"   Win rate: {wr:.1%}")
        print(f"   Total P&L: ${self.daily_stats.total_pnl:.2f}")
        print("=" * 70)
        
        # Print learning report
        print()
        print(self.learning.get_performance_report())

# ============================================================================
# MAIN
# ============================================================================

async def main():
    bot = ArbitrageLearnerBot()
    await bot.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Stopped by user")
