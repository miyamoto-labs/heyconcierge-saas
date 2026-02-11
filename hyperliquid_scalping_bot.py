#!/usr/bin/env python3
"""
🚀 HYPERLIQUID AGGRESSIVE SCALPING BOT 🚀
Built for PROFIT - Multiple trades per day

Target: 5-15 trades/day, 55-65% win rate, $3-10/day on $100 capital
Strategies: Momentum, Range, Breakout, Orderbook Imbalance, Volume Spike

⚠️  WARNING: LIVE TRADING WITH REAL MONEY
This bot is AGGRESSIVE - trades frequently with tight stops

🧠 ADAPTIVE LEARNING LAYER
- Tracks all trades with full context
- Analyzes performance every 20 trades
- Auto-adjusts position sizing, stops, and confidence thresholds
- Learns which conditions correlate with profits
"""

import json
import time
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
import traceback
import statistics

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

# Import the learning layer
try:
    from hyperliquid_learning_layer import LearningLayerManager
    LEARNING_ENABLED = True
except ImportError:
    LEARNING_ENABLED = False
    print("⚠️ Learning layer not found - running without adaptive learning")


class TradeSide(Enum):
    LONG = "LONG"
    SHORT = "SHORT"


class SignalType(Enum):
    MOMENTUM = "MOMENTUM"
    RANGE = "RANGE"
    BREAKOUT = "BREAKOUT"
    ORDERBOOK = "ORDERBOOK"
    VOLUME_SPIKE = "VOLUME_SPIKE"
    WHALE_MODE = "WHALE_MODE"  # 🐋 Big position on extreme volume


@dataclass
class ScalpingSignal:
    """Represents a scalping trading signal"""
    signal_type: SignalType
    side: TradeSide
    confidence: float  # 0-100
    entry_price: float
    stop_loss: float
    take_profit: float
    leverage: int
    reasons: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    timeframe: str = "5m"


@dataclass
class RiskState:
    """Tracks risk management state"""
    daily_pnl: float = 0.0
    daily_trades: int = 0
    consecutive_losses: int = 0
    peak_balance: float = 0.0
    last_trade_time: Optional[str] = None
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    open_positions: Dict = field(default_factory=dict)
    paused_until: Optional[str] = None
    last_reset_date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))


class ScalpingConfig:
    """Aggressive scalping configuration"""
    
    # === RISK MANAGEMENT (CRITICAL) ===
    # For small accounts ($100), we need larger position % to meet minimums
    MAX_POSITION_SIZE_PCT = 10.0     # 10% of capital per trade ($10 on $100)
    MAX_STOP_LOSS_PCT = 1.5          # 1.5% max loss per trade
    MAX_POSITIONS = 2                 # Max 2 concurrent positions (smaller account)
    DAILY_LOSS_LIMIT = 15.0          # $15 daily loss limit (15% of capital)
    MAX_CONSECUTIVE_LOSSES = 4       # Pause after 4 losses
    PAUSE_DURATION_MINUTES = 30      # Pause for 30 min after loss streak
    MAX_DRAWDOWN_PCT = 25.0          # Max 25% drawdown from peak
    
    # Minimum position in USD (to ensure we meet Hyperliquid minimums)
    MIN_POSITION_USD = 10.0          # At least $10 per trade
    
    # === SIGNAL THRESHOLDS ===
    MIN_CONFIDENCE_MOMENTUM = 55     # Momentum signals (aggressive)
    MIN_CONFIDENCE_RANGE = 55        # Range trading signals
    MIN_CONFIDENCE_BREAKOUT = 60     # Breakout signals (need more confidence)
    MIN_CONFIDENCE_ORDERBOOK = 50    # Orderbook signals (very aggressive)
    MIN_CONFIDENCE_VOLUME = 55       # Volume spike signals
    
    # === TIMEFRAMES ===
    PRIMARY_TIMEFRAME = "5m"         # Main analysis
    CONFIRMATION_TIMEFRAME = "15m"   # Confirmation
    FAST_TIMEFRAME = "1m"            # Quick signals
    
    # === TRADE PARAMETERS ===
    DEFAULT_LEVERAGE = 10            # Higher leverage to make size viable
    MAX_LEVERAGE = 15                # Cap leverage
    
    # Stop/Target per strategy (as % of entry)
    MOMENTUM_STOP = 0.8              # 0.8% stop
    MOMENTUM_TARGET = 1.0            # 1.0% target (R:R = 1.25)
    
    RANGE_STOP = 0.5                 # 0.5% stop (tight)
    RANGE_TARGET = 0.8               # 0.8% target (R:R = 1.6)
    
    BREAKOUT_STOP = 1.0              # 1% stop
    BREAKOUT_TARGET = 1.5            # 1.5% target (R:R = 1.5)
    
    ORDERBOOK_STOP = 0.5             # 0.5% stop (very tight)
    ORDERBOOK_TARGET = 0.6           # 0.6% target (R:R = 1.2)
    
    VOLUME_STOP = 0.7                # 0.7% stop
    VOLUME_TARGET = 1.2              # 1.2% target (R:R = 1.7)
    
    # === 🐋 WHALE MODE - GO BIG ON EXTREME VOLUME ===
    WHALE_VOLUME_MULTIPLIER = 2.5    # Volume > 2.5x average = WHALE MODE
    WHALE_POSITION_MULTIPLIER = 2.0  # 2x normal position size
    WHALE_STOP = 1.2                 # 1.2% stop (wider for runners)
    WHALE_TARGET = 3.0               # 3% target (let it run!)
    WHALE_TRAILING_STOP = True       # Use trailing stop
    WHALE_TRAILING_PCT = 1.0         # Trail by 1%
    WHALE_MAX_HOLD_MINUTES = 30      # Hold up to 30 min for big moves
    WHALE_MIN_CONFIDENCE = 70        # Need high confidence for whale trades
    
    # === POLLING ===
    CHECK_INTERVAL_SECONDS = 45      # Check every 45 seconds
    POSITION_CHECK_INTERVAL = 15     # Check positions every 15 sec
    
    # === INDICATORS ===
    RSI_PERIOD = 7                   # Faster RSI
    RSI_OVERSOLD = 30                # Aggressive oversold
    RSI_OVERBOUGHT = 70              # Aggressive overbought
    EMA_FAST = 5                     # Fast EMA
    EMA_SLOW = 13                    # Slow EMA
    VOLUME_SPIKE_MULTIPLIER = 1.5    # Volume > 1.5x average = spike
    ORDERBOOK_IMBALANCE_RATIO = 0.6  # 60/40 imbalance = signal


class MarketData:
    """Handles market data fetching and caching"""
    
    def __init__(self, info: Info):
        self.info = info
        self.cache = {}
        self.cache_time = {}
        self.cache_duration = 10  # 10 second cache
        self.funding_cache = {}
        self.funding_cache_time = {}
    
    def get_price(self, asset: str = "BTC") -> Optional[float]:
        """Get current mid price"""
        try:
            mids = self.info.all_mids()
            return float(mids.get(asset, 0))
        except Exception as e:
            print(f"❌ Price fetch error: {e}")
            return None
    
    def get_funding_rate(self, asset: str = "BTC") -> Optional[float]:
        """Get current funding rate for an asset"""
        cache_key = f"funding_{asset}"
        now = time.time()
        
        # Cache funding rate for 60 seconds
        if cache_key in self.funding_cache and now - self.funding_cache_time.get(cache_key, 0) < 60:
            return self.funding_cache[cache_key]
        
        try:
            # Get meta and asset contexts
            meta = self.info.meta()
            contexts = self.info.meta_and_asset_ctxs()
            
            if contexts and len(contexts) > 1:
                asset_ctxs = contexts[1]
                # Find the asset
                for i, universe_item in enumerate(meta.get("universe", [])):
                    if universe_item.get("name") == asset:
                        if i < len(asset_ctxs):
                            funding = float(asset_ctxs[i].get("funding", 0))
                            self.funding_cache[cache_key] = funding
                            self.funding_cache_time[cache_key] = now
                            return funding
            return 0.0
        except Exception as e:
            print(f"⚠️ Funding rate fetch error: {e}")
            return 0.0
    
    def get_candles(self, asset: str, timeframe: str, bars: int = 100) -> Optional[List[Dict]]:
        """Fetch candles with caching"""
        cache_key = f"{asset}_{timeframe}"
        now = time.time()
        
        # Check cache
        if cache_key in self.cache and now - self.cache_time.get(cache_key, 0) < self.cache_duration:
            return self.cache[cache_key]
        
        try:
            now_ms = int(now * 1000)
            
            # Calculate lookback
            tf_minutes = {"1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240}
            minutes = tf_minutes.get(timeframe, 5)
            lookback_ms = bars * minutes * 60 * 1000
            
            candles = self.info.candles_snapshot(asset, timeframe, now_ms - lookback_ms, now_ms)
            
            if candles:
                self.cache[cache_key] = candles
                self.cache_time[cache_key] = now
            
            return candles
        except Exception as e:
            print(f"❌ Candle fetch error ({timeframe}): {e}")
            return None
    
    def get_orderbook(self, asset: str = "BTC") -> Optional[Dict]:
        """Get L2 orderbook snapshot"""
        try:
            l2 = self.info.l2_snapshot(asset)
            return l2
        except Exception as e:
            print(f"❌ Orderbook fetch error: {e}")
            return None


class TechnicalAnalysis:
    """Technical indicators for scalping"""
    
    @staticmethod
    def calculate_rsi(closes: List[float], period: int = 7) -> Optional[float]:
        """Fast RSI calculation"""
        if len(closes) < period + 1:
            return None
        
        deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
        gains = [max(d, 0) for d in deltas[-period:]]
        losses = [max(-d, 0) for d in deltas[-period:]]
        
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> Optional[float]:
        """EMA calculation"""
        if len(prices) < period:
            return None
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period
        
        for price in prices[period:]:
            ema = (price - ema) * multiplier + ema
        
        return ema
    
    @staticmethod
    def calculate_bollinger_bands(closes: List[float], period: int = 20, std_dev: float = 2.0) -> Optional[Tuple[float, float, float]]:
        """Bollinger Bands for range trading"""
        if len(closes) < period:
            return None
        
        recent = closes[-period:]
        middle = statistics.mean(recent)
        std = statistics.stdev(recent)
        
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        
        return lower, middle, upper
    
    @staticmethod
    def calculate_atr(candles: List[Dict], period: int = 14) -> Optional[float]:
        """Average True Range for volatility"""
        if len(candles) < period + 1:
            return None
        
        true_ranges = []
        for i in range(1, len(candles)):
            high = float(candles[i]['h'])
            low = float(candles[i]['l'])
            prev_close = float(candles[i-1]['c'])
            
            tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
            true_ranges.append(tr)
        
        return statistics.mean(true_ranges[-period:])
    
    @staticmethod
    def detect_support_resistance(candles: List[Dict], lookback: int = 20) -> Tuple[List[float], List[float]]:
        """Detect recent support and resistance levels"""
        highs = [float(c['h']) for c in candles[-lookback:]]
        lows = [float(c['l']) for c in candles[-lookback:]]
        
        # Simple approach: recent swing highs/lows
        resistances = []
        supports = []
        
        for i in range(2, len(highs) - 2):
            # Swing high
            if highs[i] > highs[i-1] and highs[i] > highs[i-2] and highs[i] > highs[i+1] and highs[i] > highs[i+2]:
                resistances.append(highs[i])
            # Swing low
            if lows[i] < lows[i-1] and lows[i] < lows[i-2] and lows[i] < lows[i+1] and lows[i] < lows[i+2]:
                supports.append(lows[i])
        
        return supports, resistances
    
    @staticmethod
    def detect_volume_spike(candles: List[Dict], lookback: int = 20) -> Tuple[bool, float]:
        """Detect volume spike"""
        if len(candles) < lookback + 1:
            return False, 0.0
        
        volumes = [float(c['v']) for c in candles[-(lookback+1):-1]]
        current_volume = float(candles[-1]['v'])
        avg_volume = statistics.mean(volumes)
        
        if avg_volume == 0:
            return False, 0.0
        
        ratio = current_volume / avg_volume
        is_spike = ratio >= ScalpingConfig.VOLUME_SPIKE_MULTIPLIER
        
        return is_spike, ratio


class MomentumStrategy:
    """Momentum scalping: ride short-term trends"""
    
    @staticmethod
    def generate_signal(candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate momentum signal"""
        if not candles or len(candles) < 30:
            return None
        
        closes = [float(c['c']) for c in candles]
        
        # Calculate indicators
        rsi = TechnicalAnalysis.calculate_rsi(closes, ScalpingConfig.RSI_PERIOD)
        ema_fast = TechnicalAnalysis.calculate_ema(closes, ScalpingConfig.EMA_FAST)
        ema_slow = TechnicalAnalysis.calculate_ema(closes, ScalpingConfig.EMA_SLOW)
        
        if None in [rsi, ema_fast, ema_slow]:
            return None
        
        confidence = 0
        reasons = []
        side = None
        
        # === LONG MOMENTUM ===
        if ema_fast > ema_slow:  # Bullish trend
            confidence += 25
            reasons.append(f"EMA bullish ({ema_fast:.0f} > {ema_slow:.0f})")
            
            if current_price > ema_fast:  # Price above both EMAs
                confidence += 15
                reasons.append("Price above fast EMA")
            
            if rsi > 50 and rsi < ScalpingConfig.RSI_OVERBOUGHT:  # Bullish momentum, not overbought
                confidence += 20
                reasons.append(f"RSI momentum ({rsi:.1f})")
            
            # Recent price action bullish
            if closes[-1] > closes[-2] > closes[-3]:
                confidence += 15
                reasons.append("3 consecutive bullish candles")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_MOMENTUM:
                side = TradeSide.LONG
        
        # === SHORT MOMENTUM ===
        elif ema_fast < ema_slow:  # Bearish trend
            confidence += 25
            reasons.append(f"EMA bearish ({ema_fast:.0f} < {ema_slow:.0f})")
            
            if current_price < ema_fast:
                confidence += 15
                reasons.append("Price below fast EMA")
            
            if rsi < 50 and rsi > ScalpingConfig.RSI_OVERSOLD:
                confidence += 20
                reasons.append(f"RSI momentum ({rsi:.1f})")
            
            if closes[-1] < closes[-2] < closes[-3]:
                confidence += 15
                reasons.append("3 consecutive bearish candles")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_MOMENTUM:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        # Calculate stops and targets
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - ScalpingConfig.MOMENTUM_STOP / 100)
            take_profit = current_price * (1 + ScalpingConfig.MOMENTUM_TARGET / 100)
        else:
            stop_loss = current_price * (1 + ScalpingConfig.MOMENTUM_STOP / 100)
            take_profit = current_price * (1 - ScalpingConfig.MOMENTUM_TARGET / 100)
        
        return ScalpingSignal(
            signal_type=SignalType.MOMENTUM,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=ScalpingConfig.DEFAULT_LEVERAGE,
            reasons=reasons
        )


class RangeStrategy:
    """Range trading: buy support, sell resistance"""
    
    @staticmethod
    def generate_signal(candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate range trading signal"""
        if not candles or len(candles) < 30:
            return None
        
        closes = [float(c['c']) for c in candles]
        
        # Get Bollinger Bands
        bb = TechnicalAnalysis.calculate_bollinger_bands(closes, period=20, std_dev=2.0)
        if not bb:
            return None
        
        lower, middle, upper = bb
        rsi = TechnicalAnalysis.calculate_rsi(closes, ScalpingConfig.RSI_PERIOD)
        
        if rsi is None:
            return None
        
        confidence = 0
        reasons = []
        side = None
        
        # Calculate price position in range
        range_size = upper - lower
        if range_size == 0:
            return None
        
        price_position = (current_price - lower) / range_size  # 0 = at lower, 1 = at upper
        
        # === LONG at support ===
        if price_position < 0.15:  # Price near lower band (15%)
            confidence += 35
            reasons.append(f"Price at lower Bollinger ({price_position:.1%})")
            
            if rsi < 40:
                confidence += 25
                reasons.append(f"RSI oversold ({rsi:.1f})")
            
            # Check for bounce
            if closes[-1] > closes[-2]:
                confidence += 15
                reasons.append("Bounce forming")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_RANGE:
                side = TradeSide.LONG
        
        # === SHORT at resistance ===
        elif price_position > 0.85:  # Price near upper band
            confidence += 35
            reasons.append(f"Price at upper Bollinger ({price_position:.1%})")
            
            if rsi > 60:
                confidence += 25
                reasons.append(f"RSI overbought ({rsi:.1f})")
            
            if closes[-1] < closes[-2]:
                confidence += 15
                reasons.append("Rejection forming")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_RANGE:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        # Tight stops for range trading
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - ScalpingConfig.RANGE_STOP / 100)
            take_profit = middle  # Target middle of range
        else:
            stop_loss = current_price * (1 + ScalpingConfig.RANGE_STOP / 100)
            take_profit = middle
        
        return ScalpingSignal(
            signal_type=SignalType.RANGE,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=ScalpingConfig.DEFAULT_LEVERAGE,
            reasons=reasons
        )


class BreakoutStrategy:
    """Breakout trading: catch volatility spikes"""
    
    @staticmethod
    def generate_signal(candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate breakout signal"""
        if not candles or len(candles) < 30:
            return None
        
        closes = [float(c['c']) for c in candles]
        highs = [float(c['h']) for c in candles]
        lows = [float(c['l']) for c in candles]
        
        # Get recent range (last 20 candles)
        lookback = 20
        recent_high = max(highs[-lookback:-1])  # Exclude current
        recent_low = min(lows[-lookback:-1])
        
        # ATR for volatility
        atr = TechnicalAnalysis.calculate_atr(candles)
        if not atr:
            return None
        
        # Volume spike detection
        is_volume_spike, volume_ratio = TechnicalAnalysis.detect_volume_spike(candles)
        
        confidence = 0
        reasons = []
        side = None
        
        # === BULLISH BREAKOUT ===
        if current_price > recent_high:
            breakout_pct = ((current_price - recent_high) / recent_high) * 100
            confidence += 30
            reasons.append(f"Broke {lookback}-bar high (${recent_high:.0f})")
            
            if breakout_pct > 0.3:  # Strong breakout
                confidence += 15
                reasons.append(f"Strong breakout ({breakout_pct:.2f}%)")
            
            if is_volume_spike:
                confidence += 20
                reasons.append(f"Volume spike ({volume_ratio:.1f}x)")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_BREAKOUT:
                side = TradeSide.LONG
        
        # === BEARISH BREAKOUT ===
        elif current_price < recent_low:
            breakout_pct = ((recent_low - current_price) / recent_low) * 100
            confidence += 30
            reasons.append(f"Broke {lookback}-bar low (${recent_low:.0f})")
            
            if breakout_pct > 0.3:
                confidence += 15
                reasons.append(f"Strong breakdown ({breakout_pct:.2f}%)")
            
            if is_volume_spike:
                confidence += 20
                reasons.append(f"Volume spike ({volume_ratio:.1f}x)")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_BREAKOUT:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        # Wider stops for breakout
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - ScalpingConfig.BREAKOUT_STOP / 100)
            take_profit = current_price * (1 + ScalpingConfig.BREAKOUT_TARGET / 100)
        else:
            stop_loss = current_price * (1 + ScalpingConfig.BREAKOUT_STOP / 100)
            take_profit = current_price * (1 - ScalpingConfig.BREAKOUT_TARGET / 100)
        
        return ScalpingSignal(
            signal_type=SignalType.BREAKOUT,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=ScalpingConfig.DEFAULT_LEVERAGE,
            reasons=reasons
        )


class OrderbookStrategy:
    """Orderbook imbalance: trade with the flow"""
    
    @staticmethod
    def generate_signal(orderbook: Dict, current_price: float) -> Optional[ScalpingSignal]:
        """Generate signal from orderbook imbalance"""
        if not orderbook:
            return None
        
        levels = orderbook.get("levels", [[], []])
        if len(levels) < 2:
            return None
        
        bids = levels[0]  # Buy orders
        asks = levels[1]  # Sell orders
        
        if not bids or not asks:
            return None
        
        # Calculate total bid/ask depth (top 10 levels)
        bid_depth = sum(float(b['sz']) * float(b['px']) for b in bids[:10])
        ask_depth = sum(float(a['sz']) * float(a['px']) for a in asks[:10])
        
        total_depth = bid_depth + ask_depth
        if total_depth == 0:
            return None
        
        bid_ratio = bid_depth / total_depth
        ask_ratio = ask_depth / total_depth
        
        confidence = 0
        reasons = []
        side = None
        
        # === BID IMBALANCE (Bullish) ===
        if bid_ratio > ScalpingConfig.ORDERBOOK_IMBALANCE_RATIO:
            confidence += 35
            reasons.append(f"Bid imbalance ({bid_ratio:.1%} bids)")
            
            # Strong imbalance
            if bid_ratio > 0.7:
                confidence += 20
                reasons.append("Strong buying pressure")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_ORDERBOOK:
                side = TradeSide.LONG
        
        # === ASK IMBALANCE (Bearish) ===
        elif ask_ratio > ScalpingConfig.ORDERBOOK_IMBALANCE_RATIO:
            confidence += 35
            reasons.append(f"Ask imbalance ({ask_ratio:.1%} asks)")
            
            if ask_ratio > 0.7:
                confidence += 20
                reasons.append("Strong selling pressure")
            
            if confidence >= ScalpingConfig.MIN_CONFIDENCE_ORDERBOOK:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        # Very tight stops for orderbook signals
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - ScalpingConfig.ORDERBOOK_STOP / 100)
            take_profit = current_price * (1 + ScalpingConfig.ORDERBOOK_TARGET / 100)
        else:
            stop_loss = current_price * (1 + ScalpingConfig.ORDERBOOK_STOP / 100)
            take_profit = current_price * (1 - ScalpingConfig.ORDERBOOK_TARGET / 100)
        
        return ScalpingSignal(
            signal_type=SignalType.ORDERBOOK,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=ScalpingConfig.DEFAULT_LEVERAGE,
            reasons=reasons
        )


class VolumeSpikeStrategy:
    """Volume spike detection: trade high activity"""
    
    @staticmethod
    def generate_signal(candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate signal from volume spike - includes 🐋 WHALE MODE"""
        if not candles or len(candles) < 25:
            return None
        
        is_spike, volume_ratio = TechnicalAnalysis.detect_volume_spike(candles)
        
        if not is_spike:
            return None
        
        # 🐋 WHALE MODE CHECK - Extreme volume = go big
        is_whale_mode = volume_ratio >= ScalpingConfig.WHALE_VOLUME_MULTIPLIER
        
        closes = [float(c['c']) for c in candles]
        current_candle = candles[-1]
        
        candle_open = float(current_candle['o'])
        candle_close = float(current_candle['c'])
        candle_high = float(current_candle['h'])
        candle_low = float(current_candle['l'])
        
        confidence = 0
        reasons = []
        
        if is_whale_mode:
            reasons.append(f"🐋 WHALE MODE ({volume_ratio:.1f}x volume)")
        else:
            reasons.append(f"Volume spike ({volume_ratio:.1f}x average)")
        
        side = None
        
        # Determine direction from candle
        is_bullish_candle = candle_close > candle_open
        candle_body = abs(candle_close - candle_open)
        candle_range = candle_high - candle_low
        
        if candle_range == 0:
            return None
        
        body_ratio = candle_body / candle_range
        
        # === BULLISH VOLUME SPIKE ===
        if is_bullish_candle:
            confidence += 30
            reasons.append("Bullish candle with volume")
            
            if body_ratio > 0.6:  # Strong body
                confidence += 15
                reasons.append(f"Strong bullish body ({body_ratio:.1%})")
            
            if volume_ratio > 2.0:  # Very high volume
                confidence += 15
                reasons.append("Exceptional volume")
            
            if is_whale_mode:  # 🐋 Extra confidence for whale mode
                confidence += 20
                reasons.append("Extreme volume conviction")
            
            min_conf = ScalpingConfig.WHALE_MIN_CONFIDENCE if is_whale_mode else ScalpingConfig.MIN_CONFIDENCE_VOLUME
            if confidence >= min_conf:
                side = TradeSide.LONG
        
        # === BEARISH VOLUME SPIKE ===
        else:
            confidence += 30
            reasons.append("Bearish candle with volume")
            
            if body_ratio > 0.6:
                confidence += 15
                reasons.append(f"Strong bearish body ({body_ratio:.1%})")
            
            if volume_ratio > 2.0:
                confidence += 15
                reasons.append("Exceptional volume")
            
            if is_whale_mode:  # 🐋 Extra confidence for whale mode
                confidence += 20
                reasons.append("Extreme volume conviction")
            
            min_conf = ScalpingConfig.WHALE_MIN_CONFIDENCE if is_whale_mode else ScalpingConfig.MIN_CONFIDENCE_VOLUME
            if confidence >= min_conf:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        # 🐋 Use whale mode stops/targets for bigger runs
        if is_whale_mode:
            stop_pct = ScalpingConfig.WHALE_STOP
            target_pct = ScalpingConfig.WHALE_TARGET
            signal_type = SignalType.WHALE_MODE
        else:
            stop_pct = ScalpingConfig.VOLUME_STOP
            target_pct = ScalpingConfig.VOLUME_TARGET
            signal_type = SignalType.VOLUME_SPIKE
        
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - stop_pct / 100)
            take_profit = current_price * (1 + target_pct / 100)
        else:
            stop_loss = current_price * (1 + stop_pct / 100)
            take_profit = current_price * (1 - target_pct / 100)
        
        return ScalpingSignal(
            signal_type=signal_type,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=ScalpingConfig.DEFAULT_LEVERAGE,
            reasons=reasons
        )


class RiskManager:
    """Strict risk management for scalping"""
    
    def __init__(self, state: RiskState):
        self.state = state
    
    def can_trade(self, balance: float) -> Tuple[bool, str]:
        """Check if trading is allowed"""
        
        # Reset daily stats if new day
        today = datetime.now().strftime("%Y-%m-%d")
        if self.state.last_reset_date != today:
            self.state.daily_pnl = 0.0
            self.state.daily_trades = 0
            self.state.last_reset_date = today
        
        # Check pause status
        if self.state.paused_until:
            pause_time = datetime.fromisoformat(self.state.paused_until)
            if datetime.now() < pause_time:
                remaining = (pause_time - datetime.now()).seconds // 60
                return False, f"Paused for {remaining} more minutes"
            else:
                self.state.paused_until = None
                self.state.consecutive_losses = 0
        
        # Daily loss limit
        if self.state.daily_pnl <= -ScalpingConfig.DAILY_LOSS_LIMIT:
            return False, f"Daily loss limit hit (${abs(self.state.daily_pnl):.2f})"
        
        # Consecutive losses
        if self.state.consecutive_losses >= ScalpingConfig.MAX_CONSECUTIVE_LOSSES:
            pause_until = datetime.now() + timedelta(minutes=ScalpingConfig.PAUSE_DURATION_MINUTES)
            self.state.paused_until = pause_until.isoformat()
            return False, f"Max consecutive losses ({self.state.consecutive_losses}), pausing"
        
        # Max positions
        if len(self.state.open_positions) >= ScalpingConfig.MAX_POSITIONS:
            return False, f"Max positions ({ScalpingConfig.MAX_POSITIONS})"
        
        # Max drawdown
        if self.state.peak_balance > 0:
            drawdown = ((self.state.peak_balance - balance) / self.state.peak_balance) * 100
            if drawdown >= ScalpingConfig.MAX_DRAWDOWN_PCT:
                return False, f"Max drawdown ({drawdown:.1f}%)"
        
        return True, "OK"
    
    def calculate_position_size(self, balance: float, leverage: int) -> float:
        """Calculate safe position size"""
        position_pct = ScalpingConfig.MAX_POSITION_SIZE_PCT / 100
        position_size = balance * position_pct
        
        # Ensure minimum position size for Hyperliquid
        position_size = max(position_size, ScalpingConfig.MIN_POSITION_USD)
        
        # Cap at 15% of balance for safety
        max_position = balance * 0.15
        position_size = min(position_size, max_position)
        
        return position_size
    
    def update_peak_balance(self, balance: float):
        """Track peak balance for drawdown"""
        if balance > self.state.peak_balance:
            self.state.peak_balance = balance
    
    def record_trade_result(self, pnl: float, is_win: bool):
        """Record trade result"""
        self.state.daily_pnl += pnl
        self.state.total_trades += 1
        self.state.daily_trades += 1
        
        if is_win:
            self.state.winning_trades += 1
            self.state.consecutive_losses = 0
        else:
            self.state.losing_trades += 1
            self.state.consecutive_losses += 1


class HyperliquidScalpingBot:
    """Main aggressive scalping bot with adaptive learning"""
    
    def __init__(self, config_file: str = ".hyperliquid_config.json"):
        print("=" * 70)
        print("🚀 HYPERLIQUID AGGRESSIVE SCALPING BOT v2.0 🚀")
        print("🧠 WITH ADAPTIVE LEARNING LAYER")
        print("=" * 70)
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Load Hyperliquid credentials
        print("\n🔑 Loading credentials...")
        with open(config_file, 'r') as f:
            hl_config = json.load(f)
        
        self.wallet_address = hl_config["public_wallet"]
        self.api_key = hl_config["api_private_key"]
        
        # Initialize API
        print("🔌 Connecting to Hyperliquid...")
        self.info = Info(skip_ws=True)
        
        # Live trading setup
        account = Account.from_key(self.api_key)
        self.exchange = Exchange(account, account_address=self.wallet_address)
        
        # Initialize components
        self.market_data = MarketData(self.info)
        self.risk_state = self._load_state()
        self.risk_manager = RiskManager(self.risk_state)
        
        # Initialize learning layer
        if LEARNING_ENABLED:
            self.learning = LearningLayerManager(
                history_file="hyperliquid_trade_history.json",
                params_file="hyperliquid_learned_params.json"
            )
            print("🧠 Learning layer: ENABLED")
        else:
            self.learning = None
            print("⚠️ Learning layer: DISABLED")
        
        # State
        self.running = True
        self.last_signal_check = time.time()
        self.last_position_check = time.time()
        self.signals_generated = 0
        self.trades_executed = 0
        self.current_trade_id = None  # Track current trade for exit recording
        self.last_rsi = None  # Cache RSI at signal time
        self.last_volume_ratio = None  # Cache volume ratio at signal time
        
        print(f"✅ Connected to Hyperliquid MAINNET")
        print(f"💰 Account: {self.wallet_address[:10]}...{self.wallet_address[-8:]}")
        
        # Get initial balance
        balance = self.get_account_balance()
        if balance:
            self.risk_manager.update_peak_balance(balance)
            print(f"💵 Balance: ${balance:.2f}")
        
        print("\n" + "=" * 70)
        print("📊 SCALPING CONFIG (SMALL ACCOUNT OPTIMIZED):")
        print(f"   • Position Size: {ScalpingConfig.MAX_POSITION_SIZE_PCT}% (min ${ScalpingConfig.MIN_POSITION_USD})")
        print(f"   • Max Stop Loss: {ScalpingConfig.MAX_STOP_LOSS_PCT}%")
        print(f"   • Max Positions: {ScalpingConfig.MAX_POSITIONS}")
        print(f"   • Daily Loss Limit: ${ScalpingConfig.DAILY_LOSS_LIMIT}")
        print(f"   • Default Leverage: {ScalpingConfig.DEFAULT_LEVERAGE}x")
        print(f"   • Check Interval: {ScalpingConfig.CHECK_INTERVAL_SECONDS}s")
        
        # Show learned params if available
        if self.learning:
            params = self.learning.get_current_params()
            print(f"\n🧠 LEARNED PARAMS (v{params.version}):")
            print(f"   • Position multiplier: {params.overall_size_multiplier:.2f}x")
            print(f"   • Strategy adjustments: {dict((k, f'{v:+.0f}') for k, v in params.strategy_adjustments.items() if v != 0)}")
        
        print("=" * 70 + "\n")
    
    def _load_state(self) -> RiskState:
        """Load or create risk state"""
        state_file = "scalping_state.json"
        if os.path.exists(state_file):
            try:
                with open(state_file, 'r') as f:
                    data = json.load(f)
                    return RiskState(**data)
            except:
                pass
        return RiskState()
    
    def _save_state(self):
        """Save risk state"""
        state_file = "scalping_state.json"
        try:
            with open(state_file, 'w') as f:
                json.dump({
                    "daily_pnl": self.risk_state.daily_pnl,
                    "daily_trades": self.risk_state.daily_trades,
                    "consecutive_losses": self.risk_state.consecutive_losses,
                    "peak_balance": self.risk_state.peak_balance,
                    "last_trade_time": self.risk_state.last_trade_time,
                    "total_trades": self.risk_state.total_trades,
                    "winning_trades": self.risk_state.winning_trades,
                    "losing_trades": self.risk_state.losing_trades,
                    "open_positions": self.risk_state.open_positions,
                    "paused_until": self.risk_state.paused_until,
                    "last_reset_date": self.risk_state.last_reset_date
                }, f, indent=2)
        except Exception as e:
            print(f"⚠️ State save error: {e}")
    
    def get_account_balance(self) -> Optional[float]:
        """Get current account balance"""
        try:
            user_state = self.info.user_state(self.wallet_address)
            margin_summary = user_state.get("marginSummary", {})
            return float(margin_summary.get("accountValue", 0))
        except Exception as e:
            print(f"❌ Balance error: {e}")
            return None
    
    def sync_positions(self) -> Dict:
        """Sync open positions from Hyperliquid"""
        try:
            user_state = self.info.user_state(self.wallet_address)
            positions = {}
            
            for asset_pos in user_state.get("assetPositions", []):
                pos = asset_pos.get("position", {})
                coin = pos.get("coin")
                size = float(pos.get("szi", 0))
                
                if size != 0:
                    positions[coin] = {
                        "coin": coin,
                        "size": size,
                        "side": "LONG" if size > 0 else "SHORT",
                        "entry_price": float(pos.get("entryPx", 0)),
                        "unrealized_pnl": float(pos.get("unrealizedPnl", 0)),
                        "leverage": float(pos.get("leverage", {}).get("value", 1))
                    }
            
            self.risk_state.open_positions = positions
            return positions
        except Exception as e:
            print(f"❌ Position sync error: {e}")
            return {}
    
    def generate_signals(self, asset: str = "BTC") -> List[ScalpingSignal]:
        """Generate signals from all strategies and cache context data"""
        signals = []
        
        # Get market data
        current_price = self.market_data.get_price(asset)
        if not current_price:
            return signals
        
        candles_5m = self.market_data.get_candles(asset, "5m", bars=50)
        candles_1m = self.market_data.get_candles(asset, "1m", bars=50)
        orderbook = self.market_data.get_orderbook(asset)
        
        # Cache RSI and volume ratio for trade recording
        self.last_rsi = None
        self.last_volume_ratio = None
        
        if candles_5m:
            closes = [float(c['c']) for c in candles_5m]
            self.last_rsi = TechnicalAnalysis.calculate_rsi(closes, ScalpingConfig.RSI_PERIOD)
        
        if candles_1m:
            _, self.last_volume_ratio = TechnicalAnalysis.detect_volume_spike(candles_1m)
        
        # 1. Momentum Strategy (5m)
        if candles_5m:
            signal = MomentumStrategy.generate_signal(candles_5m, current_price)
            if signal:
                signal.timeframe = "5m"
                signals.append(signal)
        
        # 2. Range Strategy (5m)
        if candles_5m:
            signal = RangeStrategy.generate_signal(candles_5m, current_price)
            if signal:
                signal.timeframe = "5m"
                signals.append(signal)
        
        # 3. Breakout Strategy (5m)
        if candles_5m:
            signal = BreakoutStrategy.generate_signal(candles_5m, current_price)
            if signal:
                signal.timeframe = "5m"
                signals.append(signal)
        
        # 4. Orderbook Strategy
        if orderbook:
            signal = OrderbookStrategy.generate_signal(orderbook, current_price)
            if signal:
                signal.timeframe = "orderbook"
                signals.append(signal)
        
        # 5. Volume Spike Strategy (1m for faster detection)
        if candles_1m:
            signal = VolumeSpikeStrategy.generate_signal(candles_1m, current_price)
            if signal:
                signal.timeframe = "1m"
                signals.append(signal)
        
        return signals
    
    def select_best_signal(self, signals: List[ScalpingSignal]) -> Optional[ScalpingSignal]:
        """Select the best signal to trade with learning layer filtering"""
        if not signals:
            return None
        
        # Sort by confidence (highest first)
        signals.sort(key=lambda s: s.confidence, reverse=True)
        
        # Log all signals
        print(f"📊 {len(signals)} signals generated:")
        for s in signals[:3]:  # Top 3
            print(f"   • {s.signal_type.value} {s.side.value} ({s.confidence:.0f}%)")
        
        # Filter through learning layer
        if self.learning:
            for signal in signals:
                # Get base threshold for strategy
                base_threshold = {
                    SignalType.MOMENTUM: ScalpingConfig.MIN_CONFIDENCE_MOMENTUM,
                    SignalType.RANGE: ScalpingConfig.MIN_CONFIDENCE_RANGE,
                    SignalType.BREAKOUT: ScalpingConfig.MIN_CONFIDENCE_BREAKOUT,
                    SignalType.ORDERBOOK: ScalpingConfig.MIN_CONFIDENCE_ORDERBOOK,
                    SignalType.VOLUME_SPIKE: ScalpingConfig.MIN_CONFIDENCE_VOLUME,
                    SignalType.WHALE_MODE: ScalpingConfig.WHALE_MIN_CONFIDENCE
                }.get(signal.signal_type, 55)
                
                # Check with learning layer
                should_trade, reason = self.learning.should_take_trade(
                    signal.signal_type.value,
                    signal.side.value,
                    signal.confidence,
                    base_threshold
                )
                
                if should_trade:
                    print(f"🧠 Learning approved: {signal.signal_type.value} {signal.side.value} - {reason}")
                    return signal
                else:
                    print(f"🧠 Learning filtered: {signal.signal_type.value} {signal.side.value} - {reason}")
            
            # No signals passed learning filter
            print("⏸️ All signals filtered by learning layer")
            return None
        
        # No learning layer, return best signal
        return signals[0]
    
    def execute_trade(self, signal: ScalpingSignal) -> bool:
        """Execute a trade based on signal with learning adjustments"""
        balance = self.get_account_balance()
        if not balance:
            print("❌ Cannot get balance")
            return False
        
        # Get funding rate for context
        funding_rate = self.market_data.get_funding_rate("BTC") or 0.0
        
        # Calculate base position size
        position_size = self.risk_manager.calculate_position_size(balance, signal.leverage)
        
        # 🐋 WHALE MODE - Double position size on extreme volume
        if signal.signal_type == SignalType.WHALE_MODE:
            position_size *= ScalpingConfig.WHALE_POSITION_MULTIPLIER
            print(f"🐋 WHALE MODE: Position size 2x → ${position_size:.2f}")
        
        # Apply learning-based position size adjustment
        if self.learning:
            position_size = self.learning.get_adjusted_position_size(
                position_size, "BTC", signal.side.value
            )
            print(f"🧠 Learning adjusted position size: ${position_size:.2f}")
        
        size_in_coins = position_size / signal.entry_price
        
        # Minimum size check - Hyperliquid minimum is ~0.0001 BTC but we want at least 0.0002
        min_size = 0.0002  # ~$13 at current prices
        if size_in_coins < min_size:
            print(f"❌ Position too small: {size_in_coins:.6f} BTC (min: {min_size})")
            print(f"   Adjusting to minimum size...")
            size_in_coins = min_size
            position_size = size_in_coins * signal.entry_price
        
        # Get learning-adjusted stops
        stop_loss = signal.stop_loss
        take_profit = signal.take_profit
        if self.learning:
            # Get base percentages based on strategy
            base_stop = {
                SignalType.MOMENTUM: ScalpingConfig.MOMENTUM_STOP,
                SignalType.RANGE: ScalpingConfig.RANGE_STOP,
                SignalType.BREAKOUT: ScalpingConfig.BREAKOUT_STOP,
                SignalType.ORDERBOOK: ScalpingConfig.ORDERBOOK_STOP,
                SignalType.VOLUME_SPIKE: ScalpingConfig.VOLUME_STOP,
                SignalType.WHALE_MODE: ScalpingConfig.WHALE_STOP
            }.get(signal.signal_type, 1.0)
            
            base_tp = {
                SignalType.MOMENTUM: ScalpingConfig.MOMENTUM_TARGET,
                SignalType.RANGE: ScalpingConfig.RANGE_TARGET,
                SignalType.BREAKOUT: ScalpingConfig.BREAKOUT_TARGET,
                SignalType.ORDERBOOK: ScalpingConfig.ORDERBOOK_TARGET,
                SignalType.VOLUME_SPIKE: ScalpingConfig.VOLUME_TARGET,
                SignalType.WHALE_MODE: ScalpingConfig.WHALE_TARGET  # 🐋 3% target!
            }.get(signal.signal_type, 1.0)
            
            stop_loss, take_profit = self.learning.get_adjusted_stops(
                signal.signal_type.value, signal.entry_price, signal.side.value, base_stop, base_tp
            )
        
        print("\n" + "=" * 70)
        print(f"🎯 EXECUTING {signal.side.value} TRADE")
        print("=" * 70)
        print(f"📈 Strategy: {signal.signal_type.value}")
        print(f"💰 Price: ${signal.entry_price:,.2f}")
        print(f"📊 Size: ${position_size:.2f} ({size_in_coins:.5f} BTC)")
        print(f"⚡ Leverage: {signal.leverage}x")
        print(f"🎯 Confidence: {signal.confidence:.0f}%")
        print(f"🛑 Stop: ${stop_loss:,.2f}")
        print(f"✅ Target: ${take_profit:,.2f}")
        print(f"💸 Funding Rate: {funding_rate:.6f}")
        print(f"📝 Reasons: {', '.join(signal.reasons)}")
        
        try:
            # Execute market order
            is_buy = signal.side == TradeSide.LONG
            
            # Use market order with 0.5% slippage tolerance
            order_result = self.exchange.market_open(
                "BTC",
                is_buy,
                size_in_coins,
                px=None,           # Let API determine price
                slippage=0.005     # 0.5% slippage tolerance
            )
            
            print(f"\n✅ ORDER EXECUTED!")
            print(f"   Result: {order_result}")
            
            # Record trade with learning layer
            if self.learning:
                self.current_trade_id = self.learning.record_trade_entry(
                    asset="BTC",
                    direction=signal.side.value,
                    strategy=signal.signal_type.value,
                    entry_price=signal.entry_price,
                    size_usd=position_size,
                    size_coins=size_in_coins,
                    leverage=signal.leverage,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    confidence=signal.confidence,
                    reasons=signal.reasons,
                    funding_rate=funding_rate,
                    rsi_at_entry=self.last_rsi,
                    volume_ratio=self.last_volume_ratio
                )
            
            # Record trade (legacy)
            self._record_trade(signal, position_size)
            self.trades_executed += 1
            
            return True
            
        except Exception as e:
            print(f"\n❌ TRADE FAILED: {e}")
            traceback.print_exc()
            return False
    
    def _record_trade(self, signal: ScalpingSignal, size: float):
        """Record trade to history"""
        trade_record = {
            "timestamp": datetime.now().isoformat(),
            "asset": "BTC",
            "side": signal.side.value,
            "strategy": signal.signal_type.value,
            "entry_price": signal.entry_price,
            "stop_loss": signal.stop_loss,
            "take_profit": signal.take_profit,
            "size_usd": size,
            "confidence": signal.confidence,
            "leverage": signal.leverage,
            "reasons": signal.reasons
        }
        
        # Append to trade history
        history_file = "scalping_history.json"
        try:
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    history = json.load(f)
            else:
                history = []
            
            history.append(trade_record)
            
            with open(history_file, 'w') as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            print(f"⚠️ History save error: {e}")
        
        self.risk_state.last_trade_time = datetime.now().isoformat()
        self._save_state()
    
    def check_positions(self) -> List[Dict]:
        """Check positions for stop loss / take profit"""
        actions = []
        positions = self.sync_positions()
        
        for coin, pos in positions.items():
            current_price = self.market_data.get_price(coin)
            if not current_price:
                continue
            
            entry_price = pos["entry_price"]
            side = pos["side"]
            
            # Calculate P&L %
            if side == "LONG":
                pnl_pct = ((current_price - entry_price) / entry_price) * 100
            else:
                pnl_pct = ((entry_price - current_price) / entry_price) * 100
            
            # Check stop loss (default 1% if we lost track)
            stop_pct = ScalpingConfig.MAX_STOP_LOSS_PCT
            if pnl_pct <= -stop_pct:
                actions.append({
                    "coin": coin,
                    "action": "close",
                    "reason": "stop_loss",
                    "pnl_pct": pnl_pct,
                    "position": pos
                })
            # Check take profit (default 1%)
            elif pnl_pct >= 1.0:
                actions.append({
                    "coin": coin,
                    "action": "close", 
                    "reason": "take_profit",
                    "pnl_pct": pnl_pct,
                    "position": pos
                })
        
        return actions
    
    def close_position(self, coin: str, position: Dict, reason: str, pnl_pct: float) -> bool:
        """Close a position and record with learning layer"""
        print(f"\n🔔 CLOSING {coin} - {reason} ({pnl_pct:+.2f}%)")
        
        try:
            size = abs(position["size"])
            entry_price = position.get("entry_price", 0)
            is_buy = position["side"] == "SHORT"  # Close short = buy, close long = sell
            
            # Get current price for exit
            exit_price = self.market_data.get_price(coin) or entry_price
            
            order_result = self.exchange.market_close(coin)
            
            print(f"✅ Position closed: {order_result}")
            
            # Calculate actual P&L
            pnl_usd = (pnl_pct / 100) * entry_price * size
            is_win = pnl_pct > 0
            
            # Estimate fees (Hyperliquid ~0.035% taker fee)
            fees_paid = entry_price * size * 0.00035 * 2  # Entry + exit
            
            # Record exit with learning layer
            if self.learning:
                self.learning.record_trade_exit_by_asset(
                    asset=coin,
                    exit_price=exit_price,
                    exit_reason=reason,
                    pnl_usd=pnl_usd,
                    fees_paid=fees_paid,
                    funding_received=0.0  # TODO: Track actual funding payments
                )
                self.current_trade_id = None
            
            # Update stats (legacy)
            self.risk_manager.record_trade_result(pnl_usd, is_win)
            self._save_state()
            
            return True
            
        except Exception as e:
            print(f"❌ Close failed: {e}")
            return False
    
    def run(self):
        """Main bot loop"""
        print(f"\n{'='*70}")
        print("🚀 STARTING SCALPING BOT - LIVE TRADING")
        if self.learning:
            print("🧠 ADAPTIVE LEARNING: ENABLED")
        print(f"{'='*70}\n")
        
        iteration = 0
        last_learning_summary = time.time()
        LEARNING_SUMMARY_INTERVAL = 3600  # Show learning summary every hour
        
        try:
            while self.running:
                iteration += 1
                now = time.time()
                
                # Periodic learning summary
                if self.learning and now - last_learning_summary >= LEARNING_SUMMARY_INTERVAL:
                    print(self.learning.get_performance_summary())
                    last_learning_summary = now
                
                # === POSITION CHECK (every 15s) ===
                if now - self.last_position_check >= ScalpingConfig.POSITION_CHECK_INTERVAL:
                    actions = self.check_positions()
                    for action in actions:
                        self.close_position(
                            action["coin"],
                            action["position"],
                            action["reason"],
                            action["pnl_pct"]
                        )
                    self.last_position_check = now
                
                # === SIGNAL CHECK (every 45s) ===
                if now - self.last_signal_check >= ScalpingConfig.CHECK_INTERVAL_SECONDS:
                    print(f"\n{'='*70}")
                    print(f"🔄 Iteration {iteration} - {datetime.now().strftime('%H:%M:%S')}")
                    print(f"{'='*70}")
                    
                    # Get balance
                    balance = self.get_account_balance()
                    if balance:
                        self.risk_manager.update_peak_balance(balance)
                        print(f"💰 Balance: ${balance:.2f}")
                    
                    # Check if can trade
                    can_trade, reason = self.risk_manager.can_trade(balance or 0)
                    
                    if not can_trade:
                        print(f"⏸️ Trading paused: {reason}")
                    else:
                        # Check if we already have a BTC position
                        positions = self.sync_positions()
                        if "BTC" in positions:
                            print(f"📊 Active BTC position: {positions['BTC']['side']} "
                                  f"{abs(positions['BTC']['size']):.5f} @ ${positions['BTC']['entry_price']:,.2f}")
                            print(f"   P&L: ${positions['BTC']['unrealized_pnl']:.4f}")
                            print("⏸️ Waiting for position to close before new trades...")
                        else:
                            # Generate signals only if no position
                            signals = self.generate_signals()
                            self.signals_generated += len(signals)
                            
                            if signals:
                                best = self.select_best_signal(signals)
                                if best:
                                    print(f"\n🎯 BEST SIGNAL: {best.signal_type.value} {best.side.value}")
                                    print(f"   Confidence: {best.confidence:.0f}%")
                                    
                                    # Execute if confidence is high enough
                                    min_conf = {
                                        SignalType.MOMENTUM: ScalpingConfig.MIN_CONFIDENCE_MOMENTUM,
                                        SignalType.RANGE: ScalpingConfig.MIN_CONFIDENCE_RANGE,
                                        SignalType.BREAKOUT: ScalpingConfig.MIN_CONFIDENCE_BREAKOUT,
                                        SignalType.ORDERBOOK: ScalpingConfig.MIN_CONFIDENCE_ORDERBOOK,
                                        SignalType.VOLUME_SPIKE: ScalpingConfig.MIN_CONFIDENCE_VOLUME,
                                        SignalType.WHALE_MODE: ScalpingConfig.WHALE_MIN_CONFIDENCE
                                    }
                                    
                                    if best.confidence >= min_conf.get(best.signal_type, 55):
                                        self.execute_trade(best)
                            else:
                                print("⏸️ No signals generated")
                    
                    # Stats
                    win_rate = 0
                    if self.risk_state.total_trades > 0:
                        win_rate = (self.risk_state.winning_trades / self.risk_state.total_trades) * 100
                    
                    print(f"\n📊 Stats: {self.risk_state.daily_trades} trades today | "
                          f"P&L: ${self.risk_state.daily_pnl:.2f} | "
                          f"Win rate: {win_rate:.1f}%")
                    
                    # Show learning stats if available
                    if self.learning and self.learning.tracker.get_trades_count() > 0:
                        params = self.learning.get_current_params()
                        print(f"🧠 Learning: {self.learning.tracker.get_trades_count()} trades analyzed | "
                              f"Size mult: {params.overall_size_multiplier:.2f}x | "
                              f"Params v{params.version}")
                    
                    self.last_signal_check = now
                
                # Sleep briefly
                time.sleep(5)
        
        except KeyboardInterrupt:
            print("\n\n🛑 Bot stopped by user")
        
        except Exception as e:
            print(f"\n\n❌ Fatal error: {e}")
            traceback.print_exc()
        
        finally:
            print("\n✅ Scalping bot shutdown")
            self._save_state()


def main():
    """Entry point"""
    print("\n" + "🚀" * 35)
    print("   HYPERLIQUID AGGRESSIVE SCALPING BOT")
    print("🚀" * 35 + "\n")
    
    if not os.path.exists(".hyperliquid_config.json"):
        print("❌ Missing .hyperliquid_config.json")
        sys.exit(1)
    
    bot = HyperliquidScalpingBot()
    bot.run()


if __name__ == "__main__":
    main()
