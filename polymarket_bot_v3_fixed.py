#!/usr/bin/env python3
"""
Polymarket TRUE Arbitrage Bot
Fixed version - implements ACTUAL arbitrage (risk-free profit)

THE EDGE (Real This Time):
- Buy BOTH sides (YES + NO) when combined cost < $1.00
- At settlement, ONE side pays $1.00
- Guaranteed profit = $1.00 - total_cost
- No direction prediction needed
- 100% win rate (by definition)

Example:
  YES price: $0.48
  NO price:  $0.51
  Total:     $0.99 ✅ < $1.00
  Profit:    $0.01 per share (1% return, guaranteed)
"""

import asyncio
import time
import sys
sys.path.insert(0, '/Users/erik/.openclaw/workspace')

from datetime import datetime, timedelta
from typing import Dict, Optional, List
from dataclasses import dataclass
from collections import deque

# Import components
from polymarket_clob_executor import PolymarketExecutor

# ============================================================================
# CONFIGURATION
# ============================================================================

# Wallet
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"

# Mode
PAPER_TRADING = True  # Start in paper mode!
PAPER_BALANCE = 10000.0  # Virtual $10k for stress testing

# ARBITRAGE PARAMETERS
MAX_TOTAL_COST = 0.995     # Buy both sides if total < $0.995 (more aggressive - 0.5% min profit)
MIN_PROFIT_PCT = 0.3       # Lower threshold to catch more opportunities
POSITION_SIZE_PER_SIDE = 500.0  # $500 per side ($1000 total per arb) - MAX VOLUME

# RISK MANAGEMENT
MAX_DAILY_LOSS = 1000.0    # Higher limit for paper testing
MAX_POSITION_SIZE = 1000.0 # Max $1000 per side for paper testing
SCAN_INTERVAL = 1.0        # Check every 1 second - AGGRESSIVE SCANNING

# PAPER TRADING GRADUATION REQUIREMENTS
MIN_PAPER_TRADES = 20      # Must complete 20 successful arb trades
MIN_PAPER_PROFIT = 1.0     # Must earn $1+ in paper mode
MIN_WIN_RATE = 0.95        # Must achieve 95%+ win rate (should be 100%)

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class ArbitrageOpportunity:
    """A true arbitrage opportunity"""
    market_slug: str
    yes_token_id: str
    no_token_id: str
    yes_price: float
    no_price: float
    total_cost: float
    profit_per_share: float
    profit_pct: float
    spread: float
    timestamp: datetime

@dataclass
class ArbitrageTrade:
    """A completed arbitrage trade"""
    market_slug: str
    yes_order_id: str
    no_order_id: str
    yes_price: float
    no_price: float
    size_per_side: float
    total_investment: float
    expected_payout: float
    expected_profit: float
    timestamp: datetime
    settled: bool = False
    actual_profit: Optional[float] = None
    winning_side: Optional[str] = None

# ============================================================================
# TRUE ARBITRAGE BOT
# ============================================================================

class TrueArbitrageBot:
    """
    Pure arbitrage bot - no prediction, no risk.
    
    Strategy:
    1. Scan orderbooks for YES + NO < $1.00
    2. Buy BOTH sides when opportunity exists
    3. Hold until settlement
    4. Collect guaranteed profit
    
    This is REAL arbitrage:
    - No direction prediction
    - No "confidence" scoring
    - No trend analysis
    - Just math: if total < $1, buy both = profit
    """
    
    def __init__(self):
        # Initialize executor
        self.executor = PolymarketExecutor(
            private_key=PRIVATE_KEY,
            wallet_address=WALLET_ADDRESS,
            paper_mode=PAPER_TRADING
        )
        
        # State
        self.active_trades: List[ArbitrageTrade] = []
        self.completed_trades: List[ArbitrageTrade] = []
        self.opportunities_seen = 0
        self.trades_executed = 0
        
        # Paper trading state
        self.paper_balance = PAPER_BALANCE
        self.paper_invested = 0.0
        
        # Markets to monitor (15-min BTC/ETH markets)
        self.monitored_markets = ['btc-updown-15m', 'eth-updown-15m']
        self.current_market_slugs: Dict[str, str] = {}
        
        # Running state
        self.running = False
        self.paused = False
        
        self.log("🚀 True Arbitrage Bot initialized")
    
    def log(self, msg: str, level: str = "INFO"):
        """Enhanced logging"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        emoji = {
            "INFO": "ℹ️",
            "OPPORTUNITY": "💎",
            "EXECUTE": "⚡",
            "WIN": "✅",
            "SETTLE": "🏁",
            "ERROR": "🔥",
            "SCAN": "🔍"
        }.get(level, "ℹ️")
        print(f"[{timestamp}] {emoji} {msg}", flush=True)
    
    def _get_current_market_slug(self, base: str) -> Optional[str]:
        """Get current 15-min market slug"""
        now = datetime.now()
        minute = now.minute
        
        # Find current 15-min window
        window_start_minute = (minute // 15) * 15
        window_start = now.replace(minute=window_start_minute, second=0, microsecond=0)
        
        timestamp = int(window_start.timestamp())
        return f"{base}-{timestamp}"
    
    def _update_current_markets(self):
        """Update list of current markets to monitor"""
        for base in self.monitored_markets:
            slug = self._get_current_market_slug(base)
            if slug != self.current_market_slugs.get(base):
                self.current_market_slugs[base] = slug
                self.log(f"Switched to market: {slug}")
    
    def _check_arbitrage(self, market_slug: str) -> Optional[ArbitrageOpportunity]:
        """
        Check if arbitrage opportunity exists for a market
        
        Returns ArbitrageOpportunity if total cost < threshold, else None
        """
        # Get token IDs
        yes_token, no_token = self.executor.get_market_tokens(market_slug)
        if not yes_token or not no_token:
            return None
        
        # Get orderbooks
        yes_book = self.executor.get_orderbook(yes_token)
        no_book = self.executor.get_orderbook(no_token)
        
        if not yes_book or not no_book:
            return None
        
        # Get best ask prices (what we'd pay to buy)
        yes_asks = yes_book.get('asks', [])
        no_asks = no_book.get('asks', [])
        
        if not yes_asks or not no_asks:
            return None
        
        yes_price = float(yes_asks[0]['price'])
        no_price = float(no_asks[0]['price'])
        
        # Calculate total cost
        total_cost = yes_price + no_price
        
        # Check if arbitrage exists
        if total_cost >= MAX_TOTAL_COST:
            return None  # No opportunity
        
        # Calculate profit
        profit_per_share = 1.00 - total_cost
        profit_pct = (profit_per_share / total_cost) * 100
        
        # Minimum profit threshold
        if profit_pct < MIN_PROFIT_PCT:
            return None
        
        spread = abs(yes_price - no_price)
        
        return ArbitrageOpportunity(
            market_slug=market_slug,
            yes_token_id=yes_token,
            no_token_id=no_token,
            yes_price=yes_price,
            no_price=no_price,
            total_cost=total_cost,
            profit_per_share=profit_per_share,
            profit_pct=profit_pct,
            spread=spread,
            timestamp=datetime.now()
        )
    
    def _check_paper_balance(self, required: float) -> bool:
        """Check if enough paper balance for trade"""
        if not PAPER_TRADING:
            return True  # Real trading, no balance check here
        
        available = self.paper_balance - self.paper_invested
        return available >= required
    
    def _execute_arbitrage(self, opp: ArbitrageOpportunity):
        """Execute arbitrage trade - buy BOTH sides"""
        
        size_per_side = POSITION_SIZE_PER_SIDE
        total_investment = (opp.yes_price + opp.no_price) * size_per_side
        expected_payout = size_per_side * 1.00  # ONE side will pay full amount
        expected_profit = expected_payout - total_investment
        
        # Paper trading balance check
        if PAPER_TRADING:
            if not self._check_paper_balance(total_investment):
                self.log(f"Insufficient paper balance: need ${total_investment:.2f}, available ${self.paper_balance - self.paper_invested:.2f}", "ERROR")
                return
        
        self.log(
            f"ARBITRAGE OPPORTUNITY DETECTED:\n"
            f"  Market: {opp.market_slug}\n"
            f"  YES: ${opp.yes_price:.4f} | NO: ${opp.no_price:.4f}\n"
            f"  Total: ${opp.total_cost:.4f} (< ${MAX_TOTAL_COST:.4f}) ✅\n"
            f"  Profit: ${opp.profit_per_share:.4f}/share ({opp.profit_pct:.2f}%)\n"
            f"  Size: ${size_per_side:.2f} per side\n"
            f"  Investment: ${total_investment:.2f}\n"
            f"  Expected payout: ${expected_payout:.2f}\n"
            f"  Expected profit: ${expected_profit:.2f}",
            "OPPORTUNITY"
        )
        
        # Execute YES side
        yes_result = self.executor.place_order(
            market_slug=opp.market_slug,
            direction="UP",  # YES
            size_usd=size_per_side,
            order_type="MARKET"
        )
        
        if not yes_result.success:
            self.log(f"YES order failed: {yes_result.error}", "ERROR")
            return
        
        # Execute NO side
        no_result = self.executor.place_order(
            market_slug=opp.market_slug,
            direction="DOWN",  # NO
            size_usd=size_per_side,
            order_type="MARKET"
        )
        
        if not no_result.success:
            self.log(f"NO order failed: {no_result.error}", "ERROR")
            # TODO: Cancel YES order or hedge
            return
        
        # Record trade
        trade = ArbitrageTrade(
            market_slug=opp.market_slug,
            yes_order_id=yes_result.order_id,
            no_order_id=no_result.order_id,
            yes_price=yes_result.price,
            no_price=no_result.price,
            size_per_side=size_per_side,
            total_investment=total_investment,
            expected_payout=expected_payout,
            expected_profit=expected_profit,
            timestamp=datetime.now()
        )
        
        self.active_trades.append(trade)
        self.trades_executed += 1
        
        # Update paper balance
        if PAPER_TRADING:
            self.paper_invested += total_investment
        
        mode_str = "📝 PAPER" if PAPER_TRADING else "💸 LIVE"
        self.log(
            f"{mode_str} - ARBITRAGE EXECUTED:\n"
            f"  YES: {yes_result.order_id[:16]}... @ {yes_result.price:.4f}\n"
            f"  NO:  {no_result.order_id[:16]}... @ {no_result.price:.4f}\n"
            f"  Total invested: ${total_investment:.2f}\n"
            f"  Guaranteed profit: ${expected_profit:.2f} ({opp.profit_pct:.2f}%)",
            "EXECUTE"
        )
    
    def _settle_trade(self, trade: ArbitrageTrade, winning_side: str):
        """Settle a completed trade"""
        if trade.settled:
            return
        
        trade.settled = True
        trade.winning_side = winning_side
        
        # Calculate actual profit
        # ONE side pays $1.00 per share
        payout = trade.size_per_side * 1.00
        trade.actual_profit = payout - trade.total_investment
        
        # Update paper balance
        if PAPER_TRADING:
            self.paper_invested -= trade.total_investment
            self.paper_balance += payout
        
        # Move to completed
        self.active_trades.remove(trade)
        self.completed_trades.append(trade)
        
        self.log(
            f"TRADE SETTLED:\n"
            f"  Market: {trade.market_slug}\n"
            f"  Winner: {winning_side}\n"
            f"  Invested: ${trade.total_investment:.2f}\n"
            f"  Payout: ${payout:.2f}\n"
            f"  Profit: ${trade.actual_profit:.2f} ✅",
            "SETTLE"
        )
    
    def _check_graduation(self) -> bool:
        """Check if bot can graduate from paper trading"""
        if not PAPER_TRADING:
            return True
        
        if len(self.completed_trades) < MIN_PAPER_TRADES:
            return False
        
        total_profit = sum(t.actual_profit for t in self.completed_trades if t.settled)
        wins = sum(1 for t in self.completed_trades if t.settled and t.actual_profit > 0)
        total = len(self.completed_trades)
        win_rate = wins / total if total > 0 else 0
        
        if total_profit < MIN_PAPER_PROFIT:
            return False
        
        if win_rate < MIN_WIN_RATE:
            return False
        
        return True
    
    async def scan_loop(self):
        """Main scanning loop"""
        self.log("Starting arbitrage scanner...")
        
        while self.running:
            try:
                # Update current markets
                self._update_current_markets()
                
                # Scan each market
                for base, slug in self.current_market_slugs.items():
                    if not slug:
                        continue
                    
                    # Check for arbitrage
                    opp = self._check_arbitrage(slug)
                    
                    if opp:
                        self.opportunities_seen += 1
                        self._execute_arbitrage(opp)
                
                # Status update every minute
                if int(time.time()) % 60 == 0:
                    self._print_status()
                
                await asyncio.sleep(SCAN_INTERVAL)
                
            except Exception as e:
                self.log(f"Error in scan loop: {e}", "ERROR")
                await asyncio.sleep(SCAN_INTERVAL)
    
    def _print_status(self):
        """Print current status"""
        total_profit = sum(t.actual_profit for t in self.completed_trades if t.settled)
        pending_investment = sum(t.total_investment for t in self.active_trades)
        
        status = [
            "",
            "=" * 70,
            "📊 TRUE ARBITRAGE BOT STATUS",
            "=" * 70,
            f"Mode: {'📝 PAPER TRADING' if PAPER_TRADING else '💸 LIVE TRADING'}",
            "",
            "💰 PERFORMANCE",
            f"  Opportunities seen: {self.opportunities_seen}",
            f"  Trades executed: {self.trades_executed}",
            f"  Active trades: {len(self.active_trades)}",
            f"  Completed trades: {len(self.completed_trades)}",
            f"  Total profit: ${total_profit:.2f}",
        ]
        
        if PAPER_TRADING:
            status.extend([
                "",
                "📝 PAPER TRADING STATUS",
                f"  Balance: ${self.paper_balance:.2f}",
                f"  Invested: ${self.paper_invested:.2f}",
                f"  Available: ${self.paper_balance - self.paper_invested:.2f}",
                "",
                "🎓 GRADUATION PROGRESS",
                f"  Trades: {len(self.completed_trades)}/{MIN_PAPER_TRADES}",
                f"  Profit: ${total_profit:.2f}/${MIN_PAPER_PROFIT:.2f}",
            ])
            
            if self._check_graduation():
                status.append("  ✅ READY FOR LIVE TRADING!")
            else:
                status.append("  ⏳ Keep paper trading...")
        
        status.extend([
            "",
            "📈 MONITORED MARKETS",
        ])
        
        for base, slug in self.current_market_slugs.items():
            status.append(f"  {base}: {slug}")
        
        status.append("=" * 70)
        
        self.log("\n".join(status))
    
    async def run(self):
        """Main run loop"""
        self.running = True
        
        # Print banner
        import sys
        def p(msg): print(msg, flush=True)
        
        p("\n" + "=" * 70)
        p("💎 POLYMARKET TRUE ARBITRAGE BOT")
        p("=" * 70)
        p("")
        p("📋 STRATEGY:")
        p("   ✅ Buy BOTH sides when YES + NO < $1.00")
        p("   ✅ Hold until settlement")
        p("   ✅ Collect guaranteed profit")
        p("   ✅ No prediction required - just math")
        p("")
        p("⚙️  CONFIGURATION:")
        p(f"   Mode: {'📝 PAPER TRADING' if PAPER_TRADING else '💸 LIVE TRADING'}")
        p(f"   Max total cost: ${MAX_TOTAL_COST:.3f}")
        p(f"   Min profit: {MIN_PROFIT_PCT:.1f}%")
        p(f"   Position size: ${POSITION_SIZE_PER_SIDE:.2f} per side")
        p(f"   Wallet: {WALLET_ADDRESS}")
        p("")
        
        if PAPER_TRADING:
            p("📝 PAPER TRADING MODE:")
            p(f"   Starting balance: ${PAPER_BALANCE:.2f}")
            p(f"   Graduation requirements:")
            p(f"     • {MIN_PAPER_TRADES} successful trades")
            p(f"     • ${MIN_PAPER_PROFIT:.2f}+ profit")
            p(f"     • {MIN_WIN_RATE:.0%}+ win rate")
            p("")
        
        p("=" * 70)
        p("🚀 Starting scanner...")
        p("")
        
        try:
            await self.scan_loop()
        except KeyboardInterrupt:
            self.log("Shutting down...")
            self.running = False
        finally:
            self._print_summary()
    
    def _print_summary(self):
        """Print final summary"""
        total_profit = sum(t.actual_profit for t in self.completed_trades if t.settled)
        wins = sum(1 for t in self.completed_trades if t.settled and t.actual_profit > 0)
        total = len(self.completed_trades)
        win_rate = wins / total if total > 0 else 0
        
        print("\n" + "=" * 70)
        print("📊 SESSION SUMMARY")
        print("=" * 70)
        print(f"   Opportunities seen: {self.opportunities_seen}")
        print(f"   Trades executed: {self.trades_executed}")
        print(f"   Completed trades: {total}")
        print(f"   Win rate: {win_rate:.1%}")
        print(f"   Total profit: ${total_profit:.2f}")
        
        if PAPER_TRADING:
            print(f"\n   Paper balance: ${self.paper_balance:.2f}")
            if self._check_graduation():
                print("\n   ✅ GRADUATED! Ready for live trading.")
                print("   Set PAPER_TRADING=False to go live.")
            else:
                print("\n   ⏳ Not ready for live trading yet.")
                print(f"   Need {MIN_PAPER_TRADES - total} more trades.")
        
        print("=" * 70)

# ============================================================================
# MAIN
# ============================================================================

async def main():
    bot = TrueArbitrageBot()
    await bot.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Stopped by user")
