#!/usr/bin/env python3
"""
HYPERLIQUID BOT V3 — TREND-FOLLOWING SWING TRADER

Philosophy: FEWER trades, HIGHER quality. Follow the trend, never fight it.

Key differences from V2:
- 15m signals, 1h/4h trend confirmation (not 5m noise)
- 2-3% stop loss (not 0.15% — that's just noise)
- Max 6 trades per day
- Only trades WITH the 1h trend, confirmed by 4h
- Funding rate as edge indicator
- Trailing stops that lock in profit
- 3x leverage (not 8x — survival > aggression)
- Risk 1% per trade ($5.85 on $585)

Target: 50-60% win rate with 2:1 R:R = profitable
"""

PAPER_TRADING = True  # ⚠️ SET FALSE FOR LIVE TRADING

import json
import time
import os
import sys
import statistics
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

from dotenv import load_dotenv
load_dotenv()

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

class Config:
    # Risk
    RISK_PER_TRADE = 0.01       # 1% of account per trade
    MAX_DAILY_TRADES = 6
    MAX_DAILY_LOSS = 15.0       # $15 max daily loss
    MAX_CONSECUTIVE_LOSSES = 3
    PAUSE_MINUTES = 120         # 2 hour pause after 3 consecutive losses
    MAX_POSITIONS = 1           # Only 1 position at a time
    
    # Leverage — LOW. Survival first.
    LEVERAGE = 3
    
    # Stops — WIDE. Let the trade breathe.
    STOP_LOSS_PCT = 0.025       # 2.5% stop loss (7.5% account at 3x)
    TAKE_PROFIT_PCT = 0.05      # 5.0% take profit (15% account at 3x) → 2:1 R:R
    
    # Trailing stop
    TRAILING_ACTIVATION_PCT = 0.02   # Activate after 2% in profit
    TRAILING_DISTANCE_PCT = 0.012    # Trail 1.2% behind price
    
    # Signal thresholds
    MIN_TREND_SCORE = 40        # Need strong trend (not wishy-washy)
    MIN_SIGNAL_CONFIDENCE = 70  # High bar for entry
    
    # Timing
    SIGNAL_INTERVAL = 300       # Check for signals every 5 minutes
    POSITION_CHECK_INTERVAL = 30 # Monitor positions every 30s
    MIN_BETWEEN_TRADES = 600    # Minimum 10 minutes between trades
    
    # Indicators
    EMA_FAST = 9
    EMA_SLOW = 21
    EMA_TREND = 50
    RSI_PERIOD = 14
    ATR_PERIOD = 14
    VOLUME_LOOKBACK = 20
    
    # Funding
    FUNDING_EDGE_THRESHOLD = 0.0003  # Only use as edge when significant


# ═══════════════════════════════════════════════════════════════
# TECHNICAL ANALYSIS
# ═══════════════════════════════════════════════════════════════

class TA:
    """Clean technical analysis functions."""
    
    @staticmethod
    def ema(prices: List[float], period: int) -> Optional[float]:
        if len(prices) < period:
            return None
        mult = 2 / (period + 1)
        val = sum(prices[:period]) / period
        for p in prices[period:]:
            val = (p - val) * mult + val
        return val
    
    @staticmethod
    def ema_series(prices: List[float], period: int) -> List[float]:
        """Full EMA series for crossover detection."""
        if len(prices) < period:
            return []
        mult = 2 / (period + 1)
        val = sum(prices[:period]) / period
        result = [val]
        for p in prices[period:]:
            val = (p - val) * mult + val
            result.append(val)
        return result
    
    @staticmethod
    def rsi(closes: List[float], period: int = 14) -> Optional[float]:
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
    def atr(candles: List[Dict], period: int = 14) -> Optional[float]:
        if len(candles) < period + 1:
            return None
        trs = []
        for i in range(1, len(candles)):
            h = float(candles[i]['h'])
            l = float(candles[i]['l'])
            pc = float(candles[i-1]['c'])
            trs.append(max(h - l, abs(h - pc), abs(l - pc)))
        return statistics.mean(trs[-period:])
    
    @staticmethod
    def volume_ratio(candles: List[Dict], lookback: int = 20) -> float:
        """Current volume vs average."""
        if len(candles) < lookback + 1:
            return 1.0
        vols = [float(c['v']) for c in candles[-(lookback+1):-1]]
        curr = float(candles[-1]['v'])
        avg = statistics.mean(vols) if vols else 1.0
        return curr / avg if avg > 0 else 1.0
    
    @staticmethod
    def is_bullish_structure(candles: List[Dict], lookback: int = 20) -> bool:
        """Higher highs and higher lows."""
        if len(candles) < lookback:
            return False
        half = lookback // 2
        first_half = candles[-lookback:-half]
        second_half = candles[-half:]
        
        fh_high = max(float(c['h']) for c in first_half)
        fh_low = min(float(c['l']) for c in first_half)
        sh_high = max(float(c['h']) for c in second_half)
        sh_low = min(float(c['l']) for c in second_half)
        
        return sh_high > fh_high and sh_low > fh_low
    
    @staticmethod
    def is_bearish_structure(candles: List[Dict], lookback: int = 20) -> bool:
        """Lower highs and lower lows."""
        if len(candles) < lookback:
            return False
        half = lookback // 2
        first_half = candles[-lookback:-half]
        second_half = candles[-half:]
        
        fh_high = max(float(c['h']) for c in first_half)
        fh_low = min(float(c['l']) for c in first_half)
        sh_high = max(float(c['h']) for c in second_half)
        sh_low = min(float(c['l']) for c in second_half)
        
        return sh_high < fh_high and sh_low < fh_low


# ═══════════════════════════════════════════════════════════════
# TREND ENGINE — The core edge
# ═══════════════════════════════════════════════════════════════

class TrendEngine:
    """
    Multi-timeframe trend detection.
    
    Rules:
    - 1h EMA stack determines primary trend direction
    - 4h confirms (no 4h confirmation = no trade)
    - 15m is for entry timing only
    
    Score: -100 (strong down) to +100 (strong up)
    Only trade when |score| >= MIN_TREND_SCORE
    """
    
    @staticmethod
    def score_timeframe(candles: List[Dict]) -> float:
        """Score a single timeframe from -100 to +100."""
        if not candles or len(candles) < 55:
            return 0.0
        
        closes = [float(c['c']) for c in candles]
        price = closes[-1]
        
        ema9 = TA.ema(closes, 9)
        ema21 = TA.ema(closes, 21)
        ema50 = TA.ema(closes, 50)
        
        if None in (ema9, ema21, ema50):
            return 0.0
        
        score = 0.0
        
        # EMA stacking (40 points)
        if ema9 > ema21 > ema50:
            score += 40
        elif ema9 < ema21 < ema50:
            score -= 40
        elif ema9 > ema21:
            score += 15
        elif ema9 < ema21:
            score -= 15
        
        # Price position relative to EMAs (30 points)
        above_count = sum([price > ema9, price > ema21, price > ema50])
        score += (above_count - 1.5) * 20  # -30 to +30
        
        # Market structure (30 points)
        if TA.is_bullish_structure(candles):
            score += 30
        elif TA.is_bearish_structure(candles):
            score -= 30
        
        return max(-100, min(100, score))
    
    @staticmethod
    def get_trend(candles_1h: List[Dict], candles_4h: List[Dict]) -> Tuple[float, str]:
        """
        Get overall trend score and allowed direction.
        
        Returns (score, direction) where direction is:
        - 'LONG' : only longs allowed
        - 'SHORT': only shorts allowed  
        - 'NONE' : no trades (unclear trend)
        """
        score_1h = TrendEngine.score_timeframe(candles_1h)
        score_4h = TrendEngine.score_timeframe(candles_4h)
        
        # Weighted: 4h matters more (it's the "truth")
        combined = score_1h * 0.4 + score_4h * 0.6
        
        # Both timeframes must agree on direction
        if score_1h > 0 and score_4h > 0 and combined >= Config.MIN_TREND_SCORE:
            return combined, 'LONG'
        elif score_1h < 0 and score_4h < 0 and combined <= -Config.MIN_TREND_SCORE:
            return combined, 'SHORT'
        else:
            return combined, 'NONE'


# ═══════════════════════════════════════════════════════════════
# SIGNAL GENERATOR — Entry timing on 15m
# ═══════════════════════════════════════════════════════════════

@dataclass
class Signal:
    side: str           # 'LONG' or 'SHORT'
    confidence: float   # 0-100
    entry_price: float
    stop_loss: float
    take_profit: float
    reasons: List[str] = field(default_factory=list)
    trend_score: float = 0.0
    funding_rate: float = 0.0


class SignalGenerator:
    """
    Generate entry signals on 15m timeframe.
    Only called when trend direction is confirmed.
    
    Entry criteria (ALL must be true):
    1. EMA9 > EMA21 (for longs) or EMA9 < EMA21 (for shorts) on 15m
    2. RSI not overbought/oversold (no chasing)
    3. Price pulling back toward EMA21 (buy the dip, not the top)
    4. Volume above average (confirm participation)
    """
    
    @staticmethod
    def generate(candles_15m: List[Dict], direction: str, trend_score: float,
                 funding_rate: float) -> Optional[Signal]:
        if not candles_15m or len(candles_15m) < 55:
            return None
        
        closes = [float(c['c']) for c in candles_15m]
        price = closes[-1]
        
        ema9 = TA.ema(closes, Config.EMA_FAST)
        ema21 = TA.ema(closes, Config.EMA_SLOW)
        ema50 = TA.ema(closes, Config.EMA_TREND)
        rsi = TA.rsi(closes, Config.RSI_PERIOD)
        atr = TA.atr(candles_15m, Config.ATR_PERIOD)
        vol_ratio = TA.volume_ratio(candles_15m, Config.VOLUME_LOOKBACK)
        
        if None in (ema9, ema21, ema50, rsi, atr):
            return None
        
        confidence = 0
        reasons = []
        
        if direction == 'LONG':
            # ── LONG ENTRY CONDITIONS ──
            
            # 1. EMA alignment on 15m (required)
            if ema9 <= ema21:
                return None  # 15m not aligned with trend
            
            confidence += 25
            reasons.append(f"15m EMA9 > EMA21")
            
            # 2. Price near EMA21 (pullback entry, not chasing)
            distance_to_ema21 = (price - ema21) / ema21
            if distance_to_ema21 < 0.005:  # Within 0.5% of EMA21
                confidence += 20
                reasons.append(f"Pullback to EMA21 ({distance_to_ema21*100:.2f}%)")
            elif distance_to_ema21 < 0.01:  # Within 1%
                confidence += 10
                reasons.append(f"Near EMA21 ({distance_to_ema21*100:.2f}%)")
            else:
                # Too extended — skip
                return None
            
            # 3. RSI check (not overbought)
            if 35 <= rsi <= 55:
                confidence += 15
                reasons.append(f"RSI pullback zone ({rsi:.0f})")
            elif 55 < rsi <= 65:
                confidence += 5
                reasons.append(f"RSI neutral ({rsi:.0f})")
            elif rsi > 70:
                return None  # Overbought, don't chase
            
            # 4. Volume confirmation
            if vol_ratio >= 1.5:
                confidence += 15
                reasons.append(f"Volume {vol_ratio:.1f}x avg")
            elif vol_ratio >= 1.0:
                confidence += 5
                reasons.append(f"Volume OK ({vol_ratio:.1f}x)")
            
            # 5. Bullish candle pattern (last 2 candles)
            if closes[-1] > closes[-2] and closes[-2] > float(candles_15m[-2]['o']):
                confidence += 10
                reasons.append("Bullish candles")
            
            # 6. Price above EMA50 (trend support)
            if price > ema50:
                confidence += 10
                reasons.append("Above EMA50")
            
            # 7. Funding rate edge
            if funding_rate < -Config.FUNDING_EDGE_THRESHOLD:
                confidence += 5
                reasons.append(f"Funding favors longs ({funding_rate:.5f})")
            elif funding_rate > Config.FUNDING_EDGE_THRESHOLD:
                confidence -= 5  # Penalty — paying funding
                reasons.append(f"Funding against longs ({funding_rate:.5f})")
            
            # Calculate stops
            stop_loss = price * (1 - Config.STOP_LOSS_PCT)
            take_profit = price * (1 + Config.TAKE_PROFIT_PCT)
            
        elif direction == 'SHORT':
            # ── SHORT ENTRY CONDITIONS ──
            
            if ema9 >= ema21:
                return None
            
            confidence += 25
            reasons.append(f"15m EMA9 < EMA21")
            
            distance_to_ema21 = (ema21 - price) / ema21
            if distance_to_ema21 < 0.005:
                confidence += 20
                reasons.append(f"Rally to EMA21 ({distance_to_ema21*100:.2f}%)")
            elif distance_to_ema21 < 0.01:
                confidence += 10
                reasons.append(f"Near EMA21 ({distance_to_ema21*100:.2f}%)")
            else:
                return None
            
            if 45 <= rsi <= 65:
                confidence += 15
                reasons.append(f"RSI rally zone ({rsi:.0f})")
            elif 35 <= rsi < 45:
                confidence += 5
                reasons.append(f"RSI neutral ({rsi:.0f})")
            elif rsi < 30:
                return None
            
            if vol_ratio >= 1.5:
                confidence += 15
                reasons.append(f"Volume {vol_ratio:.1f}x avg")
            elif vol_ratio >= 1.0:
                confidence += 5
                reasons.append(f"Volume OK ({vol_ratio:.1f}x)")
            
            if closes[-1] < closes[-2] and closes[-2] < float(candles_15m[-2]['o']):
                confidence += 10
                reasons.append("Bearish candles")
            
            if price < ema50:
                confidence += 10
                reasons.append("Below EMA50")
            
            if funding_rate > Config.FUNDING_EDGE_THRESHOLD:
                confidence += 5
                reasons.append(f"Funding favors shorts ({funding_rate:.5f})")
            elif funding_rate < -Config.FUNDING_EDGE_THRESHOLD:
                confidence -= 5
                reasons.append(f"Funding against shorts ({funding_rate:.5f})")
            
            stop_loss = price * (1 + Config.STOP_LOSS_PCT)
            take_profit = price * (1 - Config.TAKE_PROFIT_PCT)
        else:
            return None
        
        if confidence < Config.MIN_SIGNAL_CONFIDENCE:
            return None
        
        return Signal(
            side=direction,
            confidence=min(confidence, 100),
            entry_price=price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            reasons=reasons,
            trend_score=trend_score,
            funding_rate=funding_rate
        )


# ═══════════════════════════════════════════════════════════════
# POSITION MANAGER — Trailing stops & exits
# ═══════════════════════════════════════════════════════════════

@dataclass 
class Position:
    side: str
    entry_price: float
    size_coins: float
    size_usd: float
    stop_loss: float
    take_profit: float
    trailing_active: bool = False
    trailing_stop: float = 0.0
    highest_price: float = 0.0  # For longs
    lowest_price: float = 999999.0  # For shorts
    entry_time: str = ""
    reasons: List[str] = field(default_factory=list)
    trend_score: float = 0.0


class PositionManager:
    """Manage open position with trailing stop."""
    
    @staticmethod
    def check_exit(pos: Position, current_price: float) -> Tuple[bool, str, float]:
        """
        Check if position should be closed.
        Returns (should_exit, reason, estimated_pnl).
        """
        if pos.side == 'LONG':
            pnl = (current_price - pos.entry_price) / pos.entry_price
            
            # Update high water mark
            if current_price > pos.highest_price:
                pos.highest_price = current_price
            
            # Hard stop loss
            if current_price <= pos.stop_loss:
                pnl_usd = (current_price - pos.entry_price) * pos.size_coins
                return True, "STOP_LOSS", pnl_usd
            
            # Trailing stop logic
            if pnl >= Config.TRAILING_ACTIVATION_PCT:
                pos.trailing_active = True
                new_trail = current_price * (1 - Config.TRAILING_DISTANCE_PCT)
                if new_trail > pos.trailing_stop:
                    pos.trailing_stop = new_trail
                
                if current_price <= pos.trailing_stop:
                    pnl_usd = (current_price - pos.entry_price) * pos.size_coins
                    return True, f"TRAILING_STOP (locked from ${pos.highest_price:,.0f})", pnl_usd
            
            # Take profit (only if trailing not active — let winners run)
            if not pos.trailing_active and current_price >= pos.take_profit:
                pnl_usd = (current_price - pos.entry_price) * pos.size_coins
                return True, "TAKE_PROFIT", pnl_usd
            
            # Time-based exit: if in profit after 4 hours and trailing not activated
            entry_dt = datetime.fromisoformat(pos.entry_time) if pos.entry_time else datetime.now()
            hours_held = (datetime.now() - entry_dt).total_seconds() / 3600
            if hours_held > 4 and pnl > 0.005 and not pos.trailing_active:
                pnl_usd = (current_price - pos.entry_price) * pos.size_coins
                return True, f"TIME_EXIT (held {hours_held:.1f}h, +{pnl*100:.2f}%)", pnl_usd
                
        elif pos.side == 'SHORT':
            pnl = (pos.entry_price - current_price) / pos.entry_price
            
            if current_price < pos.lowest_price:
                pos.lowest_price = current_price
            
            if current_price >= pos.stop_loss:
                pnl_usd = (pos.entry_price - current_price) * pos.size_coins
                return True, "STOP_LOSS", pnl_usd
            
            if pnl >= Config.TRAILING_ACTIVATION_PCT:
                pos.trailing_active = True
                new_trail = current_price * (1 + Config.TRAILING_DISTANCE_PCT)
                if new_trail < pos.trailing_stop or pos.trailing_stop == 0:
                    pos.trailing_stop = new_trail
                
                if current_price >= pos.trailing_stop:
                    pnl_usd = (pos.entry_price - current_price) * pos.size_coins
                    return True, f"TRAILING_STOP (locked from ${pos.lowest_price:,.0f})", pnl_usd
            
            if not pos.trailing_active and current_price <= pos.take_profit:
                pnl_usd = (pos.entry_price - current_price) * pos.size_coins
                return True, "TAKE_PROFIT", pnl_usd
            
            entry_dt = datetime.fromisoformat(pos.entry_time) if pos.entry_time else datetime.now()
            hours_held = (datetime.now() - entry_dt).total_seconds() / 3600
            if hours_held > 4 and pnl > 0.005 and not pos.trailing_active:
                pnl_usd = (pos.entry_price - current_price) * pos.size_coins
                return True, f"TIME_EXIT (held {hours_held:.1f}h, +{pnl*100:.2f}%)", pnl_usd
        
        return False, "", 0.0


# ═══════════════════════════════════════════════════════════════
# RISK MANAGER
# ═══════════════════════════════════════════════════════════════

@dataclass
class RiskState:
    daily_pnl: float = 0.0
    daily_trades: int = 0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    consecutive_losses: int = 0
    paused_until: str = ""
    last_trade_time: str = ""
    last_reset_date: str = ""
    trade_log: List[Dict] = field(default_factory=list)


class RiskManager:
    def __init__(self):
        self.state = self._load()
    
    def _load(self) -> RiskState:
        try:
            with open("scalping_state_v3.json", 'r') as f:
                data = json.load(f)
                return RiskState(**data)
        except:
            return RiskState(last_reset_date=datetime.now().strftime("%Y-%m-%d"))
    
    def save(self):
        try:
            with open("scalping_state_v3.json", 'w') as f:
                json.dump({
                    "daily_pnl": self.state.daily_pnl,
                    "daily_trades": self.state.daily_trades,
                    "total_trades": self.state.total_trades,
                    "winning_trades": self.state.winning_trades,
                    "losing_trades": self.state.losing_trades,
                    "consecutive_losses": self.state.consecutive_losses,
                    "paused_until": self.state.paused_until,
                    "last_trade_time": self.state.last_trade_time,
                    "last_reset_date": self.state.last_reset_date,
                    "trade_log": self.state.trade_log[-50:]  # Keep last 50
                }, f, indent=2)
        except Exception as e:
            print(f"⚠️ State save error: {e}")
    
    def can_trade(self) -> Tuple[bool, str]:
        # Daily reset
        today = datetime.now().strftime("%Y-%m-%d")
        if self.state.last_reset_date != today:
            self.state.daily_pnl = 0.0
            self.state.daily_trades = 0
            self.state.last_reset_date = today
        
        # Pause check
        if self.state.paused_until:
            pause_dt = datetime.fromisoformat(self.state.paused_until)
            if datetime.now() < pause_dt:
                mins = (pause_dt - datetime.now()).total_seconds() / 60
                return False, f"Paused ({mins:.0f}m remaining)"
            self.state.paused_until = ""
            self.state.consecutive_losses = 0
        
        if self.state.daily_pnl <= -Config.MAX_DAILY_LOSS:
            return False, f"Daily loss limit (${abs(self.state.daily_pnl):.2f})"
        
        if self.state.daily_trades >= Config.MAX_DAILY_TRADES:
            return False, f"Max daily trades ({Config.MAX_DAILY_TRADES})"
        
        if self.state.consecutive_losses >= Config.MAX_CONSECUTIVE_LOSSES:
            self.state.paused_until = (datetime.now() + timedelta(minutes=Config.PAUSE_MINUTES)).isoformat()
            self.save()
            return False, f"3 consecutive losses — pausing {Config.PAUSE_MINUTES}m"
        
        # Min time between trades
        if self.state.last_trade_time:
            last = datetime.fromisoformat(self.state.last_trade_time)
            elapsed = (datetime.now() - last).total_seconds()
            if elapsed < Config.MIN_BETWEEN_TRADES:
                return False, f"Cooldown ({Config.MIN_BETWEEN_TRADES - elapsed:.0f}s)"
        
        return True, "OK"
    
    def record_trade(self, pnl: float, signal: Signal, exit_reason: str):
        is_win = pnl > 0
        self.state.daily_pnl += pnl
        self.state.daily_trades += 1
        self.state.total_trades += 1
        self.state.last_trade_time = datetime.now().isoformat()
        
        if is_win:
            self.state.winning_trades += 1
            self.state.consecutive_losses = 0
        else:
            self.state.losing_trades += 1
            self.state.consecutive_losses += 1
        
        self.state.trade_log.append({
            "time": datetime.now().isoformat(),
            "side": signal.side,
            "entry": signal.entry_price,
            "pnl": round(pnl, 2),
            "exit_reason": exit_reason,
            "confidence": signal.confidence,
            "trend_score": signal.trend_score
        })
        
        self.save()


# ═══════════════════════════════════════════════════════════════
# MARKET DATA
# ═══════════════════════════════════════════════════════════════

class MarketData:
    def __init__(self, info: Info):
        self.info = info
        self._cache = {}
        self._cache_time = {}
    
    def get_price(self, asset: str = "BTC") -> Optional[float]:
        try:
            mids = self.info.all_mids()
            return float(mids.get(asset, 0))
        except Exception as e:
            print(f"❌ Price error: {e}")
            return None
    
    def get_funding(self, asset: str = "BTC") -> float:
        try:
            meta = self.info.meta()
            ctxs = self.info.meta_and_asset_ctxs()
            if ctxs and len(ctxs) > 1:
                for i, item in enumerate(meta.get("universe", [])):
                    if item.get("name") == asset and i < len(ctxs[1]):
                        return float(ctxs[1][i].get("funding", 0))
        except:
            pass
        return 0.0
    
    def get_candles(self, asset: str, tf: str, bars: int = 200) -> Optional[List[Dict]]:
        # Simple cache: don't re-fetch within 30 seconds
        cache_key = f"{asset}_{tf}"
        now = time.time()
        if cache_key in self._cache_time and now - self._cache_time[cache_key] < 30:
            return self._cache.get(cache_key)
        
        try:
            now_ms = int(now * 1000)
            tf_min = {"1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240}
            mins = tf_min.get(tf, 15)
            lookback = bars * mins * 60 * 1000
            result = self.info.candles_snapshot(asset, tf, now_ms - lookback, now_ms)
            self._cache[cache_key] = result
            self._cache_time[cache_key] = now
            return result
        except Exception as e:
            print(f"❌ Candle error ({tf}): {e}")
            return None


# ═══════════════════════════════════════════════════════════════
# MAIN BOT
# ═══════════════════════════════════════════════════════════════

class HyperliquidBotV3:
    def __init__(self):
        print("=" * 60)
        print("  HYPERLIQUID BOT V3 — TREND FOLLOWER")
        print("  Quality over Quantity. Follow the trend.")
        print("=" * 60)
        print(f"  Mode: {'PAPER' if PAPER_TRADING else '🔴 LIVE'}")
        print(f"  Leverage: {Config.LEVERAGE}x")
        print(f"  Stop Loss: {Config.STOP_LOSS_PCT*100:.1f}%")
        print(f"  Take Profit: {Config.TAKE_PROFIT_PCT*100:.1f}%")
        print(f"  Risk/Trade: {Config.RISK_PER_TRADE*100:.1f}%")
        print(f"  Max Trades/Day: {Config.MAX_DAILY_TRADES}")
        print(f"  Signal Check: Every {Config.SIGNAL_INTERVAL}s")
        print("=" * 60)
        
        # Load config
        try:
            with open(".hyperliquid_config.json", 'r') as f:
                cfg = json.load(f)
            self.wallet = cfg["public_wallet"]
            self.api_key = cfg["api_private_key"]
        except FileNotFoundError:
            raise ValueError("Missing .hyperliquid_config.json")
        
        self.info = Info(skip_ws=True)
        account = Account.from_key(self.api_key)
        self.exchange = Exchange(account, account_address=self.wallet)
        self.market = MarketData(self.info)
        self.risk = RiskManager()
        self.position: Optional[Position] = None
        self.current_signal: Optional[Signal] = None
        
        # Load any existing position from state
        self._load_position()
        
        balance = self.get_balance()
        if balance:
            print(f"\n  💰 Balance: ${balance:.2f}")
            print(f"  📊 Risk/trade: ${balance * Config.RISK_PER_TRADE:.2f}")
        
        stats = self.risk.state
        if stats.total_trades > 0:
            wr = stats.winning_trades / stats.total_trades * 100
            print(f"  📈 History: {stats.total_trades} trades, {wr:.0f}% win rate")
            print(f"  💵 Today: ${stats.daily_pnl:.2f} ({stats.daily_trades} trades)")
        
        print()
    
    def _load_position(self):
        """Load position from state file if exists."""
        try:
            with open("position_v3.json", 'r') as f:
                data = json.load(f)
            self.position = Position(**data)
            print(f"  📋 Restored position: {self.position.side} @ ${self.position.entry_price:,.2f}")
        except:
            self.position = None
    
    def _save_position(self):
        """Save current position to file."""
        if self.position:
            with open("position_v3.json", 'w') as f:
                json.dump({
                    "side": self.position.side,
                    "entry_price": self.position.entry_price,
                    "size_coins": self.position.size_coins,
                    "size_usd": self.position.size_usd,
                    "stop_loss": self.position.stop_loss,
                    "take_profit": self.position.take_profit,
                    "trailing_active": self.position.trailing_active,
                    "trailing_stop": self.position.trailing_stop,
                    "highest_price": self.position.highest_price,
                    "lowest_price": self.position.lowest_price,
                    "entry_time": self.position.entry_time,
                    "reasons": self.position.reasons,
                    "trend_score": self.position.trend_score
                }, f, indent=2)
        else:
            try:
                os.remove("position_v3.json")
            except:
                pass
    
    def get_balance(self) -> Optional[float]:
        try:
            state = self.info.user_state(self.wallet)
            return float(state.get("marginSummary", {}).get("accountValue", 0))
        except:
            return None
    
    def analyze_and_trade(self):
        """Main analysis cycle. Called every SIGNAL_INTERVAL seconds."""
        
        # Don't look for new trades if we have a position
        if self.position:
            return
        
        can_trade, reason = self.risk.can_trade()
        if not can_trade:
            print(f"⏸️  {reason}")
            return
        
        price = self.market.get_price("BTC")
        if not price:
            return
        
        # ── Step 1: Get trend from 1h and 4h ──
        candles_1h = self.market.get_candles("BTC", "1h", 200)
        candles_4h = self.market.get_candles("BTC", "4h", 200)
        
        if not candles_1h or not candles_4h:
            print("❌ Could not fetch 1h/4h candles")
            return
        
        trend_score, direction = TrendEngine.get_trend(candles_1h, candles_4h)
        
        print(f"\n{'─'*50}")
        print(f"📊 BTC ${price:,.2f} | Trend: {trend_score:+.0f} → {direction}")
        
        if direction == 'NONE':
            print(f"   No clear trend. Sitting out.")
            return
        
        # ── Step 2: Look for entry on 15m ──
        candles_15m = self.market.get_candles("BTC", "15m", 200)
        if not candles_15m:
            return
        
        funding = self.market.get_funding("BTC")
        signal = SignalGenerator.generate(candles_15m, direction, trend_score, funding)
        
        if not signal:
            print(f"   No entry signal on 15m.")
            return
        
        print(f"\n🎯 SIGNAL: {signal.side} | Confidence: {signal.confidence:.0f}%")
        for r in signal.reasons:
            print(f"   • {r}")
        
        # ── Step 3: Execute ──
        self.execute_trade(signal)
    
    def execute_trade(self, signal: Signal):
        """Place the trade."""
        balance = self.get_balance()
        if not balance:
            return
        
        # Position sizing: risk 1% of account
        risk_usd = balance * Config.RISK_PER_TRADE
        stop_distance_pct = Config.STOP_LOSS_PCT
        
        # Size = risk / (stop% * leverage)
        # At 3x, 2.5% stop = 7.5% position loss
        # Risk $5.85 / 7.5% = $78 position
        position_usd = risk_usd / (stop_distance_pct * Config.LEVERAGE)
        position_usd = max(10.0, min(position_usd, balance * 0.15))  # Cap at 15% of account
        
        size_coins = position_usd / signal.entry_price
        size_coins = round(size_coins, 5)
        
        # Minimum size
        if size_coins < 0.0001:
            size_coins = 0.0001
            position_usd = size_coins * signal.entry_price
        
        print(f"\n{'='*60}")
        print(f"  🚀 EXECUTING {signal.side}")
        print(f"{'='*60}")
        print(f"  Price:   ${signal.entry_price:,.2f}")
        print(f"  Size:    ${position_usd:.2f} ({size_coins:.5f} BTC)")
        print(f"  Lev:     {Config.LEVERAGE}x")
        print(f"  Stop:    ${signal.stop_loss:,.2f} (-{Config.STOP_LOSS_PCT*100:.1f}%)")
        print(f"  Target:  ${signal.take_profit:,.2f} (+{Config.TAKE_PROFIT_PCT*100:.1f}%)")
        print(f"  Risk:    ${risk_usd:.2f} ({Config.RISK_PER_TRADE*100:.0f}%)")
        print(f"  R:R:     1:{Config.TAKE_PROFIT_PCT/Config.STOP_LOSS_PCT:.1f}")
        
        try:
            is_buy = signal.side == 'LONG'
            
            if PAPER_TRADING:
                print(f"\n  📝 PAPER TRADE — not real")
            else:
                result = self.exchange.market_open(
                    "BTC", is_buy, size_coins,
                    px=None, slippage=0.005
                )
                print(f"\n  ✅ ORDER: {result}")
            
            # Track position
            self.position = Position(
                side=signal.side,
                entry_price=signal.entry_price,
                size_coins=size_coins,
                size_usd=position_usd,
                stop_loss=signal.stop_loss,
                take_profit=signal.take_profit,
                highest_price=signal.entry_price,
                lowest_price=signal.entry_price,
                entry_time=datetime.now().isoformat(),
                reasons=signal.reasons,
                trend_score=signal.trend_score
            )
            self.current_signal = signal
            self._save_position()
            
            print(f"{'='*60}\n")
            
        except Exception as e:
            print(f"  ❌ TRADE FAILED: {e}")
            traceback.print_exc()
    
    def monitor_position(self):
        """Check open position for exit conditions."""
        if not self.position:
            return
        
        price = self.market.get_price("BTC")
        if not price:
            return
        
        should_exit, reason, pnl_usd = PositionManager.check_exit(self.position, price)
        
        if should_exit:
            self.close_position(price, reason, pnl_usd)
        else:
            # Status update
            if self.position.side == 'LONG':
                pnl_pct = (price - self.position.entry_price) / self.position.entry_price * 100
                pnl_usd_est = (price - self.position.entry_price) * self.position.size_coins
            else:
                pnl_pct = (self.position.entry_price - price) / self.position.entry_price * 100
                pnl_usd_est = (self.position.entry_price - price) * self.position.size_coins
            
            trail_info = ""
            if self.position.trailing_active:
                trail_info = f" | Trail: ${self.position.trailing_stop:,.0f}"
            
            print(f"  💼 {self.position.side} ${price:,.0f} | P&L: ${pnl_usd_est:+.2f} ({pnl_pct:+.2f}%){trail_info}")
            self._save_position()
    
    def close_position(self, price: float, reason: str, pnl_usd: float):
        """Close the position."""
        print(f"\n{'='*60}")
        print(f"  📤 CLOSING: {reason}")
        print(f"  Entry: ${self.position.entry_price:,.2f} → Exit: ${price:,.2f}")
        print(f"  P&L: ${pnl_usd:+.2f}")
        
        try:
            if not PAPER_TRADING:
                result = self.exchange.market_close("BTC")
                print(f"  ✅ Closed: {result}")
            else:
                print(f"  📝 PAPER close")
        except Exception as e:
            print(f"  ❌ Close failed: {e}")
        
        # Record
        is_win = pnl_usd > 0
        if self.current_signal:
            self.risk.record_trade(pnl_usd, self.current_signal, reason)
        
        emoji = "✅" if is_win else "❌"
        wr = self.risk.state.winning_trades / max(1, self.risk.state.total_trades) * 100
        print(f"  {emoji} {'WIN' if is_win else 'LOSS'}")
        print(f"  📊 Record: {self.risk.state.winning_trades}W/{self.risk.state.losing_trades}L ({wr:.0f}%)")
        print(f"  💰 Today: ${self.risk.state.daily_pnl:+.2f}")
        print(f"{'='*60}\n")
        
        self.position = None
        self.current_signal = None
        self._save_position()
    
    def run(self):
        """Main loop."""
        print("🚀 Bot running. Ctrl+C to stop.\n")
        
        last_signal_check = 0
        last_position_check = 0
        
        while True:
            try:
                now = time.time()
                
                # Monitor position frequently
                if now - last_position_check >= Config.POSITION_CHECK_INTERVAL:
                    self.monitor_position()
                    last_position_check = now
                
                # Look for new signals less frequently
                if now - last_signal_check >= Config.SIGNAL_INTERVAL:
                    self.analyze_and_trade()
                    last_signal_check = now
                
                time.sleep(5)
                
            except KeyboardInterrupt:
                print("\n⏹️  Shutting down.")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                traceback.print_exc()
                time.sleep(10)


if __name__ == "__main__":
    bot = HyperliquidBotV3()
    bot.run()
