#!/usr/bin/env python3
"""
🧠 HYPERLIQUID ADAPTIVE LEARNING LAYER
Learns from trade history to optimize parameters over time.

Features:
1. Trade Outcome Tracking - Full context logging for every trade
2. Performance Analytics - Win rate by asset, direction, time, strategy
3. Adaptive Parameter Tuning - Auto-adjusts based on what's working
4. Reinforcement Signals - Gradual position sizing adjustments

Integrates with hyperliquid_scalping_bot.py without breaking existing functionality.
"""

import json
import os
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import math

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class TradeRecord:
    """Complete record of a single trade with full context"""
    # Core trade info
    trade_id: str
    timestamp: str
    asset: str
    direction: str  # "LONG" or "SHORT"
    strategy: str   # "MOMENTUM", "RANGE", etc.
    
    # Prices
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: float = 0.0
    take_profit: float = 0.0
    
    # Position
    size_usd: float = 0.0
    size_coins: float = 0.0
    leverage: int = 10
    
    # Context at entry
    funding_rate: float = 0.0
    rsi_at_entry: Optional[float] = None
    volume_ratio: Optional[float] = None
    confidence: float = 0.0
    reasons: List[str] = field(default_factory=list)
    
    # Timing
    entry_time: str = ""
    exit_time: Optional[str] = None
    hold_duration_seconds: Optional[int] = None
    hour_of_day: int = 0
    day_of_week: int = 0
    
    # Result
    result: Optional[str] = None  # "WIN", "LOSS", None if open
    pnl_usd: float = 0.0
    pnl_percent: float = 0.0
    fees_paid: float = 0.0
    funding_received: float = 0.0
    net_pnl: float = 0.0
    
    # Exit reason
    exit_reason: Optional[str] = None  # "stop_loss", "take_profit", "manual", "trailing"
    
    # Learned params at time of trade
    learned_params_version: int = 0


@dataclass
class LearnedParameters:
    """Parameters that adapt based on trade performance"""
    version: int = 1
    last_updated: str = ""
    trades_analyzed: int = 0
    
    # Position sizing multipliers by asset
    asset_multipliers: Dict[str, float] = field(default_factory=lambda: {"BTC": 1.0, "ETH": 1.0})
    
    # Strategy confidence adjustments
    strategy_adjustments: Dict[str, float] = field(default_factory=lambda: {
        "MOMENTUM": 0.0,
        "RANGE": 0.0,
        "BREAKOUT": 0.0,
        "ORDERBOOK": 0.0,
        "VOLUME_SPIKE": 0.0
    })
    
    # Direction bias adjustments
    direction_multipliers: Dict[str, float] = field(default_factory=lambda: {
        "LONG": 1.0,
        "SHORT": 1.0
    })
    
    # Time-based adjustments (by hour 0-23)
    hour_multipliers: Dict[int, float] = field(default_factory=lambda: {h: 1.0 for h in range(24)})
    
    # Stop loss and take profit adjustments by strategy
    stop_loss_adjustments: Dict[str, float] = field(default_factory=lambda: {
        "MOMENTUM": 0.0,
        "RANGE": 0.0,
        "BREAKOUT": 0.0,
        "ORDERBOOK": 0.0,
        "VOLUME_SPIKE": 0.0
    })
    
    take_profit_adjustments: Dict[str, float] = field(default_factory=lambda: {
        "MOMENTUM": 0.0,
        "RANGE": 0.0,
        "BREAKOUT": 0.0,
        "ORDERBOOK": 0.0,
        "VOLUME_SPIKE": 0.0
    })
    
    # Funding rate thresholds
    min_funding_rate_long: float = -0.001   # Prefer long when funding is negative
    min_funding_rate_short: float = 0.001   # Prefer short when funding is positive
    
    # Overall position size multiplier (based on recent performance)
    overall_size_multiplier: float = 1.0
    
    # Confidence threshold adjustments
    min_confidence_adjustment: float = 0.0


@dataclass
class PerformanceStats:
    """Aggregated performance statistics"""
    period: str  # "24h", "7d", "30d", "all"
    
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    
    total_pnl: float = 0.0
    trading_pnl: float = 0.0
    funding_income: float = 0.0
    fees_paid: float = 0.0
    
    avg_win: float = 0.0
    avg_loss: float = 0.0
    profit_factor: float = 0.0
    expectancy: float = 0.0
    
    best_trade: float = 0.0
    worst_trade: float = 0.0
    avg_hold_time_seconds: float = 0.0
    
    # Breakdowns
    by_asset: Dict[str, Dict] = field(default_factory=dict)
    by_strategy: Dict[str, Dict] = field(default_factory=dict)
    by_direction: Dict[str, Dict] = field(default_factory=dict)
    by_hour: Dict[int, Dict] = field(default_factory=dict)
    by_day: Dict[int, Dict] = field(default_factory=dict)


# ============================================================================
# TRADE OUTCOME TRACKER
# ============================================================================

class TradeOutcomeTracker:
    """Logs every trade with full context for learning"""
    
    def __init__(self, history_file: str = "hyperliquid_trade_history.json"):
        self.history_file = history_file
        self.trades: List[TradeRecord] = []
        self.open_trades: Dict[str, TradeRecord] = {}  # trade_id -> TradeRecord
        self._load_history()
    
    def _load_history(self):
        """Load trade history from file"""
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, 'r') as f:
                    data = json.load(f)
                    self.trades = [TradeRecord(**t) for t in data.get("trades", [])]
                    self.open_trades = {
                        k: TradeRecord(**v) 
                        for k, v in data.get("open_trades", {}).items()
                    }
                print(f"📚 Loaded {len(self.trades)} historical trades, {len(self.open_trades)} open")
            except Exception as e:
                print(f"⚠️ Error loading trade history: {e}")
                self.trades = []
                self.open_trades = {}
        else:
            self.trades = []
            self.open_trades = {}
    
    def _save_history(self):
        """Save trade history to file"""
        try:
            data = {
                "trades": [asdict(t) for t in self.trades],
                "open_trades": {k: asdict(v) for k, v in self.open_trades.items()},
                "last_updated": datetime.now().isoformat()
            }
            with open(self.history_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error saving trade history: {e}")
    
    def record_entry(
        self,
        asset: str,
        direction: str,
        strategy: str,
        entry_price: float,
        size_usd: float,
        size_coins: float,
        leverage: int,
        stop_loss: float,
        take_profit: float,
        confidence: float,
        reasons: List[str],
        funding_rate: float = 0.0,
        rsi_at_entry: Optional[float] = None,
        volume_ratio: Optional[float] = None,
        learned_params_version: int = 0
    ) -> str:
        """Record a new trade entry, returns trade_id"""
        now = datetime.now()
        trade_id = f"{asset}_{now.strftime('%Y%m%d_%H%M%S')}_{strategy[:3]}"
        
        trade = TradeRecord(
            trade_id=trade_id,
            timestamp=now.isoformat(),
            asset=asset,
            direction=direction,
            strategy=strategy,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            size_usd=size_usd,
            size_coins=size_coins,
            leverage=leverage,
            funding_rate=funding_rate,
            rsi_at_entry=rsi_at_entry,
            volume_ratio=volume_ratio,
            confidence=confidence,
            reasons=reasons,
            entry_time=now.isoformat(),
            hour_of_day=now.hour,
            day_of_week=now.weekday(),
            learned_params_version=learned_params_version
        )
        
        self.open_trades[trade_id] = trade
        self._save_history()
        
        print(f"📝 Trade recorded: {trade_id}")
        return trade_id
    
    def record_exit(
        self,
        trade_id: str,
        exit_price: float,
        exit_reason: str,
        fees_paid: float = 0.0,
        funding_received: float = 0.0
    ) -> Optional[TradeRecord]:
        """Record trade exit and move to completed trades"""
        if trade_id not in self.open_trades:
            # Try to find by asset (fallback)
            for tid, trade in list(self.open_trades.items()):
                if trade.asset in trade_id or trade_id in tid:
                    trade_id = tid
                    break
            else:
                print(f"⚠️ Trade not found: {trade_id}")
                return None
        
        trade = self.open_trades.pop(trade_id)
        now = datetime.now()
        
        # Calculate results
        trade.exit_price = exit_price
        trade.exit_time = now.isoformat()
        trade.exit_reason = exit_reason
        trade.fees_paid = fees_paid
        trade.funding_received = funding_received
        
        # Hold duration
        entry_time = datetime.fromisoformat(trade.entry_time)
        trade.hold_duration_seconds = int((now - entry_time).total_seconds())
        
        # P&L calculation
        if trade.direction == "LONG":
            trade.pnl_percent = ((exit_price - trade.entry_price) / trade.entry_price) * 100
        else:  # SHORT
            trade.pnl_percent = ((trade.entry_price - exit_price) / trade.entry_price) * 100
        
        trade.pnl_usd = (trade.pnl_percent / 100) * trade.size_usd * trade.leverage
        trade.net_pnl = trade.pnl_usd + trade.funding_received - trade.fees_paid
        trade.result = "WIN" if trade.net_pnl > 0 else "LOSS"
        
        # Add to completed trades
        self.trades.append(trade)
        self._save_history()
        
        print(f"✅ Trade closed: {trade_id} | {trade.result} | ${trade.net_pnl:.2f}")
        return trade
    
    def record_exit_by_asset(
        self,
        asset: str,
        exit_price: float,
        exit_reason: str,
        pnl_usd: float,
        fees_paid: float = 0.0,
        funding_received: float = 0.0
    ) -> Optional[TradeRecord]:
        """Record exit by asset (when trade_id is not available)"""
        # Find the open trade for this asset
        for trade_id, trade in list(self.open_trades.items()):
            if trade.asset == asset:
                # Override calculated PnL with actual if provided
                trade.pnl_usd = pnl_usd
                return self.record_exit(trade_id, exit_price, exit_reason, fees_paid, funding_received)
        
        print(f"⚠️ No open trade found for {asset}")
        return None
    
    def get_recent_trades(self, hours: int = 24) -> List[TradeRecord]:
        """Get trades from the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        return [t for t in self.trades if datetime.fromisoformat(t.timestamp) > cutoff]
    
    def get_trades_count(self) -> int:
        """Get total number of completed trades"""
        return len(self.trades)


# ============================================================================
# PERFORMANCE ANALYTICS
# ============================================================================

class PerformanceAnalytics:
    """Analyzes trade history to find profitable patterns"""
    
    def __init__(self, tracker: TradeOutcomeTracker):
        self.tracker = tracker
    
    def calculate_stats(self, trades: List[TradeRecord]) -> PerformanceStats:
        """Calculate comprehensive stats from a list of trades"""
        stats = PerformanceStats(period="custom")
        
        if not trades:
            return stats
        
        stats.total_trades = len(trades)
        
        wins = [t for t in trades if t.result == "WIN"]
        losses = [t for t in trades if t.result == "LOSS"]
        
        stats.winning_trades = len(wins)
        stats.losing_trades = len(losses)
        stats.win_rate = (stats.winning_trades / stats.total_trades * 100) if stats.total_trades > 0 else 0
        
        # P&L
        stats.total_pnl = sum(t.net_pnl for t in trades)
        stats.trading_pnl = sum(t.pnl_usd for t in trades)
        stats.funding_income = sum(t.funding_received for t in trades)
        stats.fees_paid = sum(t.fees_paid for t in trades)
        
        # Win/Loss averages
        if wins:
            stats.avg_win = statistics.mean(t.net_pnl for t in wins)
            stats.best_trade = max(t.net_pnl for t in wins)
        
        if losses:
            stats.avg_loss = statistics.mean(t.net_pnl for t in losses)
            stats.worst_trade = min(t.net_pnl for t in losses)
        
        # Profit factor
        total_wins = sum(t.net_pnl for t in wins) if wins else 0
        total_losses = abs(sum(t.net_pnl for t in losses)) if losses else 0
        stats.profit_factor = (total_wins / total_losses) if total_losses > 0 else float('inf')
        
        # Expectancy
        stats.expectancy = stats.total_pnl / stats.total_trades if stats.total_trades > 0 else 0
        
        # Hold time
        hold_times = [t.hold_duration_seconds for t in trades if t.hold_duration_seconds]
        stats.avg_hold_time_seconds = statistics.mean(hold_times) if hold_times else 0
        
        # Breakdowns
        stats.by_asset = self._breakdown_by_field(trades, "asset")
        stats.by_strategy = self._breakdown_by_field(trades, "strategy")
        stats.by_direction = self._breakdown_by_field(trades, "direction")
        stats.by_hour = self._breakdown_by_field(trades, "hour_of_day")
        stats.by_day = self._breakdown_by_field(trades, "day_of_week")
        
        return stats
    
    def _breakdown_by_field(self, trades: List[TradeRecord], field: str) -> Dict:
        """Break down performance by a specific field"""
        breakdown = defaultdict(lambda: {"trades": 0, "wins": 0, "pnl": 0.0})
        
        for trade in trades:
            key = getattr(trade, field)
            breakdown[key]["trades"] += 1
            if trade.result == "WIN":
                breakdown[key]["wins"] += 1
            breakdown[key]["pnl"] += trade.net_pnl
        
        # Calculate win rates
        for key in breakdown:
            total = breakdown[key]["trades"]
            wins = breakdown[key]["wins"]
            breakdown[key]["win_rate"] = (wins / total * 100) if total > 0 else 0
        
        return dict(breakdown)
    
    def get_rolling_stats(self, hours: int = 24) -> PerformanceStats:
        """Get rolling statistics for the last N hours"""
        trades = self.tracker.get_recent_trades(hours)
        stats = self.calculate_stats(trades)
        stats.period = f"{hours}h"
        return stats
    
    def get_all_time_stats(self) -> PerformanceStats:
        """Get all-time statistics"""
        stats = self.calculate_stats(self.tracker.trades)
        stats.period = "all"
        return stats
    
    def identify_profitable_conditions(self, min_samples: int = 10) -> Dict[str, Any]:
        """Identify which conditions correlate with profits"""
        trades = self.tracker.trades
        
        if len(trades) < min_samples:
            return {"message": f"Need at least {min_samples} trades for analysis"}
        
        insights = {
            "best_strategies": [],
            "best_hours": [],
            "best_direction": None,
            "funding_correlation": None,
            "confidence_correlation": None
        }
        
        # Best strategies
        by_strategy = self._breakdown_by_field(trades, "strategy")
        for strat, data in sorted(by_strategy.items(), key=lambda x: x[1]["pnl"], reverse=True):
            if data["trades"] >= 5:
                insights["best_strategies"].append({
                    "strategy": strat,
                    "win_rate": data["win_rate"],
                    "total_pnl": data["pnl"],
                    "trades": data["trades"]
                })
        
        # Best hours
        by_hour = self._breakdown_by_field(trades, "hour_of_day")
        for hour, data in sorted(by_hour.items(), key=lambda x: x[1]["pnl"], reverse=True)[:5]:
            if data["trades"] >= 3:
                insights["best_hours"].append({
                    "hour": hour,
                    "win_rate": data["win_rate"],
                    "total_pnl": data["pnl"],
                    "trades": data["trades"]
                })
        
        # Direction bias
        by_direction = self._breakdown_by_field(trades, "direction")
        if by_direction:
            best_dir = max(by_direction.items(), key=lambda x: x[1]["pnl"])
            insights["best_direction"] = {
                "direction": best_dir[0],
                "win_rate": best_dir[1]["win_rate"],
                "pnl": best_dir[1]["pnl"]
            }
        
        # Confidence correlation
        confidences = [t.confidence for t in trades]
        pnls = [t.net_pnl for t in trades]
        if len(confidences) > 5:
            # Simple correlation
            avg_conf = statistics.mean(confidences)
            avg_pnl = statistics.mean(pnls)
            
            high_conf_trades = [t for t in trades if t.confidence >= avg_conf]
            low_conf_trades = [t for t in trades if t.confidence < avg_conf]
            
            if high_conf_trades and low_conf_trades:
                high_conf_pnl = statistics.mean(t.net_pnl for t in high_conf_trades)
                low_conf_pnl = statistics.mean(t.net_pnl for t in low_conf_trades)
                
                insights["confidence_correlation"] = {
                    "high_conf_avg_pnl": high_conf_pnl,
                    "low_conf_avg_pnl": low_conf_pnl,
                    "confidence_helps": high_conf_pnl > low_conf_pnl
                }
        
        return insights


# ============================================================================
# ADAPTIVE PARAMETER TUNER
# ============================================================================

class AdaptiveParameterTuner:
    """Automatically adjusts trading parameters based on performance"""
    
    PARAMS_FILE = "hyperliquid_learned_params.json"
    ANALYSIS_INTERVAL = 20  # Analyze after every 20 trades
    
    # Adjustment limits (prevent wild swings)
    MAX_SIZE_MULTIPLIER = 1.5
    MIN_SIZE_MULTIPLIER = 0.5
    MAX_CONFIDENCE_ADJUSTMENT = 15  # +/- 15 points max
    MAX_SL_TP_ADJUSTMENT = 0.3  # +/- 30% max
    
    def __init__(self, tracker: TradeOutcomeTracker, analytics: PerformanceAnalytics):
        self.tracker = tracker
        self.analytics = analytics
        self.params = self._load_params()
        self.last_analysis_count = self.params.trades_analyzed
    
    def _load_params(self) -> LearnedParameters:
        """Load learned parameters from file"""
        if os.path.exists(self.PARAMS_FILE):
            try:
                with open(self.PARAMS_FILE, 'r') as f:
                    data = json.load(f)
                    params = LearnedParameters(
                        version=data.get("version", 1),
                        last_updated=data.get("last_updated", ""),
                        trades_analyzed=data.get("trades_analyzed", 0)
                    )
                    # Load dictionaries
                    params.asset_multipliers = data.get("asset_multipliers", params.asset_multipliers)
                    params.strategy_adjustments = data.get("strategy_adjustments", params.strategy_adjustments)
                    params.direction_multipliers = data.get("direction_multipliers", params.direction_multipliers)
                    params.hour_multipliers = {int(k): v for k, v in data.get("hour_multipliers", params.hour_multipliers).items()}
                    params.stop_loss_adjustments = data.get("stop_loss_adjustments", params.stop_loss_adjustments)
                    params.take_profit_adjustments = data.get("take_profit_adjustments", params.take_profit_adjustments)
                    params.min_funding_rate_long = data.get("min_funding_rate_long", params.min_funding_rate_long)
                    params.min_funding_rate_short = data.get("min_funding_rate_short", params.min_funding_rate_short)
                    params.overall_size_multiplier = data.get("overall_size_multiplier", params.overall_size_multiplier)
                    params.min_confidence_adjustment = data.get("min_confidence_adjustment", params.min_confidence_adjustment)
                    
                    print(f"🧠 Loaded learned params v{params.version} ({params.trades_analyzed} trades analyzed)")
                    return params
            except Exception as e:
                print(f"⚠️ Error loading params: {e}")
        
        return LearnedParameters()
    
    def _save_params(self):
        """Save learned parameters to file"""
        try:
            data = {
                "version": self.params.version,
                "last_updated": self.params.last_updated,
                "trades_analyzed": self.params.trades_analyzed,
                "asset_multipliers": self.params.asset_multipliers,
                "strategy_adjustments": self.params.strategy_adjustments,
                "direction_multipliers": self.params.direction_multipliers,
                "hour_multipliers": self.params.hour_multipliers,
                "stop_loss_adjustments": self.params.stop_loss_adjustments,
                "take_profit_adjustments": self.params.take_profit_adjustments,
                "min_funding_rate_long": self.params.min_funding_rate_long,
                "min_funding_rate_short": self.params.min_funding_rate_short,
                "overall_size_multiplier": self.params.overall_size_multiplier,
                "min_confidence_adjustment": self.params.min_confidence_adjustment
            }
            with open(self.PARAMS_FILE, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error saving params: {e}")
    
    def should_analyze(self) -> bool:
        """Check if we should run analysis"""
        current_count = self.tracker.get_trades_count()
        trades_since_analysis = current_count - self.last_analysis_count
        return trades_since_analysis >= self.ANALYSIS_INTERVAL
    
    def analyze_and_adjust(self) -> Dict[str, Any]:
        """Run analysis and adjust parameters"""
        trades = self.tracker.trades
        current_count = len(trades)
        
        if current_count < 20:
            return {"message": "Need at least 20 trades before adjusting parameters"}
        
        adjustments_made = []
        
        # Get recent performance (last 20-50 trades)
        recent_trades = trades[-50:] if len(trades) >= 50 else trades[-20:]
        stats = self.analytics.calculate_stats(recent_trades)
        
        print(f"\n🧠 LEARNING LAYER ANALYSIS")
        print(f"   Analyzing {len(recent_trades)} recent trades...")
        print(f"   Win Rate: {stats.win_rate:.1f}%")
        print(f"   Total P&L: ${stats.total_pnl:.2f}")
        print(f"   Profit Factor: {stats.profit_factor:.2f}")
        
        # 1. Adjust overall position size based on recent win rate
        old_multiplier = self.params.overall_size_multiplier
        if stats.win_rate >= 60:
            # Winning more, can increase size slightly
            self.params.overall_size_multiplier = min(
                self.params.overall_size_multiplier * 1.1,
                self.MAX_SIZE_MULTIPLIER
            )
            if self.params.overall_size_multiplier != old_multiplier:
                adjustments_made.append(f"Position size: {old_multiplier:.2f} → {self.params.overall_size_multiplier:.2f} (high win rate)")
        elif stats.win_rate < 45:
            # Losing too much, reduce size
            self.params.overall_size_multiplier = max(
                self.params.overall_size_multiplier * 0.9,
                self.MIN_SIZE_MULTIPLIER
            )
            if self.params.overall_size_multiplier != old_multiplier:
                adjustments_made.append(f"Position size: {old_multiplier:.2f} → {self.params.overall_size_multiplier:.2f} (low win rate)")
        
        # 2. Adjust strategy confidence thresholds
        for strategy, data in stats.by_strategy.items():
            if data["trades"] >= 5:  # Need minimum samples
                old_adj = self.params.strategy_adjustments.get(strategy, 0)
                
                if data["win_rate"] >= 65 and data["pnl"] > 0:
                    # Strategy is working well, lower threshold to take more signals
                    new_adj = max(old_adj - 2, -self.MAX_CONFIDENCE_ADJUSTMENT)
                    self.params.strategy_adjustments[strategy] = new_adj
                    if new_adj != old_adj:
                        adjustments_made.append(f"{strategy} confidence: {old_adj:+.0f} → {new_adj:+.0f} (performing well)")
                
                elif data["win_rate"] < 40 or data["pnl"] < 0:
                    # Strategy is struggling, raise threshold
                    new_adj = min(old_adj + 3, self.MAX_CONFIDENCE_ADJUSTMENT)
                    self.params.strategy_adjustments[strategy] = new_adj
                    if new_adj != old_adj:
                        adjustments_made.append(f"{strategy} confidence: {old_adj:+.0f} → {new_adj:+.0f} (underperforming)")
        
        # 3. Adjust direction multipliers
        for direction, data in stats.by_direction.items():
            if data["trades"] >= 10:
                old_mult = self.params.direction_multipliers.get(direction, 1.0)
                
                if data["win_rate"] >= 60 and data["pnl"] > 0:
                    new_mult = min(old_mult * 1.05, 1.3)
                    self.params.direction_multipliers[direction] = new_mult
                    if abs(new_mult - old_mult) > 0.01:
                        adjustments_made.append(f"{direction} multiplier: {old_mult:.2f} → {new_mult:.2f}")
                
                elif data["win_rate"] < 45 or data["pnl"] < 0:
                    new_mult = max(old_mult * 0.95, 0.7)
                    self.params.direction_multipliers[direction] = new_mult
                    if abs(new_mult - old_mult) > 0.01:
                        adjustments_made.append(f"{direction} multiplier: {old_mult:.2f} → {new_mult:.2f}")
        
        # 4. Adjust stop loss / take profit based on what's working
        for strategy, data in stats.by_strategy.items():
            if data["trades"] < 5:
                continue
            
            # Analyze exits for this strategy
            strategy_trades = [t for t in recent_trades if t.strategy == strategy]
            
            # Count stop loss vs take profit exits
            sl_exits = [t for t in strategy_trades if t.exit_reason == "stop_loss"]
            tp_exits = [t for t in strategy_trades if t.exit_reason == "take_profit"]
            
            if len(sl_exits) > len(tp_exits) * 2:
                # Stops getting hit too often, widen them slightly
                old_adj = self.params.stop_loss_adjustments.get(strategy, 0)
                new_adj = min(old_adj + 0.05, self.MAX_SL_TP_ADJUSTMENT)
                self.params.stop_loss_adjustments[strategy] = new_adj
                if abs(new_adj - old_adj) > 0.01:
                    adjustments_made.append(f"{strategy} stop loss: {old_adj:+.1%} → {new_adj:+.1%} (stops hit too often)")
            
            elif len(tp_exits) > 0 and data["pnl"] < 0:
                # Taking profits but still losing, maybe hold longer
                old_adj = self.params.take_profit_adjustments.get(strategy, 0)
                new_adj = min(old_adj + 0.05, self.MAX_SL_TP_ADJUSTMENT)
                self.params.take_profit_adjustments[strategy] = new_adj
                if abs(new_adj - old_adj) > 0.01:
                    adjustments_made.append(f"{strategy} take profit: {old_adj:+.1%} → {new_adj:+.1%} (widen targets)")
        
        # 5. Hour-based adjustments
        for hour, data in stats.by_hour.items():
            if data["trades"] >= 3:
                old_mult = self.params.hour_multipliers.get(hour, 1.0)
                
                if data["win_rate"] >= 70 and data["pnl"] > 0:
                    new_mult = min(old_mult * 1.1, 1.3)
                    self.params.hour_multipliers[hour] = new_mult
                
                elif data["win_rate"] < 35 and data["pnl"] < 0:
                    new_mult = max(old_mult * 0.8, 0.5)
                    self.params.hour_multipliers[hour] = new_mult
        
        # Update metadata
        self.params.version += 1
        self.params.last_updated = datetime.now().isoformat()
        self.params.trades_analyzed = current_count
        self.last_analysis_count = current_count
        
        # Save
        self._save_params()
        
        if adjustments_made:
            print(f"\n📊 PARAMETER ADJUSTMENTS (v{self.params.version}):")
            for adj in adjustments_made:
                print(f"   • {adj}")
        else:
            print("   No adjustments needed at this time")
        
        return {
            "version": self.params.version,
            "trades_analyzed": current_count,
            "adjustments": adjustments_made,
            "current_params": {
                "overall_size_multiplier": self.params.overall_size_multiplier,
                "strategy_adjustments": self.params.strategy_adjustments,
                "direction_multipliers": self.params.direction_multipliers
            }
        }
    
    def get_adjusted_confidence_threshold(self, strategy: str, base_threshold: int) -> int:
        """Get confidence threshold adjusted by learning"""
        adjustment = self.params.strategy_adjustments.get(strategy, 0)
        return int(base_threshold + adjustment + self.params.min_confidence_adjustment)
    
    def get_position_size_multiplier(self, asset: str, direction: str, hour: int) -> float:
        """Get combined position size multiplier"""
        multiplier = self.params.overall_size_multiplier
        multiplier *= self.params.asset_multipliers.get(asset, 1.0)
        multiplier *= self.params.direction_multipliers.get(direction, 1.0)
        multiplier *= self.params.hour_multipliers.get(hour, 1.0)
        
        # Clamp to reasonable range
        return max(self.MIN_SIZE_MULTIPLIER, min(self.MAX_SIZE_MULTIPLIER, multiplier))
    
    def get_adjusted_stop_loss(self, strategy: str, base_stop_pct: float) -> float:
        """Get stop loss adjusted by learning"""
        adjustment = self.params.stop_loss_adjustments.get(strategy, 0)
        return base_stop_pct * (1 + adjustment)
    
    def get_adjusted_take_profit(self, strategy: str, base_tp_pct: float) -> float:
        """Get take profit adjusted by learning"""
        adjustment = self.params.take_profit_adjustments.get(strategy, 0)
        return base_tp_pct * (1 + adjustment)


# ============================================================================
# REINFORCEMENT SIGNAL
# ============================================================================

class ReinforcementSignal:
    """Applies learned adjustments to trading decisions"""
    
    def __init__(self, tuner: AdaptiveParameterTuner):
        self.tuner = tuner
    
    def should_take_trade(
        self,
        strategy: str,
        direction: str,
        confidence: float,
        base_threshold: int,
        hour: int
    ) -> Tuple[bool, str]:
        """Decide if a trade should be taken based on learning"""
        
        # Get adjusted threshold
        adjusted_threshold = self.tuner.get_adjusted_confidence_threshold(strategy, base_threshold)
        
        # Get hour multiplier (if very low, skip)
        hour_mult = self.tuner.params.hour_multipliers.get(hour, 1.0)
        if hour_mult < 0.6:
            return False, f"Hour {hour} has poor historical performance"
        
        # Get direction multiplier (if very low, skip)
        dir_mult = self.tuner.params.direction_multipliers.get(direction, 1.0)
        if dir_mult < 0.75:
            return False, f"{direction} direction has poor historical performance"
        
        # Check confidence vs adjusted threshold
        if confidence < adjusted_threshold:
            return False, f"Confidence {confidence:.0f}% < adjusted threshold {adjusted_threshold}%"
        
        return True, f"Passed (threshold: {adjusted_threshold}%, hour_mult: {hour_mult:.2f})"
    
    def get_adjusted_position_size(
        self,
        base_size: float,
        asset: str,
        direction: str,
        hour: int
    ) -> float:
        """Get position size adjusted by learning"""
        multiplier = self.tuner.get_position_size_multiplier(asset, direction, hour)
        return base_size * multiplier
    
    def get_adjusted_stops(
        self,
        strategy: str,
        entry_price: float,
        direction: str,
        base_stop_pct: float,
        base_tp_pct: float
    ) -> Tuple[float, float]:
        """Get adjusted stop loss and take profit prices"""
        
        adj_stop_pct = self.tuner.get_adjusted_stop_loss(strategy, base_stop_pct)
        adj_tp_pct = self.tuner.get_adjusted_take_profit(strategy, base_tp_pct)
        
        if direction == "LONG":
            stop_loss = entry_price * (1 - adj_stop_pct / 100)
            take_profit = entry_price * (1 + adj_tp_pct / 100)
        else:  # SHORT
            stop_loss = entry_price * (1 + adj_stop_pct / 100)
            take_profit = entry_price * (1 - adj_tp_pct / 100)
        
        return stop_loss, take_profit


# ============================================================================
# LEARNING LAYER MANAGER
# ============================================================================

class LearningLayerManager:
    """Main interface for the learning layer"""
    
    def __init__(
        self,
        history_file: str = "hyperliquid_trade_history.json",
        params_file: str = "hyperliquid_learned_params.json"
    ):
        # Override default file paths
        AdaptiveParameterTuner.PARAMS_FILE = params_file
        
        self.tracker = TradeOutcomeTracker(history_file)
        self.analytics = PerformanceAnalytics(self.tracker)
        self.tuner = AdaptiveParameterTuner(self.tracker, self.analytics)
        self.signal = ReinforcementSignal(self.tuner)
        
        print(f"🧠 Learning Layer initialized")
        print(f"   History: {history_file}")
        print(f"   Params: {params_file}")
        print(f"   Trades loaded: {len(self.tracker.trades)}")
        print(f"   Open positions: {len(self.tracker.open_trades)}")
    
    def record_trade_entry(self, **kwargs) -> str:
        """Record a new trade entry"""
        kwargs["learned_params_version"] = self.tuner.params.version
        return self.tracker.record_entry(**kwargs)
    
    def record_trade_exit(self, **kwargs) -> Optional[TradeRecord]:
        """Record a trade exit"""
        result = self.tracker.record_exit(**kwargs)
        
        # Check if we should analyze
        if result and self.tuner.should_analyze():
            print("\n🔄 Triggering learning analysis...")
            self.tuner.analyze_and_adjust()
        
        return result
    
    def record_trade_exit_by_asset(self, **kwargs) -> Optional[TradeRecord]:
        """Record exit by asset name"""
        result = self.tracker.record_exit_by_asset(**kwargs)
        
        if result and self.tuner.should_analyze():
            print("\n🔄 Triggering learning analysis...")
            self.tuner.analyze_and_adjust()
        
        return result
    
    def should_take_trade(self, strategy: str, direction: str, confidence: float, base_threshold: int) -> Tuple[bool, str]:
        """Check if trade should be taken based on learning"""
        hour = datetime.now().hour
        return self.signal.should_take_trade(strategy, direction, confidence, base_threshold, hour)
    
    def get_adjusted_position_size(self, base_size: float, asset: str, direction: str) -> float:
        """Get learning-adjusted position size"""
        hour = datetime.now().hour
        return self.signal.get_adjusted_position_size(base_size, asset, direction, hour)
    
    def get_adjusted_stops(self, strategy: str, entry_price: float, direction: str, base_stop_pct: float, base_tp_pct: float) -> Tuple[float, float]:
        """Get learning-adjusted stop loss and take profit"""
        return self.signal.get_adjusted_stops(strategy, entry_price, direction, base_stop_pct, base_tp_pct)
    
    def get_performance_summary(self) -> str:
        """Get a human-readable performance summary"""
        stats_24h = self.analytics.get_rolling_stats(24)
        stats_7d = self.analytics.get_rolling_stats(168)
        stats_all = self.analytics.get_all_time_stats()
        
        lines = [
            "\n📊 PERFORMANCE SUMMARY",
            "=" * 50,
            f"\n24 HOUR:",
            f"   Trades: {stats_24h.total_trades} | Win Rate: {stats_24h.win_rate:.1f}%",
            f"   P&L: ${stats_24h.total_pnl:.2f} | Expectancy: ${stats_24h.expectancy:.2f}",
            f"\n7 DAY:",
            f"   Trades: {stats_7d.total_trades} | Win Rate: {stats_7d.win_rate:.1f}%",
            f"   P&L: ${stats_7d.total_pnl:.2f} | Profit Factor: {stats_7d.profit_factor:.2f}",
            f"\nALL TIME:",
            f"   Trades: {stats_all.total_trades} | Win Rate: {stats_all.win_rate:.1f}%",
            f"   P&L: ${stats_all.total_pnl:.2f} | Best: ${stats_all.best_trade:.2f} | Worst: ${stats_all.worst_trade:.2f}",
        ]
        
        if stats_all.by_strategy:
            lines.append(f"\nBY STRATEGY:")
            for strat, data in stats_all.by_strategy.items():
                lines.append(f"   {strat}: {data['trades']} trades | {data['win_rate']:.0f}% win | ${data['pnl']:.2f}")
        
        lines.append("\n" + "=" * 50)
        
        return "\n".join(lines)
    
    def force_analysis(self) -> Dict:
        """Force a learning analysis regardless of trade count"""
        return self.tuner.analyze_and_adjust()
    
    def get_current_params(self) -> LearnedParameters:
        """Get current learned parameters"""
        return self.tuner.params


# ============================================================================
# TESTING / CLI
# ============================================================================

if __name__ == "__main__":
    import sys
    
    print("🧠 Hyperliquid Learning Layer Test")
    print("=" * 50)
    
    # Initialize
    manager = LearningLayerManager()
    
    # Show summary
    print(manager.get_performance_summary())
    
    # Check current params
    params = manager.get_current_params()
    print(f"\n📈 Current Learned Parameters (v{params.version}):")
    print(f"   Overall size multiplier: {params.overall_size_multiplier:.2f}")
    print(f"   Strategy adjustments: {params.strategy_adjustments}")
    print(f"   Direction multipliers: {params.direction_multipliers}")
    
    if "--analyze" in sys.argv:
        print("\n🔄 Forcing analysis...")
        result = manager.force_analysis()
        print(f"   Result: {result}")
