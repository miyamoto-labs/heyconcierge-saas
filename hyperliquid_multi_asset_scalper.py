#!/usr/bin/env python3
"""
🚀 HYPERLIQUID MULTI-ASSET SCALPING BOT v2.0 🚀
MONEY PRINTER - BTC, $HYPE, $FARTCOIN

Target: 15-30 trades/day, 58-68% win rate, $10-30/day on $100 capital
Strategies: Momentum, Mean Reversion, Volume Spike, Order Flow, Microstructure

⚠️  WARNING: LIVE TRADING WITH REAL MONEY
NO FEAR - PURE EXECUTION
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
from funding_rate_monitor import FundingRateMonitor


class TradeSide(Enum):
    LONG = "LONG"
    SHORT = "SHORT"


class SignalType(Enum):
    MOMENTUM = "MOMENTUM"
    MEAN_REVERSION = "MEAN_REVERSION"
    BREAKOUT = "BREAKOUT"
    ORDERBOOK = "ORDERBOOK"
    VOLUME_SPIKE = "VOLUME_SPIKE"
    MICROSTRUCTURE = "MICROSTRUCTURE"


@dataclass
class AssetConfig:
    """Asset-specific trading configuration"""
    symbol: str
    min_position_usd: float
    max_position_pct: float  # % of total capital
    leverage: int
    
    # Strategy-specific stops/targets (% of entry)
    momentum_stop: float
    momentum_target: float
    mean_reversion_stop: float
    mean_reversion_target: float
    breakout_stop: float
    breakout_target: float
    orderbook_stop: float
    orderbook_target: float
    volume_stop: float
    volume_target: float
    
    # Signal confidence thresholds
    min_confidence_momentum: int
    min_confidence_mean_reversion: int
    min_confidence_breakout: int
    min_confidence_orderbook: int
    min_confidence_volume: int
    
    # Technical parameters
    rsi_period: int
    rsi_oversold: int
    rsi_overbought: int
    ema_fast: int
    ema_slow: int
    volume_spike_multiplier: float
    
    # Execution
    check_interval_seconds: int
    max_daily_trades: int
    
    # Asset characteristics
    volatility_factor: float  # 1.0 = normal, >1.0 = high volatility
    liquidity_tier: int  # 1 = highest, 3 = lowest


# Asset configurations
# NOTE: HYPE and FARTCOIN disabled for now due to Hyperliquid size requirements
# Will re-enable after BTC validation
ASSET_CONFIGS = {
    "BTC": AssetConfig(
        symbol="BTC",
        min_position_usd=15.0,
        max_position_pct=15.0,  # 15% max per trade (to meet Hyperliquid minimums)
        leverage=10,
        
        # Optimized for 10x leverage (0.1% move = 1% P&L)
        momentum_stop=0.2,      # 0.2% = 2% loss with 10x
        momentum_target=0.4,    # 0.4% = 4% profit with 10x
        mean_reversion_stop=0.15,  # 0.15% = 1.5% loss with 10x
        mean_reversion_target=0.3,  # 0.3% = 3% profit with 10x
        breakout_stop=0.25,     # 0.25% = 2.5% loss with 10x
        breakout_target=0.5,    # 0.5% = 5% profit with 10x
        orderbook_stop=0.1,     # 0.1% = 1% loss with 10x (tightest)
        orderbook_target=0.2,   # 0.2% = 2% profit with 10x
        volume_stop=0.2,        # 0.2% = 2% loss with 10x
        volume_target=0.4,      # 0.4% = 4% profit with 10x
        
        min_confidence_momentum=55,
        min_confidence_mean_reversion=60,
        min_confidence_breakout=60,
        min_confidence_orderbook=50,
        min_confidence_volume=55,
        
        rsi_period=7,
        rsi_oversold=30,
        rsi_overbought=70,
        ema_fast=5,
        ema_slow=13,
        volume_spike_multiplier=1.5,
        
        check_interval_seconds=30,  # Faster checks for tighter scalping
        max_daily_trades=20,  # More trades with tighter targets
        
        volatility_factor=1.0,
        liquidity_tier=1
    )
    
    # Disabled until we fix size requirements
    
}


@dataclass
class ScalpingSignal:
    """Trading signal"""
    asset: str
    signal_type: SignalType
    side: TradeSide
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: float
    leverage: int
    reasons: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    timeframe: str = "5m"


@dataclass
class RiskState:
    """Risk management state"""
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
    
    # Per-asset tracking
    asset_trades_today: Dict[str, int] = field(default_factory=dict)
    asset_pnl_today: Dict[str, float] = field(default_factory=dict)


class GlobalConfig:
    """Global risk limits (shared across assets)"""
    MAX_CONCURRENT_POSITIONS = 3      # Max 3 positions total (one per asset)
    TOTAL_POSITION_EXPOSURE_PCT = 60.0  # Max 60% total exposure (tight stops mitigate risk)
    DAILY_LOSS_LIMIT = 15.0           # $15 total daily loss
    MAX_CONSECUTIVE_LOSSES = 5        # Pause after 5 losses
    PAUSE_DURATION_MINUTES = 20       # Pause for 20 min
    MAX_DRAWDOWN_PCT = 25.0           # Max 25% drawdown
    
    POSITION_CHECK_INTERVAL = 10      # Check positions every 10 sec
    
    # Trim and trail settings
    PARTIAL_PROFIT_AT_PCT = 0.5       # Take 30% profit at 0.5%
    PARTIAL_PROFIT_SIZE = 0.3         # Close 30% of position
    TRAIL_STOP_TRIGGER_PCT = 0.8      # Start trailing at 0.8%
    TRAIL_STOP_DISTANCE_PCT = 0.3     # Trail 0.3% behind peak


class MarketData:
    """Market data with multi-asset support"""
    
    def __init__(self, info: Info):
        self.info = info
        self.cache = {}
        self.cache_time = {}
        self.cache_duration = 8  # 8 second cache
    
    def get_price(self, asset: str) -> Optional[float]:
        """Get current mid price"""
        try:
            mids = self.info.all_mids()
            return float(mids.get(asset, 0))
        except Exception as e:
            print(f"❌ Price fetch error ({asset}): {e}")
            return None
    
    def get_candles(self, asset: str, timeframe: str, bars: int = 100) -> Optional[List[Dict]]:
        """Fetch candles with caching"""
        cache_key = f"{asset}_{timeframe}"
        now = time.time()
        
        if cache_key in self.cache and now - self.cache_time.get(cache_key, 0) < self.cache_duration:
            return self.cache[cache_key]
        
        try:
            now_ms = int(now * 1000)
            tf_minutes = {"1m": 1, "5m": 5, "15m": 15, "1h": 60}
            minutes = tf_minutes.get(timeframe, 5)
            lookback_ms = bars * minutes * 60 * 1000
            
            candles = self.info.candles_snapshot(asset, timeframe, now_ms - lookback_ms, now_ms)
            
            if candles:
                self.cache[cache_key] = candles
                self.cache_time[cache_key] = now
            
            return candles
        except Exception as e:
            print(f"❌ Candle fetch error ({asset} {timeframe}): {e}")
            return None
    
    def get_orderbook(self, asset: str) -> Optional[Dict]:
        """Get L2 orderbook"""
        try:
            return self.info.l2_snapshot(asset)
        except Exception as e:
            print(f"❌ Orderbook fetch error ({asset}): {e}")
            return None


class TechnicalAnalysis:
    """Technical indicators - optimized for scalping"""
    
    @staticmethod
    def calculate_rsi(closes: List[float], period: int = 7) -> Optional[float]:
        """RSI calculation"""
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
    def calculate_vwap(candles: List[Dict]) -> Optional[float]:
        """Volume-Weighted Average Price"""
        if not candles:
            return None
        
        total_volume = 0
        total_price_volume = 0
        
        for candle in candles:
            typical_price = (float(candle['h']) + float(candle['l']) + float(candle['c'])) / 3
            volume = float(candle['v'])
            total_price_volume += typical_price * volume
            total_volume += volume
        
        if total_volume == 0:
            return None
        
        return total_price_volume / total_volume
    
    @staticmethod
    def calculate_bollinger_bands(closes: List[float], period: int = 20, std_dev: float = 2.0) -> Optional[Tuple[float, float, float]]:
        """Bollinger Bands"""
        if len(closes) < period:
            return None
        
        recent = closes[-period:]
        middle = statistics.mean(recent)
        std = statistics.stdev(recent)
        
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        
        return lower, middle, upper
    
    @staticmethod
    def detect_volume_spike(candles: List[Dict], lookback: int = 20, multiplier: float = 1.5) -> Tuple[bool, float]:
        """Volume spike detection"""
        if len(candles) < lookback + 1:
            return False, 0.0
        
        volumes = [float(c['v']) for c in candles[-(lookback+1):-1]]
        current_volume = float(candles[-1]['v'])
        avg_volume = statistics.mean(volumes)
        
        if avg_volume == 0:
            return False, 0.0
        
        ratio = current_volume / avg_volume
        is_spike = ratio >= multiplier
        
        return is_spike, ratio
    
    @staticmethod
    def calculate_atr(candles: List[Dict], period: int = 14) -> Optional[float]:
        """Average True Range"""
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


class MomentumStrategy:
    """Momentum scalping - ride short-term trends"""
    
    @staticmethod
    def generate_signal(asset: str, config: AssetConfig, candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate momentum signal"""
        if not candles or len(candles) < 30:
            return None
        
        closes = [float(c['c']) for c in candles]
        
        rsi = TechnicalAnalysis.calculate_rsi(closes, config.rsi_period)
        ema_fast = TechnicalAnalysis.calculate_ema(closes, config.ema_fast)
        ema_slow = TechnicalAnalysis.calculate_ema(closes, config.ema_slow)
        vwap = TechnicalAnalysis.calculate_vwap(candles[-20:])
        
        if None in [rsi, ema_fast, ema_slow, vwap]:
            return None
        
        confidence = 0
        reasons = []
        side = None
        
        # LONG momentum
        if ema_fast > ema_slow:
            confidence += 25
            reasons.append(f"EMA bullish ({ema_fast:.0f} > {ema_slow:.0f})")
            
            if current_price > vwap:
                confidence += 15
                reasons.append(f"Price > VWAP")
            
            if rsi > 50 and rsi < config.rsi_overbought:
                confidence += 20
                reasons.append(f"RSI momentum ({rsi:.1f})")
            
            if closes[-1] > closes[-2] > closes[-3]:
                confidence += 15
                reasons.append("3 bullish candles")
            
            if confidence >= config.min_confidence_momentum:
                side = TradeSide.LONG
        
        # SHORT momentum
        elif ema_fast < ema_slow:
            confidence += 25
            reasons.append(f"EMA bearish")
            
            if current_price < vwap:
                confidence += 15
                reasons.append("Price < VWAP")
            
            if rsi < 50 and rsi > config.rsi_oversold:
                confidence += 20
                reasons.append(f"RSI momentum ({rsi:.1f})")
            
            if closes[-1] < closes[-2] < closes[-3]:
                confidence += 15
                reasons.append("3 bearish candles")
            
            if confidence >= config.min_confidence_momentum:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - config.momentum_stop / 100)
            take_profit = current_price * (1 + config.momentum_target / 100)
        else:
            stop_loss = current_price * (1 + config.momentum_stop / 100)
            take_profit = current_price * (1 - config.momentum_target / 100)
        
        return ScalpingSignal(
            asset=asset,
            signal_type=SignalType.MOMENTUM,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=config.leverage,
            reasons=reasons
        )


class MeanReversionStrategy:
    """Mean reversion - buy oversold, sell overbought"""
    
    @staticmethod
    def generate_signal(asset: str, config: AssetConfig, candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate mean reversion signal"""
        if not candles or len(candles) < 30:
            return None
        
        closes = [float(c['c']) for c in candles]
        
        bb = TechnicalAnalysis.calculate_bollinger_bands(closes, period=20, std_dev=2.0)
        if not bb:
            return None
        
        lower, middle, upper = bb
        rsi = TechnicalAnalysis.calculate_rsi(closes, config.rsi_period)
        
        if rsi is None:
            return None
        
        confidence = 0
        reasons = []
        side = None
        
        range_size = upper - lower
        if range_size == 0:
            return None
        
        price_position = (current_price - lower) / range_size
        
        # LONG at oversold
        if price_position < 0.12:  # Near lower band
            confidence += 40
            reasons.append(f"Oversold ({price_position:.1%})")
            
            if rsi < config.rsi_oversold:
                confidence += 25
                reasons.append(f"RSI oversold ({rsi:.1f})")
            
            if closes[-1] > closes[-2]:
                confidence += 15
                reasons.append("Bounce forming")
            
            if confidence >= config.min_confidence_mean_reversion:
                side = TradeSide.LONG
        
        # SHORT at overbought
        elif price_position > 0.88:
            confidence += 40
            reasons.append(f"Overbought ({price_position:.1%})")
            
            if rsi > config.rsi_overbought:
                confidence += 25
                reasons.append(f"RSI overbought ({rsi:.1f})")
            
            if closes[-1] < closes[-2]:
                confidence += 15
                reasons.append("Rejection forming")
            
            if confidence >= config.min_confidence_mean_reversion:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - config.mean_reversion_stop / 100)
            take_profit = middle  # Target mean
        else:
            stop_loss = current_price * (1 + config.mean_reversion_stop / 100)
            take_profit = middle
        
        return ScalpingSignal(
            asset=asset,
            signal_type=SignalType.MEAN_REVERSION,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=config.leverage,
            reasons=reasons
        )


class BreakoutStrategy:
    """Breakout scalping - catch volatility"""
    
    @staticmethod
    def generate_signal(asset: str, config: AssetConfig, candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate breakout signal"""
        if not candles or len(candles) < 30:
            return None
        
        highs = [float(c['h']) for c in candles]
        lows = [float(c['l']) for c in candles]
        
        lookback = 20
        recent_high = max(highs[-lookback:-1])
        recent_low = min(lows[-lookback:-1])
        
        is_volume_spike, volume_ratio = TechnicalAnalysis.detect_volume_spike(candles, multiplier=config.volume_spike_multiplier)
        
        confidence = 0
        reasons = []
        side = None
        
        # Bullish breakout
        if current_price > recent_high:
            breakout_pct = ((current_price - recent_high) / recent_high) * 100
            confidence += 35
            reasons.append(f"Broke {lookback}-bar high")
            
            if breakout_pct > 0.3:
                confidence += 15
                reasons.append(f"Strong breakout ({breakout_pct:.2f}%)")
            
            if is_volume_spike:
                confidence += 20
                reasons.append(f"Volume spike ({volume_ratio:.1f}x)")
            
            if confidence >= config.min_confidence_breakout:
                side = TradeSide.LONG
        
        # Bearish breakout
        elif current_price < recent_low:
            breakout_pct = ((recent_low - current_price) / recent_low) * 100
            confidence += 35
            reasons.append(f"Broke {lookback}-bar low")
            
            if breakout_pct > 0.3:
                confidence += 15
                reasons.append(f"Strong breakdown ({breakout_pct:.2f}%)")
            
            if is_volume_spike:
                confidence += 20
                reasons.append(f"Volume spike ({volume_ratio:.1f}x)")
            
            if confidence >= config.min_confidence_breakout:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - config.breakout_stop / 100)
            take_profit = current_price * (1 + config.breakout_target / 100)
        else:
            stop_loss = current_price * (1 + config.breakout_stop / 100)
            take_profit = current_price * (1 - config.breakout_target / 100)
        
        return ScalpingSignal(
            asset=asset,
            signal_type=SignalType.BREAKOUT,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=config.leverage,
            reasons=reasons
        )


class OrderbookStrategy:
    """Orderbook imbalance strategy"""
    
    @staticmethod
    def generate_signal(asset: str, config: AssetConfig, orderbook: Dict, current_price: float) -> Optional[ScalpingSignal]:
        """Generate orderbook imbalance signal"""
        if not orderbook:
            return None
        
        levels = orderbook.get("levels", [[], []])
        if len(levels) < 2:
            return None
        
        bids = levels[0]
        asks = levels[1]
        
        if not bids or not asks:
            return None
        
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
        
        # Bid imbalance
        if bid_ratio > 0.62:
            confidence += 40
            reasons.append(f"Bid imbalance ({bid_ratio:.1%})")
            
            if bid_ratio > 0.72:
                confidence += 20
                reasons.append("Strong buying pressure")
            
            if confidence >= config.min_confidence_orderbook:
                side = TradeSide.LONG
        
        # Ask imbalance
        elif ask_ratio > 0.62:
            confidence += 40
            reasons.append(f"Ask imbalance ({ask_ratio:.1%})")
            
            if ask_ratio > 0.72:
                confidence += 20
                reasons.append("Strong selling pressure")
            
            if confidence >= config.min_confidence_orderbook:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - config.orderbook_stop / 100)
            take_profit = current_price * (1 + config.orderbook_target / 100)
        else:
            stop_loss = current_price * (1 + config.orderbook_stop / 100)
            take_profit = current_price * (1 - config.orderbook_target / 100)
        
        return ScalpingSignal(
            asset=asset,
            signal_type=SignalType.ORDERBOOK,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=config.leverage,
            reasons=reasons
        )


class VolumeSpikeStrategy:
    """Volume spike strategy"""
    
    @staticmethod
    def generate_signal(asset: str, config: AssetConfig, candles: List[Dict], current_price: float) -> Optional[ScalpingSignal]:
        """Generate volume spike signal"""
        if not candles or len(candles) < 25:
            return None
        
        is_spike, volume_ratio = TechnicalAnalysis.detect_volume_spike(candles, multiplier=config.volume_spike_multiplier)
        
        if not is_spike:
            return None
        
        current_candle = candles[-1]
        candle_open = float(current_candle['o'])
        candle_close = float(current_candle['c'])
        candle_high = float(current_candle['h'])
        candle_low = float(current_candle['l'])
        
        confidence = 0
        reasons = [f"Volume spike ({volume_ratio:.1f}x)"]
        side = None
        
        is_bullish_candle = candle_close > candle_open
        candle_body = abs(candle_close - candle_open)
        candle_range = candle_high - candle_low
        
        if candle_range == 0:
            return None
        
        body_ratio = candle_body / candle_range
        
        # Bullish volume spike
        if is_bullish_candle:
            confidence += 35
            reasons.append("Bullish candle + volume")
            
            if body_ratio > 0.65:
                confidence += 20
                reasons.append(f"Strong body ({body_ratio:.1%})")
            
            if volume_ratio > 2.5:
                confidence += 15
                reasons.append("Exceptional volume")
            
            if confidence >= config.min_confidence_volume:
                side = TradeSide.LONG
        
        # Bearish volume spike
        else:
            confidence += 35
            reasons.append("Bearish candle + volume")
            
            if body_ratio > 0.65:
                confidence += 20
                reasons.append(f"Strong body ({body_ratio:.1%})")
            
            if volume_ratio > 2.5:
                confidence += 15
                reasons.append("Exceptional volume")
            
            if confidence >= config.min_confidence_volume:
                side = TradeSide.SHORT
        
        if not side:
            return None
        
        if side == TradeSide.LONG:
            stop_loss = current_price * (1 - config.volume_stop / 100)
            take_profit = current_price * (1 + config.volume_target / 100)
        else:
            stop_loss = current_price * (1 + config.volume_stop / 100)
            take_profit = current_price * (1 - config.volume_target / 100)
        
        return ScalpingSignal(
            asset=asset,
            signal_type=SignalType.VOLUME_SPIKE,
            side=side,
            confidence=min(confidence, 100),
            entry_price=current_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            leverage=config.leverage,
            reasons=reasons
        )


class RiskManager:
    """Multi-asset risk management"""
    
    def __init__(self, state: RiskState):
        self.state = state
    
    def can_trade(self, asset: str, balance: float) -> Tuple[bool, str]:
        """Check if trading is allowed for this asset"""
        
        # Reset daily stats if new day
        today = datetime.now().strftime("%Y-%m-%d")
        if self.state.last_reset_date != today:
            self.state.daily_pnl = 0.0
            self.state.daily_trades = 0
            self.state.asset_trades_today = {}
            self.state.asset_pnl_today = {}
            self.state.last_reset_date = today
        
        # Check pause status
        if self.state.paused_until:
            pause_time = datetime.fromisoformat(self.state.paused_until)
            if datetime.now() < pause_time:
                remaining = (pause_time - datetime.now()).seconds // 60
                return False, f"Paused for {remaining} min"
            else:
                self.state.paused_until = None
                self.state.consecutive_losses = 0
        
        # Daily loss limit (global)
        if self.state.daily_pnl <= -GlobalConfig.DAILY_LOSS_LIMIT:
            return False, f"Daily loss limit hit (${abs(self.state.daily_pnl):.2f})"
        
        # Consecutive losses (global)
        if self.state.consecutive_losses >= GlobalConfig.MAX_CONSECUTIVE_LOSSES:
            pause_until = datetime.now() + timedelta(minutes=GlobalConfig.PAUSE_DURATION_MINUTES)
            self.state.paused_until = pause_until.isoformat()
            return False, f"Max consecutive losses ({self.state.consecutive_losses})"
        
        # Max concurrent positions (global)
        if len(self.state.open_positions) >= GlobalConfig.MAX_CONCURRENT_POSITIONS:
            return False, f"Max positions ({GlobalConfig.MAX_CONCURRENT_POSITIONS})"
        
        # Asset already has position
        if asset in self.state.open_positions:
            return False, f"{asset} position already open"
        
        # Per-asset daily trade limit
        config = ASSET_CONFIGS.get(asset)
        if config:
            asset_trades = self.state.asset_trades_today.get(asset, 0)
            if asset_trades >= config.max_daily_trades:
                return False, f"{asset} daily limit ({config.max_daily_trades} trades)"
        
        # Max drawdown
        if self.state.peak_balance > 0:
            drawdown = ((self.state.peak_balance - balance) / self.state.peak_balance) * 100
            if drawdown >= GlobalConfig.MAX_DRAWDOWN_PCT:
                return False, f"Max drawdown ({drawdown:.1f}%)"
        
        return True, "OK"
    
    def calculate_position_size(self, asset: str, balance: float, config: AssetConfig) -> float:
        """Calculate safe position size"""
        position_pct = config.max_position_pct / 100
        position_size = balance * position_pct
        
        # Ensure minimum (always use config minimum)
        position_size = max(position_size, config.min_position_usd)
        
        # Check total exposure
        total_exposure = sum(
            pos.get("size_usd", 0) for pos in self.state.open_positions.values()
        )
        available_exposure = (balance * GlobalConfig.TOTAL_POSITION_EXPOSURE_PCT / 100) - total_exposure
        
        position_size = min(position_size, available_exposure)
        
        return max(position_size, 0)
    
    def update_peak_balance(self, balance: float):
        """Track peak balance"""
        if balance > self.state.peak_balance:
            self.state.peak_balance = balance
    
    def record_trade_result(self, asset: str, pnl: float, is_win: bool):
        """Record trade result"""
        self.state.daily_pnl += pnl
        self.state.total_trades += 1
        self.state.daily_trades += 1
        
        if asset not in self.state.asset_trades_today:
            self.state.asset_trades_today[asset] = 0
            self.state.asset_pnl_today[asset] = 0.0
        
        self.state.asset_trades_today[asset] += 1
        self.state.asset_pnl_today[asset] += pnl
        
        if is_win:
            self.state.winning_trades += 1
            self.state.consecutive_losses = 0
        else:
            self.state.losing_trades += 1
            self.state.consecutive_losses += 1


class HyperliquidMultiAssetScalper:
    """Main multi-asset scalping bot"""
    
    def __init__(self, config_file: str = ".hyperliquid_config.json"):
        print("=" * 80)
        print("🚀 HYPERLIQUID MULTI-ASSET SCALPING BOT v2.0 🚀")
        print("=" * 80)
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Load credentials
        print("\n🔑 Loading credentials...")
        with open(config_file, 'r') as f:
            hl_config = json.load(f)
        
        self.wallet_address = hl_config["public_wallet"]
        self.api_key = hl_config["api_private_key"]
        
        # Initialize API
        print("🔌 Connecting to Hyperliquid...")
        self.info = Info(skip_ws=True)
        account = Account.from_key(self.api_key)
        self.exchange = Exchange(account, account_address=self.wallet_address)
        
        # Components
        self.market_data = MarketData(self.info)
        self.funding_monitor = FundingRateMonitor()
        self.risk_state = self._load_state()
        self.risk_manager = RiskManager(self.risk_state)
        
        # State
        self.running = True
        self.last_check = {asset: 0 for asset in ASSET_CONFIGS}
        self.last_position_check = time.time()
        
        print(f"✅ Connected to Hyperliquid MAINNET")
        print(f"💰 Account: {self.wallet_address[:10]}...{self.wallet_address[-8:]}")
        
        balance = self.get_account_balance()
        if balance:
            self.risk_manager.update_peak_balance(balance)
            print(f"💵 Balance: ${balance:.2f}")
        
        print("\n" + "=" * 80)
        print("📊 SCALPING CONFIG:")
        print(f"   • Assets: {', '.join(ASSET_CONFIGS.keys())}")
        print(f"   • Max Positions: {GlobalConfig.MAX_CONCURRENT_POSITIONS}")
        print(f"   • Total Exposure: {GlobalConfig.TOTAL_POSITION_EXPOSURE_PCT}%")
        print(f"   • Daily Loss Limit: ${GlobalConfig.DAILY_LOSS_LIMIT}")
        print(f"   • Position Check: {GlobalConfig.POSITION_CHECK_INTERVAL}s")
        print("=" * 80 + "\n")
    
    def _load_state(self) -> RiskState:
        """Load state"""
        state_file = "multi_asset_scalping_state.json"
        if os.path.exists(state_file):
            try:
                with open(state_file, 'r') as f:
                    data = json.load(f)
                    return RiskState(**data)
            except:
                pass
        return RiskState()
    
    def _save_state(self):
        """Save state"""
        try:
            with open("multi_asset_scalping_state.json", 'w') as f:
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
                    "last_reset_date": self.risk_state.last_reset_date,
                    "asset_trades_today": self.risk_state.asset_trades_today,
                    "asset_pnl_today": self.risk_state.asset_pnl_today
                }, f, indent=2)
        except Exception as e:
            print(f"⚠️ State save error: {e}")
    
    def get_account_balance(self) -> Optional[float]:
        """Get account balance"""
        try:
            user_state = self.info.user_state(self.wallet_address)
            margin_summary = user_state.get("marginSummary", {})
            return float(margin_summary.get("accountValue", 0))
        except Exception as e:
            print(f"❌ Balance error: {e}")
            return None
    
    def sync_positions(self) -> Dict:
        """Sync open positions"""
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
                        "leverage": float(pos.get("leverage", {}).get("value", 1)),
                        "size_usd": abs(size) * float(pos.get("entryPx", 0))
                    }
            
            self.risk_state.open_positions = positions
            return positions
        except Exception as e:
            print(f"❌ Position sync error: {e}")
            return {}
    
    def generate_signals(self, asset: str, config: AssetConfig) -> List[ScalpingSignal]:
        """Generate signals for an asset"""
        signals = []
        
        current_price = self.market_data.get_price(asset)
        if not current_price:
            return signals
        
        candles_5m = self.market_data.get_candles(asset, "5m", bars=60)
        candles_1m = self.market_data.get_candles(asset, "1m", bars=60)
        orderbook = self.market_data.get_orderbook(asset)
        
        # 1. Momentum
        if candles_5m:
            signal = MomentumStrategy.generate_signal(asset, config, candles_5m, current_price)
            if signal:
                signals.append(signal)
        
        # 2. Mean Reversion
        if candles_5m:
            signal = MeanReversionStrategy.generate_signal(asset, config, candles_5m, current_price)
            if signal:
                signals.append(signal)
        
        # 3. Breakout
        if candles_5m:
            signal = BreakoutStrategy.generate_signal(asset, config, candles_5m, current_price)
            if signal:
                signals.append(signal)
        
        # 4. Orderbook
        if orderbook:
            signal = OrderbookStrategy.generate_signal(asset, config, orderbook, current_price)
            if signal:
                signals.append(signal)
        
        # 5. Volume Spike
        if candles_1m:
            signal = VolumeSpikeStrategy.generate_signal(asset, config, candles_1m, current_price)
            if signal:
                signals.append(signal)
        
        return signals
    
    def enhance_signal_with_funding(self, signal: ScalpingSignal) -> Tuple[ScalpingSignal, bool]:
        """
        Enhance signal with funding rate analysis
        
        Returns:
            (enhanced_signal, should_trade)
        """
        funding_signal = self.funding_monitor.get_funding_signal(
            signal.asset, 
            signal.side.value
        )
        
        adjust = funding_signal['adjust']
        
        # Log funding info
        if funding_signal['funding_rate'] is not None:
            print(f"💰 Funding Rate: {funding_signal['funding_rate']*100:.4f}% per 8h "
                  f"({funding_signal['annualized_pct']:.1f}% APR)")
            print(f"   {funding_signal['reason']}")
        
        # Apply adjustments
        if adjust == 'BLOCK':
            print(f"🚫 SIGNAL BLOCKED BY FUNDING RATE")
            return (signal, False)
        
        elif adjust == 'BOOST':
            # Increase confidence by 10%
            original_conf = signal.confidence
            signal.confidence = min(100, signal.confidence + 10)
            print(f"⬆️  CONFIDENCE BOOSTED: {original_conf:.0f}% → {signal.confidence:.0f}%")
            signal.reasons.append(f"Funding boost (+10%)")
        
        elif adjust == 'FADE':
            # Decrease confidence by 10%
            original_conf = signal.confidence
            signal.confidence = max(0, signal.confidence - 10)
            print(f"⬇️  CONFIDENCE REDUCED: {original_conf:.0f}% → {signal.confidence:.0f}%")
            signal.reasons.append(f"Funding fade (-10%)")
            
            # If confidence drops below threshold, block trade
            config = ASSET_CONFIGS[signal.asset]
            min_conf = {
                SignalType.MOMENTUM: config.min_confidence_momentum,
                SignalType.MEAN_REVERSION: config.min_confidence_mean_reversion,
                SignalType.BREAKOUT: config.min_confidence_breakout,
                SignalType.ORDERBOOK: config.min_confidence_orderbook,
                SignalType.VOLUME_SPIKE: config.min_confidence_volume
            }.get(signal.signal_type, 60)
            
            if signal.confidence < min_conf:
                print(f"🚫 SIGNAL REJECTED: Confidence {signal.confidence:.0f}% < {min_conf}% after funding fade")
                return (signal, False)
        
        return (signal, True)
    
    def execute_trade(self, signal: ScalpingSignal) -> bool:
        """Execute trade"""
        balance = self.get_account_balance()
        if not balance:
            return False
        
        config = ASSET_CONFIGS[signal.asset]
        position_size = self.risk_manager.calculate_position_size(signal.asset, balance, config)
        
        if position_size < config.min_position_usd:
            print(f"❌ Position too small: ${position_size:.2f}")
            return False
        
        size_in_coins = position_size / signal.entry_price
        
        # Round to appropriate decimals for Hyperliquid (avoid float_to_wire rounding errors)
        if signal.asset == "BTC":
            size_in_coins = round(size_in_coins, 5)  # BTC: 5 decimals max
        elif signal.asset in ["HYPE", "ETH", "SOL"]:
            size_in_coins = round(size_in_coins, 3)  # Mid-cap: 3 decimals
        else:
            size_in_coins = round(size_in_coins, 2)  # Small-cap: 2 decimals
        
        print("\n" + "=" * 80)
        print(f"🎯 EXECUTING {signal.side.value} {signal.asset}")
        print("=" * 80)
        print(f"📈 Strategy: {signal.signal_type.value}")
        print(f"💰 Price: ${signal.entry_price:,.2f}")
        print(f"📊 Size: ${position_size:.2f} ({size_in_coins:.6f})")
        print(f"⚡ Leverage: {signal.leverage}x")
        print(f"🎯 Confidence: {signal.confidence:.0f}%")
        print(f"🛑 Stop: ${signal.stop_loss:,.2f}")
        print(f"✅ Target: ${signal.take_profit:,.2f}")
        print(f"📝 Reasons: {', '.join(signal.reasons)}")
        
        try:
            is_buy = signal.side == TradeSide.LONG
            
            order_result = self.exchange.market_open(
                signal.asset,
                is_buy,
                size_in_coins,
                px=None,
                slippage=0.01  # 1% slippage for alts
            )
            
            print(f"\n✅ ORDER EXECUTED: {order_result}")
            self._record_trade(signal, position_size)
            return True
            
        except Exception as e:
            print(f"\n❌ TRADE FAILED: {e}")
            traceback.print_exc()
            return False
    
    def _record_trade(self, signal: ScalpingSignal, size: float):
        """Record trade"""
        trade_record = {
            "timestamp": datetime.now().isoformat(),
            "asset": signal.asset,
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
        
        history_file = "multi_asset_scalping_history.json"
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
        """Check positions for exits"""
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
            
            config = ASSET_CONFIGS.get(coin)
            if not config:
                continue
            
            # Stop loss (use largest stop from all strategies)
            max_stop = max(
                config.momentum_stop,
                config.mean_reversion_stop,
                config.breakout_stop,
                config.orderbook_stop,
                config.volume_stop
            )
            
            if pnl_pct <= -max_stop:
                actions.append({
                    "coin": coin,
                    "action": "close",
                    "reason": "stop_loss",
                    "pnl_pct": pnl_pct,
                    "position": pos
                })
            # Take profit (dynamic - use smallest target)
            elif pnl_pct >= 0.8:
                actions.append({
                    "coin": coin,
                    "action": "close",
                    "reason": "take_profit",
                    "pnl_pct": pnl_pct,
                    "position": pos
                })
        
        return actions
    
    def close_position(self, coin: str, position: Dict, reason: str, pnl_pct: float) -> bool:
        """Close position"""
        print(f"\n🔔 CLOSING {coin} - {reason} ({pnl_pct:+.2f}%)")
        
        try:
            order_result = self.exchange.market_close(coin)
            print(f"✅ Position closed: {order_result}")
            
            pnl_usd = (pnl_pct / 100) * position.get("size_usd", 0)
            is_win = pnl_pct > 0
            
            self.risk_manager.record_trade_result(coin, pnl_usd, is_win)
            self._save_state()
            
            return True
            
        except Exception as e:
            print(f"❌ Close failed: {e}")
            return False
    
    def run(self):
        """Main loop"""
        print(f"\n{'='*80}")
        print("🚀 STARTING MULTI-ASSET SCALPING BOT")
        print(f"{'='*80}\n")
        
        try:
            while self.running:
                now = time.time()
                
                # Position check
                if now - self.last_position_check >= GlobalConfig.POSITION_CHECK_INTERVAL:
                    actions = self.check_positions()
                    for action in actions:
                        self.close_position(
                            action["coin"],
                            action["position"],
                            action["reason"],
                            action["pnl_pct"]
                        )
                    self.last_position_check = now
                
                # Check each asset
                for asset, config in ASSET_CONFIGS.items():
                    if now - self.last_check[asset] >= config.check_interval_seconds:
                        balance = self.get_account_balance()
                        if not balance:
                            continue
                        
                        can_trade, reason = self.risk_manager.can_trade(asset, balance)
                        
                        if not can_trade:
                            print(f"⏸️  {asset}: Can't trade - {reason}")
                        else:
                            signals = self.generate_signals(asset, config)
                            if not signals:
                                print(f"📊 {asset}: No signals meeting threshold")
                            else:
                                best = max(signals, key=lambda s: s.confidence)
                                print(f"\n🎯 {asset} signal: {best.signal_type.value} {best.side.value} ({best.confidence:.0f}%)")
                                
                                # Enhance with funding rate
                                enhanced_signal, should_trade = self.enhance_signal_with_funding(best)
                                
                                if should_trade:
                                    self.execute_trade(enhanced_signal)
                                else:
                                    print(f"❌ Trade rejected after funding rate analysis")
                        
                        self.last_check[asset] = now
                
                # Stats
                win_rate = 0
                if self.risk_state.total_trades > 0:
                    win_rate = (self.risk_state.winning_trades / self.risk_state.total_trades) * 100
                
                positions = self.sync_positions()
                if positions:
                    print(f"\n📊 Open: {len(positions)} | Trades: {self.risk_state.daily_trades} | "
                          f"P&L: ${self.risk_state.daily_pnl:.2f} | Win: {win_rate:.1f}%")
                
                # Show funding rates every 5 minutes
                if int(now) % 300 < 10:  # Every 5 min (with 10s window)
                    self.funding_monitor.print_funding_report(list(ASSET_CONFIGS.keys()))
                
                time.sleep(5)
        
        except KeyboardInterrupt:
            print("\n\n🛑 Bot stopped by user")
        
        except Exception as e:
            print(f"\n\n❌ Fatal error: {e}")
            traceback.print_exc()
        
        finally:
            print("\n✅ Bot shutdown")
            self._save_state()


def main():
    """Entry point"""
    print("\n" + "🚀" * 40)
    print("   HYPERLIQUID MULTI-ASSET SCALPING BOT v2.0")
    print("   BTC • HYPE • FARTCOIN")
    print("🚀" * 40 + "\n")
    
    if not os.path.exists(".hyperliquid_config.json"):
        print("❌ Missing .hyperliquid_config.json")
        sys.exit(1)
    
    bot = HyperliquidMultiAssetScalper()
    bot.run()


if __name__ == "__main__":
    main()
