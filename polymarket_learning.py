#!/usr/bin/env python3
"""
Polymarket Adaptive Learning Engine
Makes the trading bot genuinely smarter with each trade.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict, field
from collections import defaultdict
import statistics

# ============================================================================
# CONFIGURATION
# ============================================================================

TRADE_HISTORY_PATH = "/Users/erik/.openclaw/workspace/trade_history.json"
LEARNED_PARAMS_PATH = "/Users/erik/.openclaw/workspace/learned_params.json"
PERFORMANCE_STATS_PATH = "/Users/erik/.openclaw/workspace/performance_stats.json"

# Learning parameters
TRADES_BEFORE_ADAPTATION = 20  # Analyze after every 20 trades
MIN_SAMPLES_FOR_SIGNAL = 20   # Need 20+ samples to make adjustments
BOOST_THRESHOLD = 0.60        # >60% win rate = boost confidence
REDUCE_THRESHOLD = 0.40       # <40% win rate = reduce confidence
MAX_CONFIDENCE_BOOST = 0.15   # Max boost to apply
MAX_CONFIDENCE_PENALTY = 0.15 # Max penalty to apply
ADJUSTMENT_STEP = 0.02        # Gradual adjustment step (2%)

# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass
class TradeRecord:
    """Complete record of a trade for learning"""
    id: str
    timestamp: str
    asset: str  # BTC or ETH
    direction: str  # UP or DOWN
    confidence: float
    price_at_entry: float
    price_at_resolution: Optional[float] = None
    price_change_at_entry: float = 0.0  # % change when we entered
    time_in_window: int = 0  # seconds into the 15-min window
    window_start_price: float = 0.0
    window_end_price: Optional[float] = None
    result: str = "PENDING"  # PENDING, WIN, LOSS
    pnl: float = 0.0
    order_id: str = ""
    market_slug: str = ""
    entry_odds: Optional[float] = None  # Actual odds at entry (e.g., 0.55)
    stake: float = 5.0  # Amount bet in USD
    
    # Computed time bucket
    @property
    def time_bucket(self) -> str:
        if self.time_in_window <= 180:
            return "early_0-3m"
        elif self.time_in_window <= 420:
            return "mid_3-7m"
        else:
            return "late_7-14m"
    
    # Confidence bucket
    @property
    def confidence_bucket(self) -> str:
        if self.confidence < 0.3:
            return "low_<30%"
        elif self.confidence < 0.5:
            return "med_30-50%"
        elif self.confidence < 0.7:
            return "high_50-70%"
        else:
            return "very_high_>70%"
    
    def to_dict(self) -> dict:
        d = asdict(self)
        d['time_bucket'] = self.time_bucket
        d['confidence_bucket'] = self.confidence_bucket
        return d

@dataclass
class ConditionStats:
    """Statistics for a specific condition combination"""
    condition: str
    total_trades: int = 0
    wins: int = 0
    losses: int = 0
    total_pnl: float = 0.0
    
    @property
    def win_rate(self) -> float:
        if self.total_trades == 0:
            return 0.5  # Neutral assumption
        return self.wins / self.total_trades
    
    @property
    def avg_pnl(self) -> float:
        if self.total_trades == 0:
            return 0.0
        return self.total_pnl / self.total_trades

@dataclass
class LearnedParams:
    """Parameters learned from trading history"""
    min_confidence: float = 0.20
    preferred_time_buckets: Dict[str, float] = field(default_factory=lambda: {
        "early_0-3m": 0.0,
        "mid_3-7m": 0.0,
        "late_7-14m": 0.0
    })
    asset_modifiers: Dict[str, float] = field(default_factory=lambda: {
        "BTC": 0.0,
        "ETH": 0.0
    })
    direction_modifiers: Dict[str, float] = field(default_factory=lambda: {
        "UP": 0.0,
        "DOWN": 0.0
    })
    condition_modifiers: Dict[str, float] = field(default_factory=dict)
    last_updated: str = ""
    total_trades_analyzed: int = 0
    version: int = 1

# ============================================================================
# LEARNING ENGINE
# ============================================================================

class LearningEngine:
    """
    Adaptive learning engine that makes the bot smarter over time.
    
    Key responsibilities:
    1. Track every trade with full context
    2. Calculate performance by various conditions
    3. Auto-tune parameters based on what works
    4. Provide confidence adjustments for new trades
    """
    
    def __init__(self):
        self.trade_history: List[TradeRecord] = []
        self.learned_params = LearnedParams()
        self.condition_stats: Dict[str, ConditionStats] = {}
        self.trades_since_last_adaptation = 0
        
        # Load existing data
        self._load_trade_history()
        self._load_learned_params()
        self._rebuild_condition_stats()
    
    def log(self, msg: str, level: str = "LEARN"):
        """Log learning events"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        emoji = {
            "LEARN": "🧠",
            "ADAPT": "🔧",
            "BOOST": "⬆️",
            "REDUCE": "⬇️",
            "TRACK": "📝",
            "STATS": "📊"
        }.get(level, "💡")
        print(f"[{timestamp}] {emoji} {msg}")
    
    # =========================================================================
    # PERSISTENCE
    # =========================================================================
    
    def _load_trade_history(self):
        """Load trade history from disk"""
        if os.path.exists(TRADE_HISTORY_PATH):
            try:
                with open(TRADE_HISTORY_PATH, 'r') as f:
                    data = json.load(f)
                    self.trade_history = []
                    for record in data.get('trades', []):
                        # Remove computed properties that shouldn't be passed to __init__
                        record.pop('time_bucket', None)
                        record.pop('confidence_bucket', None)
                        self.trade_history.append(TradeRecord(**record))
                    self.log(f"Loaded {len(self.trade_history)} historical trades")
            except Exception as e:
                self.log(f"Error loading trade history: {e}")
                self.trade_history = []
    
    def _save_trade_history(self):
        """Save trade history to disk"""
        try:
            data = {
                'last_updated': datetime.now().isoformat(),
                'total_trades': len(self.trade_history),
                'trades': [t.to_dict() for t in self.trade_history]
            }
            with open(TRADE_HISTORY_PATH, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            self.log(f"Error saving trade history: {e}")
    
    def _load_learned_params(self):
        """Load learned parameters from disk"""
        if os.path.exists(LEARNED_PARAMS_PATH):
            try:
                with open(LEARNED_PARAMS_PATH, 'r') as f:
                    data = json.load(f)
                    self.learned_params = LearnedParams(
                        min_confidence=data.get('min_confidence', 0.20),
                        preferred_time_buckets=data.get('preferred_time_buckets', {}),
                        asset_modifiers=data.get('asset_modifiers', {}),
                        direction_modifiers=data.get('direction_modifiers', {}),
                        condition_modifiers=data.get('condition_modifiers', {}),
                        last_updated=data.get('last_updated', ''),
                        total_trades_analyzed=data.get('total_trades_analyzed', 0),
                        version=data.get('version', 1)
                    )
                    self.log(f"Loaded learned params (v{self.learned_params.version})")
            except Exception as e:
                self.log(f"Error loading learned params: {e}")
    
    def _save_learned_params(self):
        """Save learned parameters to disk"""
        try:
            self.learned_params.last_updated = datetime.now().isoformat()
            data = asdict(self.learned_params)
            with open(LEARNED_PARAMS_PATH, 'w') as f:
                json.dump(data, f, indent=2)
            self.log(f"Saved learned params to disk", "ADAPT")
        except Exception as e:
            self.log(f"Error saving learned params: {e}")
    
    def _save_performance_stats(self):
        """Save current performance stats"""
        try:
            stats = {
                'last_updated': datetime.now().isoformat(),
                'overall': self._get_overall_stats(),
                'by_asset': self._get_stats_by_dimension('asset'),
                'by_direction': self._get_stats_by_dimension('direction'),
                'by_time_bucket': self._get_stats_by_dimension('time_bucket'),
                'by_confidence': self._get_stats_by_dimension('confidence_bucket'),
                'rolling_24h': self._get_rolling_stats(hours=24),
                'rolling_7d': self._get_rolling_stats(hours=168),
                'condition_combos': {k: asdict(v) for k, v in self.condition_stats.items()}
            }
            with open(PERFORMANCE_STATS_PATH, 'w') as f:
                json.dump(stats, f, indent=2)
        except Exception as e:
            self.log(f"Error saving performance stats: {e}")
    
    # =========================================================================
    # TRADE TRACKING
    # =========================================================================
    
    def record_trade(self, 
                     asset: str,
                     direction: str,
                     confidence: float,
                     price_at_entry: float,
                     price_change_at_entry: float,
                     time_in_window: int,
                     window_start_price: float,
                     order_id: str,
                     market_slug: str,
                     entry_odds: Optional[float] = None,
                     stake: float = 5.0) -> str:
        """
        Record a new trade when it's executed.
        Returns the trade ID for later resolution.
        
        Args:
            entry_odds: Actual odds at entry (e.g., 0.55 = 55% probability)
            stake: Amount bet in USD
        """
        trade_id = f"{asset}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.trade_history)}"
        
        trade = TradeRecord(
            id=trade_id,
            timestamp=datetime.now().isoformat(),
            asset=asset,
            direction=direction,
            confidence=confidence,
            price_at_entry=price_at_entry,
            price_change_at_entry=price_change_at_entry,
            time_in_window=time_in_window,
            window_start_price=window_start_price,
            order_id=order_id,
            market_slug=market_slug,
            entry_odds=entry_odds,
            stake=stake
        )
        
        self.trade_history.append(trade)
        self.trades_since_last_adaptation += 1
        self._save_trade_history()
        
        self.log(f"Recorded trade {trade_id}: {asset} {direction} @ {confidence:.1%} confidence", "TRACK")
        
        return trade_id
    
    def resolve_trade(self, trade_id: str, window_end_price: float, actual_direction: str, 
                     entry_odds: Optional[float] = None, stake: float = 5.0):
        """
        Resolve a trade when its 15-min window ends.
        Determines WIN/LOSS and updates all stats.
        
        Args:
            trade_id: Trade identifier
            window_end_price: Final price at window end
            actual_direction: Actual direction market moved (UP or DOWN)
            entry_odds: Odds at entry (e.g., 0.55 means 55% probability)
            stake: Amount bet in USD
        """
        trade = next((t for t in self.trade_history if t.id == trade_id), None)
        if not trade:
            self.log(f"Trade {trade_id} not found for resolution")
            return
        
        if trade.result != "PENDING":
            return  # Already resolved
        
        trade.window_end_price = window_end_price
        trade.price_at_resolution = window_end_price
        
        # Use actual entry odds if provided, otherwise estimate from confidence
        if entry_odds is None:
            # Fallback: estimate odds from confidence (not ideal but better than hardcoded 0.50)
            entry_odds = 0.50
        
        # Determine if we won
        # If we bet UP and price went up, we WIN
        # If we bet DOWN and price went down, we WIN
        if trade.direction == actual_direction:
            trade.result = "WIN"
            # Polymarket payout formula: (stake / odds) = total payout
            # Profit = total payout - stake = (stake / odds) - stake
            # Example: $5 at 0.55 odds = ($5 / 0.55) - $5 = $9.09 - $5 = +$4.09 profit
            total_payout = stake / entry_odds
            trade.pnl = total_payout - stake
        else:
            trade.result = "LOSS"
            # Lost the entire stake
            trade.pnl = -stake
        
        self._save_trade_history()
        self._update_condition_stats(trade)
        
        self.log(
            f"Resolved {trade_id}: {trade.result} | P&L: ${trade.pnl:+.2f} | "
            f"{trade.asset} {trade.direction} (actual: {actual_direction})",
            "WIN" if trade.result == "WIN" else "LOSS"
        )
        
        # Check if we should adapt
        if self.trades_since_last_adaptation >= TRADES_BEFORE_ADAPTATION:
            self._run_adaptation()
    
    def resolve_by_market_slug(self, market_slug: str, window_end_price: float, window_start_price: float):
        """
        Resolve all pending trades for a market slug.
        Called when a 15-minute window ends.
        """
        actual_direction = "UP" if window_end_price > window_start_price else "DOWN"
        
        pending_trades = [
            t for t in self.trade_history 
            if t.market_slug == market_slug and t.result == "PENDING"
        ]
        
        for trade in pending_trades:
            # Try to extract entry odds from trade data
            # This would come from the order execution price
            entry_odds = getattr(trade, 'entry_odds', None)
            stake = getattr(trade, 'stake', 5.0)
            self.resolve_trade(trade.id, window_end_price, actual_direction, 
                             entry_odds=entry_odds, stake=stake)
    
    # =========================================================================
    # PERFORMANCE ANALYTICS
    # =========================================================================
    
    def _rebuild_condition_stats(self):
        """Rebuild all condition statistics from history"""
        self.condition_stats = {}
        
        resolved_trades = [t for t in self.trade_history if t.result in ("WIN", "LOSS")]
        
        for trade in resolved_trades:
            self._update_condition_stats(trade, save=False)
    
    def _update_condition_stats(self, trade: TradeRecord, save: bool = True):
        """Update statistics for all condition combinations"""
        if trade.result not in ("WIN", "LOSS"):
            return
        
        is_win = trade.result == "WIN"
        
        # Individual conditions
        conditions = [
            f"asset:{trade.asset}",
            f"direction:{trade.direction}",
            f"time:{trade.time_bucket}",
            f"confidence:{trade.confidence_bucket}",
        ]
        
        # Combination conditions (pairs)
        combos = [
            f"asset:{trade.asset}|direction:{trade.direction}",
            f"asset:{trade.asset}|time:{trade.time_bucket}",
            f"direction:{trade.direction}|time:{trade.time_bucket}",
            f"asset:{trade.asset}|confidence:{trade.confidence_bucket}",
        ]
        
        all_conditions = conditions + combos
        
        for cond in all_conditions:
            if cond not in self.condition_stats:
                self.condition_stats[cond] = ConditionStats(condition=cond)
            
            stats = self.condition_stats[cond]
            stats.total_trades += 1
            if is_win:
                stats.wins += 1
            else:
                stats.losses += 1
            stats.total_pnl += trade.pnl
        
        if save:
            self._save_performance_stats()
    
    def _get_overall_stats(self) -> Dict:
        """Get overall performance statistics"""
        resolved = [t for t in self.trade_history if t.result in ("WIN", "LOSS")]
        if not resolved:
            return {'total': 0, 'wins': 0, 'losses': 0, 'win_rate': 0, 'total_pnl': 0}
        
        wins = sum(1 for t in resolved if t.result == "WIN")
        total_pnl = sum(t.pnl for t in resolved)
        
        return {
            'total': len(resolved),
            'wins': wins,
            'losses': len(resolved) - wins,
            'win_rate': wins / len(resolved),
            'total_pnl': total_pnl,
            'avg_pnl': total_pnl / len(resolved)
        }
    
    def _get_stats_by_dimension(self, dimension: str) -> Dict[str, Dict]:
        """Get statistics grouped by a dimension"""
        resolved = [t for t in self.trade_history if t.result in ("WIN", "LOSS")]
        
        groups = defaultdict(list)
        for trade in resolved:
            if dimension == 'asset':
                key = trade.asset
            elif dimension == 'direction':
                key = trade.direction
            elif dimension == 'time_bucket':
                key = trade.time_bucket
            elif dimension == 'confidence_bucket':
                key = trade.confidence_bucket
            else:
                continue
            groups[key].append(trade)
        
        result = {}
        for key, trades in groups.items():
            wins = sum(1 for t in trades if t.result == "WIN")
            total_pnl = sum(t.pnl for t in trades)
            result[key] = {
                'total': len(trades),
                'wins': wins,
                'win_rate': wins / len(trades) if trades else 0,
                'total_pnl': total_pnl,
                'avg_pnl': total_pnl / len(trades) if trades else 0
            }
        
        return result
    
    def _get_rolling_stats(self, hours: int) -> Dict:
        """Get statistics for the last N hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        
        resolved = [
            t for t in self.trade_history 
            if t.result in ("WIN", "LOSS") and 
            datetime.fromisoformat(t.timestamp) >= cutoff
        ]
        
        if not resolved:
            return {'total': 0, 'wins': 0, 'win_rate': 0, 'total_pnl': 0}
        
        wins = sum(1 for t in resolved if t.result == "WIN")
        total_pnl = sum(t.pnl for t in resolved)
        
        return {
            'total': len(resolved),
            'wins': wins,
            'losses': len(resolved) - wins,
            'win_rate': wins / len(resolved),
            'total_pnl': total_pnl,
            'avg_pnl': total_pnl / len(resolved)
        }
    
    # =========================================================================
    # ADAPTIVE PARAMETER TUNING
    # =========================================================================
    
    def _run_adaptation(self):
        """
        Analyze performance and adjust parameters.
        This is the core learning loop.
        """
        self.log("Running adaptation cycle...", "ADAPT")
        self.trades_since_last_adaptation = 0
        
        # Get all resolved trades
        resolved = [t for t in self.trade_history if t.result in ("WIN", "LOSS")]
        if len(resolved) < MIN_SAMPLES_FOR_SIGNAL:
            self.log(f"Only {len(resolved)} resolved trades, need {MIN_SAMPLES_FOR_SIGNAL} for adaptation")
            return
        
        adaptations_made = []
        
        # 1. Adjust MIN_CONFIDENCE based on profitable confidence levels
        adaptations_made.extend(self._adapt_min_confidence())
        
        # 2. Adjust time bucket preferences
        adaptations_made.extend(self._adapt_time_preferences())
        
        # 3. Adjust asset modifiers
        adaptations_made.extend(self._adapt_asset_preferences())
        
        # 4. Adjust direction modifiers  
        adaptations_made.extend(self._adapt_direction_preferences())
        
        # 5. Update condition combo modifiers
        adaptations_made.extend(self._adapt_condition_combos())
        
        # Update version and save
        self.learned_params.version += 1
        self.learned_params.total_trades_analyzed = len(resolved)
        self._save_learned_params()
        self._save_performance_stats()
        
        if adaptations_made:
            self.log(f"Adaptation complete. Changes: {', '.join(adaptations_made)}", "ADAPT")
        else:
            self.log("Adaptation complete. No significant changes needed.", "ADAPT")
    
    def _adapt_min_confidence(self) -> List[str]:
        """Adjust minimum confidence threshold based on what's profitable"""
        adaptations = []
        
        # Get win rates by confidence bucket
        conf_stats = self._get_stats_by_dimension('confidence_bucket')
        
        # Find the lowest confidence bucket that's still profitable (>55% win rate)
        profitable_buckets = [
            (bucket, stats) for bucket, stats in conf_stats.items()
            if stats['total'] >= 10 and stats['win_rate'] >= 0.55
        ]
        
        if not profitable_buckets:
            # No profitable buckets with enough samples, raise threshold
            if self.learned_params.min_confidence < 0.5:
                new_min = min(self.learned_params.min_confidence + ADJUSTMENT_STEP, 0.5)
                if new_min != self.learned_params.min_confidence:
                    self.learned_params.min_confidence = new_min
                    adaptations.append(f"MIN_CONF↑{new_min:.0%}")
        else:
            # Find the lowest profitable bucket
            # Sort by bucket name to get ordering
            bucket_order = ["low_<30%", "med_30-50%", "high_50-70%", "very_high_>70%"]
            lowest_profitable = None
            for bucket_name in bucket_order:
                if any(b == bucket_name for b, _ in profitable_buckets):
                    lowest_profitable = bucket_name
                    break
            
            # Map bucket to threshold
            bucket_to_threshold = {
                "low_<30%": 0.20,
                "med_30-50%": 0.30,
                "high_50-70%": 0.50,
                "very_high_>70%": 0.70
            }
            
            if lowest_profitable:
                suggested_min = bucket_to_threshold.get(lowest_profitable, 0.30)
                
                # Gradual adjustment toward suggested
                if suggested_min < self.learned_params.min_confidence:
                    new_min = max(
                        self.learned_params.min_confidence - ADJUSTMENT_STEP,
                        suggested_min
                    )
                    if new_min != self.learned_params.min_confidence:
                        self.learned_params.min_confidence = new_min
                        adaptations.append(f"MIN_CONF↓{new_min:.0%}")
        
        return adaptations
    
    def _adapt_time_preferences(self) -> List[str]:
        """Adjust time bucket modifiers based on performance"""
        adaptations = []
        time_stats = self._get_stats_by_dimension('time_bucket')
        
        for bucket, stats in time_stats.items():
            if stats['total'] < MIN_SAMPLES_FOR_SIGNAL:
                continue
            
            current_mod = self.learned_params.preferred_time_buckets.get(bucket, 0.0)
            
            if stats['win_rate'] > BOOST_THRESHOLD:
                # Boost this time bucket
                new_mod = min(current_mod + ADJUSTMENT_STEP, MAX_CONFIDENCE_BOOST)
                if new_mod != current_mod:
                    self.learned_params.preferred_time_buckets[bucket] = new_mod
                    adaptations.append(f"{bucket}↑")
            elif stats['win_rate'] < REDUCE_THRESHOLD:
                # Reduce this time bucket
                new_mod = max(current_mod - ADJUSTMENT_STEP, -MAX_CONFIDENCE_PENALTY)
                if new_mod != current_mod:
                    self.learned_params.preferred_time_buckets[bucket] = new_mod
                    adaptations.append(f"{bucket}↓")
        
        return adaptations
    
    def _adapt_asset_preferences(self) -> List[str]:
        """Adjust asset modifiers based on performance"""
        adaptations = []
        asset_stats = self._get_stats_by_dimension('asset')
        
        for asset, stats in asset_stats.items():
            if stats['total'] < MIN_SAMPLES_FOR_SIGNAL:
                continue
            
            current_mod = self.learned_params.asset_modifiers.get(asset, 0.0)
            
            if stats['win_rate'] > BOOST_THRESHOLD:
                new_mod = min(current_mod + ADJUSTMENT_STEP, MAX_CONFIDENCE_BOOST)
                if new_mod != current_mod:
                    self.learned_params.asset_modifiers[asset] = new_mod
                    adaptations.append(f"{asset}↑")
            elif stats['win_rate'] < REDUCE_THRESHOLD:
                new_mod = max(current_mod - ADJUSTMENT_STEP, -MAX_CONFIDENCE_PENALTY)
                if new_mod != current_mod:
                    self.learned_params.asset_modifiers[asset] = new_mod
                    adaptations.append(f"{asset}↓")
        
        return adaptations
    
    def _adapt_direction_preferences(self) -> List[str]:
        """Adjust direction modifiers based on performance"""
        adaptations = []
        dir_stats = self._get_stats_by_dimension('direction')
        
        for direction, stats in dir_stats.items():
            if stats['total'] < MIN_SAMPLES_FOR_SIGNAL:
                continue
            
            current_mod = self.learned_params.direction_modifiers.get(direction, 0.0)
            
            if stats['win_rate'] > BOOST_THRESHOLD:
                new_mod = min(current_mod + ADJUSTMENT_STEP, MAX_CONFIDENCE_BOOST)
                if new_mod != current_mod:
                    self.learned_params.direction_modifiers[direction] = new_mod
                    adaptations.append(f"{direction}↑")
            elif stats['win_rate'] < REDUCE_THRESHOLD:
                new_mod = max(current_mod - ADJUSTMENT_STEP, -MAX_CONFIDENCE_PENALTY)
                if new_mod != current_mod:
                    self.learned_params.direction_modifiers[direction] = new_mod
                    adaptations.append(f"{direction}↓")
        
        return adaptations
    
    def _adapt_condition_combos(self) -> List[str]:
        """Adjust modifiers for condition combinations"""
        adaptations = []
        
        for condition, stats in self.condition_stats.items():
            if stats.total_trades < MIN_SAMPLES_FOR_SIGNAL:
                continue
            
            if '|' not in condition:
                continue  # Only process combos here
            
            current_mod = self.learned_params.condition_modifiers.get(condition, 0.0)
            
            if stats.win_rate > BOOST_THRESHOLD:
                new_mod = min(current_mod + ADJUSTMENT_STEP, MAX_CONFIDENCE_BOOST)
                if new_mod != current_mod:
                    self.learned_params.condition_modifiers[condition] = new_mod
                    adaptations.append(f"combo:{condition[:20]}↑")
            elif stats.win_rate < REDUCE_THRESHOLD:
                new_mod = max(current_mod - ADJUSTMENT_STEP, -MAX_CONFIDENCE_PENALTY)
                if new_mod != current_mod:
                    self.learned_params.condition_modifiers[condition] = new_mod
                    adaptations.append(f"combo:{condition[:20]}↓")
        
        return adaptations
    
    # =========================================================================
    # CONFIDENCE ADJUSTMENT (USED BY BOT)
    # =========================================================================
    
    def get_adjusted_confidence(self, 
                                asset: str, 
                                direction: str, 
                                base_confidence: float,
                                time_in_window: int) -> Tuple[float, Dict[str, float]]:
        """
        Get adjusted confidence for a potential trade based on learned patterns.
        Returns (adjusted_confidence, breakdown_dict)
        """
        adjustments = {}
        
        # Determine time bucket
        if time_in_window <= 180:
            time_bucket = "early_0-3m"
        elif time_in_window <= 420:
            time_bucket = "mid_3-7m"
        else:
            time_bucket = "late_7-14m"
        
        # Apply asset modifier
        asset_mod = self.learned_params.asset_modifiers.get(asset, 0.0)
        if asset_mod != 0:
            adjustments[f'asset:{asset}'] = asset_mod
        
        # Apply direction modifier
        dir_mod = self.learned_params.direction_modifiers.get(direction, 0.0)
        if dir_mod != 0:
            adjustments[f'direction:{direction}'] = dir_mod
        
        # Apply time bucket modifier
        time_mod = self.learned_params.preferred_time_buckets.get(time_bucket, 0.0)
        if time_mod != 0:
            adjustments[f'time:{time_bucket}'] = time_mod
        
        # Apply condition combo modifiers
        combos_to_check = [
            f"asset:{asset}|direction:{direction}",
            f"asset:{asset}|time:{time_bucket}",
            f"direction:{direction}|time:{time_bucket}",
        ]
        
        for combo in combos_to_check:
            combo_mod = self.learned_params.condition_modifiers.get(combo, 0.0)
            if combo_mod != 0:
                adjustments[f'combo:{combo}'] = combo_mod
        
        # Calculate final confidence
        total_adjustment = sum(adjustments.values())
        adjusted_confidence = base_confidence + total_adjustment
        
        # Clamp to valid range
        adjusted_confidence = max(0.0, min(1.0, adjusted_confidence))
        
        return adjusted_confidence, adjustments
    
    def should_skip_trade(self, 
                          asset: str, 
                          direction: str, 
                          adjusted_confidence: float) -> Tuple[bool, str]:
        """
        Determine if we should skip this trade based on learning.
        Returns (should_skip, reason)
        """
        # Check minimum confidence threshold
        if adjusted_confidence < self.learned_params.min_confidence:
            return True, f"Below min confidence ({self.learned_params.min_confidence:.0%})"
        
        # Check for heavily penalized conditions
        combo = f"asset:{asset}|direction:{direction}"
        if combo in self.learned_params.condition_modifiers:
            if self.learned_params.condition_modifiers[combo] <= -0.10:
                return True, f"Poor historical performance for {combo}"
        
        return False, ""
    
    # =========================================================================
    # REPORTING
    # =========================================================================
    
    def get_performance_report(self) -> str:
        """Generate a human-readable performance report"""
        overall = self._get_overall_stats()
        rolling_24h = self._get_rolling_stats(24)
        rolling_7d = self._get_rolling_stats(168)
        
        asset_stats = self._get_stats_by_dimension('asset')
        dir_stats = self._get_stats_by_dimension('direction')
        time_stats = self._get_stats_by_dimension('time_bucket')
        
        lines = [
            "=" * 60,
            "🧠 LEARNING ENGINE PERFORMANCE REPORT",
            "=" * 60,
            "",
            "📊 OVERALL STATS",
            f"   Total trades: {overall['total']}",
            f"   Win rate: {overall['win_rate']:.1%}",
            f"   Total P&L: ${overall['total_pnl']:.2f}",
            "",
            "📈 ROLLING STATS",
            f"   24h: {rolling_24h['total']} trades, {rolling_24h['win_rate']:.1%} WR, ${rolling_24h['total_pnl']:.2f}",
            f"   7d:  {rolling_7d['total']} trades, {rolling_7d['win_rate']:.1%} WR, ${rolling_7d['total_pnl']:.2f}",
            "",
            "🪙 BY ASSET",
        ]
        
        for asset, stats in asset_stats.items():
            mod = self.learned_params.asset_modifiers.get(asset, 0)
            mod_str = f" ({mod:+.0%})" if mod != 0 else ""
            lines.append(f"   {asset}: {stats['win_rate']:.1%} WR ({stats['total']} trades){mod_str}")
        
        lines.extend([
            "",
            "⬆️ BY DIRECTION",
        ])
        
        for direction, stats in dir_stats.items():
            mod = self.learned_params.direction_modifiers.get(direction, 0)
            mod_str = f" ({mod:+.0%})" if mod != 0 else ""
            lines.append(f"   {direction}: {stats['win_rate']:.1%} WR ({stats['total']} trades){mod_str}")
        
        lines.extend([
            "",
            "⏱️ BY TIME BUCKET",
        ])
        
        for bucket, stats in time_stats.items():
            mod = self.learned_params.preferred_time_buckets.get(bucket, 0)
            mod_str = f" ({mod:+.0%})" if mod != 0 else ""
            lines.append(f"   {bucket}: {stats['win_rate']:.1%} WR ({stats['total']} trades){mod_str}")
        
        lines.extend([
            "",
            "🔧 LEARNED PARAMETERS",
            f"   Min confidence: {self.learned_params.min_confidence:.0%}",
            f"   Version: {self.learned_params.version}",
            f"   Last updated: {self.learned_params.last_updated}",
            "=" * 60,
        ])
        
        return "\n".join(lines)


# ============================================================================
# STANDALONE USAGE
# ============================================================================

if __name__ == "__main__":
    # Test the learning engine
    engine = LearningEngine()
    print(engine.get_performance_report())
