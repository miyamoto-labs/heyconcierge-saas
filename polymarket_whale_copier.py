#!/usr/bin/env python3
"""
Polymarket Whale Copier - Multi-Strategy Copy Trading Bot
==========================================================
Tracks top Polymarket whale wallets and copies their trades in real-time.

Strategies:
1. Whale Copy Trading - Follow top 10+ whales, copy within seconds
2. Smart Money Tracking - Weight by historical win rate (>70%)
3. Contrarian on Dumb Money - Follow whales when they disagree with retail
4. Event-Driven - Monitor high-volume markets for sudden whale moves
5. Market Making - Place limit orders when spreads > 5%

APIs Used:
- Gamma API: https://gamma-api.polymarket.com (market discovery)
- CLOB API: https://clob.polymarket.com (orderbook, prices, trading)
- Data API: https://data-api.polymarket.com (positions, activity)
- WebSocket: wss://ws-subscriptions-clob.polymarket.com/ws/ (real-time)

Author: Miyamoto Labs
"""

import os
import sys
import json
import time
import math
import logging
import hashlib
import asyncio
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path

import requests

# Try importing websocket and CLOB client
try:
    import websocket
    HAS_WEBSOCKET = True
except ImportError:
    HAS_WEBSOCKET = False

# Add py-clob-client to path if available
CLOB_CLIENT_PATH = os.path.join(os.path.dirname(__file__), "py-clob-client")
if os.path.exists(CLOB_CLIENT_PATH):
    sys.path.insert(0, CLOB_CLIENT_PATH)

try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import OrderArgs, OrderType
    HAS_CLOB_CLIENT = True
except ImportError:
    HAS_CLOB_CLIENT = False

# ============================================================================
# CONFIGURATION
# ============================================================================

PAPER_TRADING = True  # SAFETY: Paper mode by default
LOG_FILE = os.path.join(os.path.dirname(__file__), "polymarket_whale_copier.log")
WHALE_DB_FILE = os.path.join(os.path.dirname(__file__), "polymarket_whale_database.json")
STATE_FILE = os.path.join(os.path.dirname(__file__), ".whale_copier_state.json")

# API endpoints
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"
DATA_API = "https://data-api.polymarket.com"
WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market"

# Wallet config (from existing superbot)
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
CHAIN_ID = 137  # Polygon

# Capital & Risk Management
STARTING_BANKROLL = 1000.0  # Paper trading bankroll
MAX_POSITION_PCT = 0.10     # Max 10% of bankroll per trade
MAX_TOTAL_EXPOSURE_PCT = 0.30  # Max 30% total exposure
MAX_DAILY_TRADES = 20
MAX_DAILY_LOSS_PCT = 0.05   # Stop if down 5%

# Strategy weights
STRATEGY_WEIGHTS = {
    "whale_copy": 0.35,
    "smart_money": 0.25,
    "contrarian": 0.15,
    "event_driven": 0.15,
    "market_making": 0.10,
}

# Polling intervals
WHALE_POLL_INTERVAL = 60      # Check whale activity every 60s
MARKET_SCAN_INTERVAL = 300    # Scan markets every 5 min
SPREAD_CHECK_INTERVAL = 120   # Check spreads every 2 min

# ============================================================================
# WHALE DATABASE
# ============================================================================

# Top whales with known wallet addresses and Polymarket usernames
# Addresses are proxy wallets on Polygon
WHALE_WALLETS = {
    # === THÉO CLUSTER (French Whale - ~$85M total) ===
    "Theo4": {
        "address": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
        "pnl": 22_053_934,
        "win_rate": 0.67,
        "specialty": ["politics", "elections"],
        "volume": 43_251_303,
        "trust_score": 0.95,
        "notes": "French Whale main account. Private polling edge.",
    },
    "Fredi9999": {
        "address": "0x3b90fb6b60c8e8f57f9e0a8d35fe4f7c30c07e91",
        "pnl": 16_619_507,
        "win_rate": 0.67,
        "specialty": ["politics", "elections"],
        "volume": 76_643_457,
        "trust_score": 0.95,
        "notes": "French Whale account 2. Same cluster as Theo4.",
    },
    # === OTHER TOP LEADERBOARD WHALES ===
    "kch123": {
        "address": None,  # Unknown - market maker, very high volume
        "pnl": 9_372_835,
        "win_rate": 0.52,
        "specialty": ["market_making"],
        "volume": 228_991_116,
        "trust_score": 0.60,  # Lower trust - MM not great for copy trading
        "notes": "Market maker. High volume, low edge per trade.",
    },
    "Len9311238": {
        "address": None,
        "pnl": 8_709_973,
        "win_rate": 0.65,
        "specialty": ["politics"],
        "volume": 16_415_857,
        "trust_score": 0.85,
        "notes": "Concentrated political bets. Good PnL/volume ratio.",
    },
    "RepTrump": {
        "address": None,
        "pnl": 7_532_410,
        "win_rate": 0.70,
        "specialty": ["politics"],
        "volume": None,
        "trust_score": 0.80,
        "notes": "Political conviction trader.",
    },
    "ImJustKen": {
        "address": "0x9d84ce0306f8551e02efef1680475fc0f1dc1344",
        "pnl": 2_400_000,
        "win_rate": 0.72,
        "specialty": ["politics"],
        "volume": None,
        "trust_score": 0.85,
        "notes": "Political specialist with strong win rate.",
    },
    "fengdubiying": {
        "address": "0x17db3fcd93ba12d38382a0cade24b200185c5f6d",
        "pnl": 2_900_000,
        "win_rate": 0.61,
        "specialty": ["esports"],
        "volume": None,
        "trust_score": 0.75,
        "notes": "Esports specialist.",
    },
    "Walrus": {
        "address": "0xfde62dd29574bab38f9f3e4f1da3c1b98c67dfb8",
        "pnl": 1_300_000,
        "win_rate": 0.65,
        "specialty": ["crypto"],
        "volume": None,
        "trust_score": 0.80,
        "notes": "Crypto price markets specialist.",
    },
    "Domer": {
        "address": "0x7bce56c30bb2e09c33ed0b4a68a5c0b6e8c6dc97",
        "pnl": 1_200_000,
        "win_rate": 0.69,
        "specialty": ["politics"],
        "volume": None,
        "trust_score": 0.80,
        "notes": "Political specialist.",
    },
    "Beachboy4": {
        "address": None,
        "pnl": 6_120_000,
        "win_rate": 0.54,
        "specialty": ["sports"],
        "volume": None,
        "trust_score": 0.60,
        "notes": "Sports whale. Made $6.12M in single day. High variance.",
    },
    "Axios": {
        "address": None,
        "pnl": 200_000,
        "win_rate": 0.96,
        "specialty": ["mentions"],
        "volume": None,
        "trust_score": 0.90,
        "notes": "96% win rate on mentions markets. Info edge.",
    },
    "WindWalk3": {
        "address": None,
        "pnl": 500_000,
        "win_rate": 0.58,
        "specialty": ["politics", "sports"],
        "volume": None,
        "trust_score": 0.70,
    },
}

# ============================================================================
# DATA CLASSES
# ============================================================================

class Side(Enum):
    BUY = "buy"
    SELL = "sell"

class Strategy(Enum):
    WHALE_COPY = "whale_copy"
    SMART_MONEY = "smart_money"
    CONTRARIAN = "contrarian"
    EVENT_DRIVEN = "event_driven"
    MARKET_MAKING = "market_making"

@dataclass
class WhaleActivity:
    """Detected whale trading activity"""
    whale_name: str
    whale_address: Optional[str]
    market_slug: str
    market_question: str
    side: Side
    outcome: str  # "Yes" or "No"
    size_usd: float
    price: float
    timestamp: datetime
    whale_win_rate: float
    whale_trust_score: float

@dataclass
class TradeSignal:
    """A trade signal generated by any strategy"""
    strategy: Strategy
    market_slug: str
    market_question: str
    token_id: str
    side: Side
    outcome: str
    target_price: float
    size_usd: float
    confidence: float  # 0-1
    kelly_fraction: float
    reasoning: str
    whale_activity: Optional[WhaleActivity] = None
    expected_return: float = 0.0

@dataclass
class Position:
    """An active position"""
    id: str
    market_slug: str
    market_question: str
    token_id: str
    outcome: str
    side: Side
    entry_price: float
    size_usd: float
    shares: float
    strategy: Strategy
    opened_at: str
    current_price: float = 0.0
    pnl: float = 0.0

@dataclass
class BotState:
    """Persistent bot state"""
    bankroll: float = STARTING_BANKROLL
    total_pnl: float = 0.0
    daily_pnl: float = 0.0
    daily_trades: int = 0
    last_reset_date: str = ""
    positions: List[Dict] = field(default_factory=list)
    trade_history: List[Dict] = field(default_factory=list)
    whale_last_seen: Dict[str, str] = field(default_factory=dict)
    strategy_pnl: Dict[str, float] = field(default_factory=lambda: {s.value: 0.0 for s in Strategy})
    strategy_trades: Dict[str, int] = field(default_factory=lambda: {s.value: 0 for s in Strategy})
    strategy_wins: Dict[str, int] = field(default_factory=lambda: {s.value: 0 for s in Strategy})

# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging():
    logger = logging.getLogger("whale_copier")
    logger.setLevel(logging.INFO)
    
    # File handler
    fh = logging.FileHandler(LOG_FILE)
    fh.setLevel(logging.INFO)
    
    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    fh.setFormatter(fmt)
    ch.setFormatter(fmt)
    
    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger

log = setup_logging()

# ============================================================================
# API CLIENT
# ============================================================================

class PolymarketAPI:
    """Unified Polymarket API client"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "PolymarketWhaleBot/1.0",
        })
        self._cache = {}
        self._cache_ttl = {}
    
    def _get(self, url: str, params: dict = None, cache_seconds: int = 0) -> Any:
        cache_key = f"{url}:{json.dumps(params or {}, sort_keys=True)}"
        now = time.time()
        
        if cache_seconds > 0 and cache_key in self._cache:
            if now - self._cache_ttl.get(cache_key, 0) < cache_seconds:
                return self._cache[cache_key]
        
        # Rate limiting: 1 request per second
        if hasattr(self, '_last_request_time'):
            elapsed = now - self._last_request_time
            if elapsed < 1.0:
                time.sleep(1.0 - elapsed)
        self._last_request_time = time.time()
        
        try:
            resp = self.session.get(url, params=params, timeout=15)
            if resp.status_code == 429:
                log.warning(f"Rate limited on {url.split('/')[-1]}, waiting 5s...")
                time.sleep(5)
                resp = self.session.get(url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            
            if cache_seconds > 0:
                self._cache[cache_key] = data
                self._cache_ttl[cache_key] = now
            
            return data
        except Exception as e:
            log.error(f"API error {url}: {e}")
            return None
    
    # === GAMMA API (Market Discovery) ===
    
    def get_active_events(self, limit=50, order_by="volume24hr") -> List[dict]:
        """Get active events sorted by volume"""
        return self._get(
            f"{GAMMA_API}/events",
            {"limit": limit, "active": "true", "order": order_by, "ascending": "false"},
            cache_seconds=60,
        ) or []
    
    def get_markets(self, limit=100, active=True) -> List[dict]:
        """Get markets from Gamma API"""
        return self._get(
            f"{GAMMA_API}/markets",
            {"limit": limit, "active": str(active).lower()},
            cache_seconds=60,
        ) or []
    
    def search_markets(self, query: str) -> List[dict]:
        """Search markets"""
        return self._get(
            f"{GAMMA_API}/markets",
            {"slug_filter": query, "active": "true"},
            cache_seconds=30,
        ) or []
    
    # === CLOB API (Prices & Trading) ===
    
    def get_price(self, token_id: str) -> Optional[dict]:
        """Get current price for a token"""
        return self._get(f"{CLOB_API}/price", {"token_id": token_id})
    
    def get_midpoint(self, token_id: str) -> Optional[float]:
        """Get midpoint price"""
        data = self._get(f"{CLOB_API}/midpoint", {"token_id": token_id})
        if data and "mid" in data:
            return float(data["mid"])
        return None
    
    def get_orderbook(self, token_id: str) -> Optional[dict]:
        """Get orderbook for a token"""
        return self._get(f"{CLOB_API}/book", {"token_id": token_id})
    
    def get_spread(self, token_id: str) -> Optional[dict]:
        """Get bid-ask spread"""
        return self._get(f"{CLOB_API}/spread", {"token_id": token_id})
    
    def get_last_trade_price(self, token_id: str) -> Optional[dict]:
        """Get last trade price"""
        return self._get(f"{CLOB_API}/last-trade-price", {"token_id": token_id})
    
    def get_market_trades(self, condition_id: str, limit=50) -> List[dict]:
        """Get recent trades for a market via CLOB live-activity"""
        data = self._get(
            f"{CLOB_API}/live-activity/events/{condition_id}",
            {"limit": limit}
        )
        return data if isinstance(data, list) else []
    
    def get_simplified_markets(self) -> List[dict]:
        """Get simplified market data (fast)"""
        return self._get(f"{CLOB_API}/simplified-markets", cache_seconds=30) or []
    
    def get_sampling_markets(self) -> List[dict]:
        """Get sampling markets with more detail"""
        return self._get(f"{CLOB_API}/sampling-simplified-markets", cache_seconds=60) or []
    
    # === DATA API (User Data) ===
    
    def get_user_positions(self, address: str) -> List[dict]:
        """Get user positions"""
        return self._get(
            f"{DATA_API}/positions",
            {"user": address}
        ) or []
    
    def get_user_activity(self, address: str, limit=20) -> List[dict]:
        """Get user trading activity"""
        return self._get(
            f"{DATA_API}/activity",
            {"user": address, "limit": limit}
        ) or []
    
    def get_user_trades(self, address: str, limit=50) -> List[dict]:
        """Get user trade history"""
        return self._get(
            f"{DATA_API}/trades",
            {"user": address, "limit": limit}
        ) or []


# ============================================================================
# KELLY CRITERION POSITION SIZING
# ============================================================================

def kelly_criterion(win_prob: float, win_payout: float, loss_amount: float = 1.0) -> float:
    """
    Calculate Kelly Criterion fraction.
    
    Args:
        win_prob: Probability of winning (0-1)
        win_payout: Net payout on win (e.g., if you buy at 0.4 and win pays 1.0, payout = 0.6/0.4 = 1.5)
        loss_amount: Fraction lost on loss (usually 1.0 = lose entire bet)
    
    Returns:
        Optimal fraction of bankroll to bet (0-1), capped at 0.25 (quarter Kelly)
    """
    if win_prob <= 0 or win_prob >= 1 or win_payout <= 0:
        return 0.0
    
    # Kelly formula: f* = (bp - q) / b
    # where b = win_payout, p = win_prob, q = 1 - win_prob
    b = win_payout
    p = win_prob
    q = 1 - p
    
    kelly = (b * p - q) / b
    
    # Use quarter Kelly for safety
    kelly = max(0.0, kelly) * 0.25
    
    # Cap at max position size
    return min(kelly, MAX_POSITION_PCT)


# ============================================================================
# STRATEGY ENGINES
# ============================================================================

class WhaleCopyStrategy:
    """
    Strategy 1: Whale Copy Trading
    Monitor top whale wallets and copy their trades within seconds.
    """
    
    def __init__(self, api: PolymarketAPI):
        self.api = api
        self.tracked_whales = {
            name: info for name, info in WHALE_WALLETS.items()
            if info.get("address") and info["trust_score"] >= 0.70
        }
        self.last_activity: Dict[str, List[dict]] = {}
        log.info(f"🐋 Whale Copy: Tracking {len(self.tracked_whales)} whales with known addresses")
    
    def scan(self) -> List[TradeSignal]:
        """Scan whale wallets for new activity"""
        signals = []
        
        for name, info in self.tracked_whales.items():
            addr = info["address"]
            try:
                activity = self.api.get_user_activity(addr, limit=10)
                if not activity:
                    continue
                
                # Compare with last known activity
                prev = self.last_activity.get(name, [])
                prev_ids = {self._activity_id(a) for a in prev}
                
                new_trades = [a for a in activity if self._activity_id(a) not in prev_ids]
                self.last_activity[name] = activity
                
                for trade in new_trades:
                    signal = self._trade_to_signal(name, info, trade)
                    if signal:
                        signals.append(signal)
                        log.info(f"🐋 WHALE ALERT: {name} {'bought' if signal.side == Side.BUY else 'sold'} "
                                f"{signal.outcome} on {signal.market_question[:50]}... "
                                f"(${signal.size_usd:.0f})")
            
            except Exception as e:
                log.debug(f"Error scanning {name}: {e}")
        
        return signals
    
    def _activity_id(self, activity: dict) -> str:
        """Generate unique ID for an activity entry"""
        key = json.dumps(activity, sort_keys=True)
        return hashlib.md5(key.encode()).hexdigest()[:16]
    
    def _trade_to_signal(self, whale_name: str, whale_info: dict, activity: dict) -> Optional[TradeSignal]:
        """Convert a whale activity into a trade signal"""
        try:
            # Parse activity (format varies by endpoint)
            slug = activity.get("slug") or activity.get("eventSlug") or activity.get("market_slug", "")
            question = activity.get("title") or activity.get("question", "Unknown")
            outcome = activity.get("outcome", "Yes")
            size = float(activity.get("size") or activity.get("totalBought") or activity.get("usdcSize", 0))
            
            if size < 1000:  # Only copy trades > $1K
                return None
            
            # Calculate Kelly sizing based on whale's historical accuracy
            win_rate = whale_info["win_rate"]
            trust = whale_info["trust_score"]
            
            # Estimate price from activity
            price = float(activity.get("avgPrice") or activity.get("price", 0.5))
            if price <= 0 or price >= 1:
                price = 0.5
            
            win_payout = (1.0 - price) / price  # Net return if correct
            kelly = kelly_criterion(win_rate, win_payout)
            
            # Adjust by trust score and strategy weight
            adjusted_size = kelly * trust * STRATEGY_WEIGHTS["whale_copy"]
            
            return TradeSignal(
                strategy=Strategy.WHALE_COPY,
                market_slug=slug,
                market_question=question,
                token_id=activity.get("asset", ""),
                side=Side.BUY,
                outcome=outcome,
                target_price=price,
                size_usd=0,  # Will be calculated by position sizer
                confidence=trust * win_rate,
                kelly_fraction=adjusted_size,
                reasoning=f"Whale {whale_name} (WR:{win_rate:.0%}, PnL:${whale_info['pnl']:,}) bought {outcome} at {price:.2f}",
                whale_activity=WhaleActivity(
                    whale_name=whale_name,
                    whale_address=whale_info["address"],
                    market_slug=slug,
                    market_question=question,
                    side=Side.BUY,
                    outcome=outcome,
                    size_usd=size,
                    price=price,
                    timestamp=datetime.now(),
                    whale_win_rate=win_rate,
                    whale_trust_score=trust,
                ),
                expected_return=win_payout * win_rate - (1 - win_rate),
            )
        except Exception as e:
            log.debug(f"Error parsing whale activity: {e}")
            return None


class SmartMoneyStrategy:
    """
    Strategy 2: Smart Money Tracking
    Track wallets with >70% win rate, weight by accuracy.
    """
    
    def __init__(self, api: PolymarketAPI):
        self.api = api
        self.smart_wallets = {
            name: info for name, info in WHALE_WALLETS.items()
            if info["win_rate"] >= 0.70
        }
        log.info(f"🧠 Smart Money: Tracking {len(self.smart_wallets)} high-accuracy wallets (>70% WR)")
    
    def scan(self) -> List[TradeSignal]:
        """Look for consensus among smart money wallets on same markets"""
        signals = []
        
        # Collect all positions from smart wallets
        market_positions: Dict[str, List[Tuple[str, dict, dict]]] = {}
        
        for name, info in self.smart_wallets.items():
            if not info.get("address"):
                continue
            
            positions = self.api.get_user_positions(info["address"])
            for pos in (positions or []):
                slug = pos.get("eventSlug") or pos.get("slug", "")
                if slug:
                    if slug not in market_positions:
                        market_positions[slug] = []
                    market_positions[slug].append((name, info, pos))
        
        # Find markets where multiple smart wallets agree
        for slug, entries in market_positions.items():
            if len(entries) < 2:  # Need at least 2 smart wallets agreeing
                continue
            
            # Check if they're on the same side
            outcomes = {}
            for name, info, pos in entries:
                outcome = pos.get("outcome", "Yes")
                size = float(pos.get("currentValue", 0))
                if size > 0:
                    if outcome not in outcomes:
                        outcomes[outcome] = []
                    outcomes[outcome].append((name, info, size))
            
            for outcome, wallets in outcomes.items():
                if len(wallets) >= 2:
                    # Multiple smart wallets agree - generate signal
                    avg_win_rate = sum(w[1]["win_rate"] for w in wallets) / len(wallets)
                    total_conviction = sum(w[2] for w in wallets)
                    
                    signals.append(TradeSignal(
                        strategy=Strategy.SMART_MONEY,
                        market_slug=slug,
                        market_question=entries[0][2].get("title", slug),
                        token_id=entries[0][2].get("asset", ""),
                        side=Side.BUY,
                        outcome=outcome,
                        target_price=float(entries[0][2].get("curPrice", 0.5)),
                        size_usd=0,
                        confidence=min(0.95, avg_win_rate * (len(wallets) / 5)),
                        kelly_fraction=kelly_criterion(avg_win_rate, 1.0) * STRATEGY_WEIGHTS["smart_money"],
                        reasoning=f"Smart money consensus: {len(wallets)} wallets (avg WR:{avg_win_rate:.0%}) "
                                  f"on {outcome}. Total conviction: ${total_conviction:,.0f}",
                        expected_return=avg_win_rate - 0.5,
                    ))
        
        if signals:
            log.info(f"🧠 Smart Money: Found {len(signals)} consensus signals")
        return signals


class ContrarianStrategy:
    """
    Strategy 3: Contrarian on Dumb Money
    When retail piles one way and whales go the other, follow whales.
    """
    
    def __init__(self, api: PolymarketAPI):
        self.api = api
        log.info("🔄 Contrarian: Monitoring whale vs retail divergence")
    
    def scan(self) -> List[TradeSignal]:
        """Find markets where whale positions diverge from market prices"""
        signals = []
        
        # Get top volume markets
        events = self.api.get_active_events(limit=20)
        
        for event in events:
            markets = event.get("markets", [])
            for market in markets:
                try:
                    prices = json.loads(market.get("outcomePrices", "[]"))
                    if not prices or len(prices) < 2:
                        continue
                    
                    yes_price = float(prices[0])
                    
                    # Check if any tracked whales have positions opposing the market
                    for name, info in WHALE_WALLETS.items():
                        if not info.get("address") or info["trust_score"] < 0.80:
                            continue
                        
                        positions = self.api.get_user_positions(info["address"])
                        for pos in (positions or []):
                            if pos.get("eventSlug") == event.get("slug"):
                                pos_outcome = pos.get("outcome", "Yes")
                                pos_size = float(pos.get("currentValue", 0))
                                
                                # Contrarian: whale on Yes when market says No (price < 0.30)
                                # or whale on No when market says Yes (price > 0.70)
                                is_contrarian = (
                                    (pos_outcome == "Yes" and yes_price < 0.30 and pos_size > 5000) or
                                    (pos_outcome == "No" and yes_price > 0.70 and pos_size > 5000)
                                )
                                
                                if is_contrarian:
                                    signals.append(TradeSignal(
                                        strategy=Strategy.CONTRARIAN,
                                        market_slug=market.get("slug", ""),
                                        market_question=market.get("question", ""),
                                        token_id="",
                                        side=Side.BUY,
                                        outcome=pos_outcome,
                                        target_price=yes_price if pos_outcome == "Yes" else 1 - yes_price,
                                        size_usd=0,
                                        confidence=info["trust_score"] * 0.8,
                                        kelly_fraction=kelly_criterion(info["win_rate"], 2.0) * STRATEGY_WEIGHTS["contrarian"],
                                        reasoning=f"CONTRARIAN: {name} (WR:{info['win_rate']:.0%}) has ${pos_size:,.0f} "
                                                  f"on {pos_outcome} while market is at {yes_price:.0%} Yes. "
                                                  f"Whale disagrees with crowd.",
                                        expected_return=0.15,
                                    ))
                except Exception:
                    continue
        
        if signals:
            log.info(f"🔄 Contrarian: Found {len(signals)} divergence signals")
        return signals


class EventDrivenStrategy:
    """
    Strategy 4: Event-Driven
    Monitor high-volume markets for sudden whale moves indicating breaking news.
    """
    
    def __init__(self, api: PolymarketAPI):
        self.api = api
        self.volume_baseline: Dict[str, float] = {}
        log.info("📰 Event-Driven: Monitoring for volume spikes")
    
    def scan(self) -> List[TradeSignal]:
        """Detect sudden volume spikes in markets"""
        signals = []
        
        events = self.api.get_active_events(limit=30)
        
        for event in events:
            slug = event.get("slug", "")
            vol_24h = float(event.get("volume24hr", 0))
            vol_1wk = float(event.get("volume1wk", 0))
            
            if vol_1wk <= 0:
                continue
            
            # Daily average from weekly
            daily_avg = vol_1wk / 7
            
            # Volume spike: today's volume > 3x daily average
            if daily_avg > 0 and vol_24h > daily_avg * 3 and vol_24h > 50000:
                # Check price movement direction
                markets = event.get("markets", [])
                for market in markets:
                    try:
                        prices = json.loads(market.get("outcomePrices", "[]"))
                        if prices:
                            yes_price = float(prices[0])
                            
                            # Strong directional move with volume = event-driven signal
                            if yes_price > 0.65 or yes_price < 0.35:
                                direction = "Yes" if yes_price > 0.65 else "No"
                                price = yes_price if direction == "Yes" else 1 - yes_price
                                
                                signals.append(TradeSignal(
                                    strategy=Strategy.EVENT_DRIVEN,
                                    market_slug=market.get("slug", ""),
                                    market_question=market.get("question", event.get("title", "")),
                                    token_id="",
                                    side=Side.BUY,
                                    outcome=direction,
                                    target_price=price,
                                    size_usd=0,
                                    confidence=min(0.85, vol_24h / daily_avg * 0.15),
                                    kelly_fraction=kelly_criterion(0.65, (1-price)/price) * STRATEGY_WEIGHTS["event_driven"],
                                    reasoning=f"VOLUME SPIKE: {event.get('title', slug)[:60]} - "
                                              f"24h vol ${vol_24h:,.0f} ({vol_24h/daily_avg:.1f}x avg). "
                                              f"Price trending {direction} at {price:.0%}.",
                                    expected_return=(1 - price) * 0.65 - price * 0.35,
                                ))
                    except Exception:
                        continue
        
        if signals:
            log.info(f"📰 Event-Driven: Found {len(signals)} volume spike signals")
        return signals


class MarketMakingStrategy:
    """
    Strategy 5: Market Making
    Place limit orders when spreads are wide enough (>5%).
    """
    
    def __init__(self, api: PolymarketAPI):
        self.api = api
        log.info("💹 Market Making: Monitoring for wide spreads (>5%)")
    
    def scan(self) -> List[TradeSignal]:
        """Find markets with wide spreads for market making"""
        signals = []
        
        # Get active markets and check spreads
        events = self.api.get_active_events(limit=20)
        
        for event in events:
            markets = event.get("markets", [])
            for market in markets:
                try:
                    token_ids = json.loads(market.get("clobTokenIds", "[]"))
                    if not token_ids:
                        continue
                    
                    # Check spread on YES token
                    spread_data = self.api.get_spread(token_ids[0])
                    if not spread_data:
                        continue
                    
                    spread = float(spread_data.get("spread", 0))
                    
                    if spread >= 0.05:  # 5%+ spread
                        bid = float(spread_data.get("bid", 0))
                        ask = float(spread_data.get("ask", 0))
                        mid = (bid + ask) / 2 if bid and ask else 0.5
                        
                        # Place limit buy slightly above bid
                        signals.append(TradeSignal(
                            strategy=Strategy.MARKET_MAKING,
                            market_slug=market.get("slug", ""),
                            market_question=market.get("question", ""),
                            token_id=token_ids[0],
                            side=Side.BUY,
                            outcome="Yes",
                            target_price=bid + 0.01,  # 1c above best bid
                            size_usd=0,
                            confidence=0.50,  # MM is neutral
                            kelly_fraction=STRATEGY_WEIGHTS["market_making"] * 0.1,
                            reasoning=f"SPREAD: {spread:.1%} spread on {market.get('question', '')[:50]}. "
                                      f"Bid: {bid:.3f}, Ask: {ask:.3f}. "
                                      f"Placing limit buy at {bid + 0.01:.3f}.",
                            expected_return=spread * 0.3,  # Expect to capture ~30% of spread
                        ))
                except Exception:
                    continue
        
        if signals:
            log.info(f"💹 Market Making: Found {len(signals)} wide-spread opportunities")
        return signals


# ============================================================================
# TRADE EXECUTOR
# ============================================================================

class TradeExecutor:
    """Executes trades (paper or live)"""
    
    def __init__(self, paper_mode: bool = True):
        self.paper_mode = paper_mode
        self.clob_client = None
        
        if not paper_mode and HAS_CLOB_CLIENT:
            try:
                self.clob_client = ClobClient(
                    CLOB_API,
                    key=PRIVATE_KEY,
                    chain_id=CHAIN_ID,
                )
                log.info("🔑 CLOB client initialized for LIVE trading")
            except Exception as e:
                log.error(f"Failed to init CLOB client: {e}. Falling back to paper mode.")
                self.paper_mode = True
    
    def execute(self, signal: TradeSignal, bankroll: float) -> Optional[Position]:
        """Execute a trade signal"""
        
        # Calculate position size
        size_usd = self._calculate_size(signal, bankroll)
        if size_usd < 1.0:
            log.debug(f"Skip: position size too small (${size_usd:.2f})")
            return None
        
        shares = size_usd / signal.target_price if signal.target_price > 0 else 0
        
        if self.paper_mode:
            return self._paper_trade(signal, size_usd, shares)
        else:
            return self._live_trade(signal, size_usd, shares)
    
    def _calculate_size(self, signal: TradeSignal, bankroll: float) -> float:
        """Calculate position size using Kelly criterion"""
        kelly_size = bankroll * signal.kelly_fraction
        max_size = bankroll * MAX_POSITION_PCT
        return min(kelly_size, max_size, bankroll * 0.05)  # Conservative: max 5% per trade
    
    def _paper_trade(self, signal: TradeSignal, size_usd: float, shares: float) -> Position:
        """Execute paper trade"""
        pos_id = hashlib.md5(f"{signal.market_slug}:{time.time()}".encode()).hexdigest()[:12]
        
        position = Position(
            id=pos_id,
            market_slug=signal.market_slug,
            market_question=signal.market_question,
            token_id=signal.token_id,
            outcome=signal.outcome,
            side=signal.side,
            entry_price=signal.target_price,
            size_usd=size_usd,
            shares=shares,
            strategy=signal.strategy,
            opened_at=datetime.now().isoformat(),
        )
        
        log.info(f"📝 PAPER TRADE: {signal.side.value.upper()} {signal.outcome} "
                f"on {signal.market_question[:50]}... "
                f"@ {signal.target_price:.3f} | ${size_usd:.2f} | {shares:.1f} shares")
        log.info(f"   Strategy: {signal.strategy.value} | Confidence: {signal.confidence:.0%}")
        log.info(f"   Reasoning: {signal.reasoning}")
        
        return position
    
    def _live_trade(self, signal: TradeSignal, size_usd: float, shares: float) -> Optional[Position]:
        """Execute live trade via CLOB API"""
        if not self.clob_client or not signal.token_id:
            log.warning("Cannot execute live trade: no CLOB client or token_id")
            return None
        
        try:
            order_args = OrderArgs(
                price=signal.target_price,
                size=shares,
                side="BUY" if signal.side == Side.BUY else "SELL",
                token_id=signal.token_id,
            )
            
            # Place limit order
            signed_order = self.clob_client.create_and_post_order(order_args)
            
            if signed_order:
                pos_id = signed_order.get("orderID", hashlib.md5(str(time.time()).encode()).hexdigest()[:12])
                log.info(f"🔴 LIVE TRADE: {signal.side.value.upper()} {signal.outcome} "
                        f"Order ID: {pos_id}")
                
                return Position(
                    id=pos_id,
                    market_slug=signal.market_slug,
                    market_question=signal.market_question,
                    token_id=signal.token_id,
                    outcome=signal.outcome,
                    side=signal.side,
                    entry_price=signal.target_price,
                    size_usd=size_usd,
                    shares=shares,
                    strategy=signal.strategy,
                    opened_at=datetime.now().isoformat(),
                )
        except Exception as e:
            log.error(f"Live trade failed: {e}")
        
        return None


# ============================================================================
# MAIN BOT
# ============================================================================

class WhaleCopierbBot:
    """
    Main bot orchestrator.
    Coordinates all strategies, manages state, and executes trades.
    """
    
    def __init__(self, paper_mode: bool = PAPER_TRADING):
        self.paper_mode = paper_mode
        self.api = PolymarketAPI()
        self.executor = TradeExecutor(paper_mode=paper_mode)
        
        # Initialize strategies
        self.strategies = {
            Strategy.WHALE_COPY: WhaleCopyStrategy(self.api),
            Strategy.SMART_MONEY: SmartMoneyStrategy(self.api),
            Strategy.CONTRARIAN: ContrarianStrategy(self.api),
            Strategy.EVENT_DRIVEN: EventDrivenStrategy(self.api),
            Strategy.MARKET_MAKING: MarketMakingStrategy(self.api),
        }
        
        # Load or init state
        self.state = self._load_state()
        
        log.info("=" * 70)
        log.info("🐋 POLYMARKET WHALE COPIER - INITIALIZED")
        log.info("=" * 70)
        log.info(f"Mode: {'📝 PAPER' if paper_mode else '🔴 LIVE'}")
        log.info(f"Bankroll: ${self.state.bankroll:,.2f}")
        log.info(f"Strategies: {len(self.strategies)}")
        log.info(f"Tracked Whales: {len(WHALE_WALLETS)}")
        log.info(f"Whales with addresses: {sum(1 for w in WHALE_WALLETS.values() if w.get('address'))}")
        log.info("=" * 70)
    
    def _load_state(self) -> BotState:
        """Load state from file"""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE) as f:
                    data = json.load(f)
                state = BotState(**{k: v for k, v in data.items() if k in BotState.__dataclass_fields__})
                log.info(f"📂 Loaded state: bankroll=${state.bankroll:,.2f}, pnl=${state.total_pnl:+,.2f}")
                return state
            except Exception as e:
                log.warning(f"Failed to load state: {e}")
        return BotState()
    
    def _save_state(self):
        """Save state to file"""
        try:
            with open(STATE_FILE, "w") as f:
                json.dump(asdict(self.state), f, indent=2, default=str)
        except Exception as e:
            log.error(f"Failed to save state: {e}")
    
    def _reset_daily(self):
        """Reset daily counters"""
        today = datetime.now().strftime("%Y-%m-%d")
        if self.state.last_reset_date != today:
            self.state.daily_pnl = 0.0
            self.state.daily_trades = 0
            self.state.last_reset_date = today
            log.info(f"📅 Daily reset for {today}")
    
    def _check_risk_limits(self) -> bool:
        """Check if we can still trade"""
        if self.state.daily_trades >= MAX_DAILY_TRADES:
            log.warning(f"⚠️ Max daily trades reached ({MAX_DAILY_TRADES})")
            return False
        
        if self.state.daily_pnl < -(self.state.bankroll * MAX_DAILY_LOSS_PCT):
            log.warning(f"⚠️ Max daily loss reached (${self.state.daily_pnl:+,.2f})")
            return False
        
        # Check total exposure
        total_exposure = sum(
            float(p.get("size_usd", 0)) for p in self.state.positions
        )
        if total_exposure > self.state.bankroll * MAX_TOTAL_EXPOSURE_PCT:
            log.warning(f"⚠️ Max exposure reached (${total_exposure:,.2f})")
            return False
        
        return True
    
    def _update_positions(self):
        """Update current prices and PnL for open positions"""
        for pos in self.state.positions:
            try:
                token_id = pos.get("token_id", "")
                if token_id:
                    mid = self.api.get_midpoint(token_id)
                    if mid is not None:
                        pos["current_price"] = mid
                        entry = float(pos.get("entry_price", mid))
                        shares = float(pos.get("shares", 0))
                        pos["pnl"] = (mid - entry) * shares
            except Exception:
                continue
    
    def run_cycle(self) -> int:
        """Run one trading cycle across all strategies"""
        self._reset_daily()
        
        if not self._check_risk_limits():
            return 0
        
        cycle_start = datetime.now()
        log.info(f"\n{'='*60}")
        log.info(f"🔄 CYCLE START - {cycle_start.strftime('%H:%M:%S')}")
        log.info(f"{'='*60}")
        
        # Collect signals from all strategies
        all_signals: List[TradeSignal] = []
        
        for strategy_type, strategy in self.strategies.items():
            try:
                signals = strategy.scan()
                all_signals.extend(signals)
            except Exception as e:
                log.error(f"❌ {strategy_type.value} error: {e}")
        
        if not all_signals:
            log.info("📊 No signals this cycle")
            self._save_state()
            return 0
        
        # Rank by confidence * expected_return
        all_signals.sort(key=lambda s: s.confidence * max(s.expected_return, 0.01), reverse=True)
        
        log.info(f"\n📊 {len(all_signals)} signals found. Top 5:")
        for i, sig in enumerate(all_signals[:5], 1):
            log.info(f"  {i}. [{sig.strategy.value}] {sig.outcome} on {sig.market_question[:50]}... "
                    f"(conf: {sig.confidence:.0%}, kelly: {sig.kelly_fraction:.2%})")
        
        # Execute top signals
        trades_executed = 0
        max_trades = min(5, MAX_DAILY_TRADES - self.state.daily_trades)
        
        for signal in all_signals[:max_trades]:
            if not self._check_risk_limits():
                break
            
            position = self.executor.execute(signal, self.state.bankroll)
            if position:
                self.state.positions.append(asdict(position))
                self.state.daily_trades += 1
                self.state.strategy_trades[signal.strategy.value] = \
                    self.state.strategy_trades.get(signal.strategy.value, 0) + 1
                
                # Record in history
                self.state.trade_history.append({
                    "timestamp": datetime.now().isoformat(),
                    "strategy": signal.strategy.value,
                    "market": signal.market_question[:80],
                    "outcome": signal.outcome,
                    "price": signal.target_price,
                    "size_usd": position.size_usd,
                    "confidence": signal.confidence,
                    "reasoning": signal.reasoning[:200],
                })
                
                trades_executed += 1
                time.sleep(1)  # Rate limiting
        
        # Update positions
        self._update_positions()
        
        # Summary
        duration = (datetime.now() - cycle_start).total_seconds()
        total_exposure = sum(float(p.get("size_usd", 0)) for p in self.state.positions)
        
        log.info(f"\n{'='*60}")
        log.info(f"📊 CYCLE SUMMARY ({duration:.1f}s)")
        log.info(f"  Signals: {len(all_signals)} | Trades: {trades_executed}")
        log.info(f"  Bankroll: ${self.state.bankroll:,.2f}")
        log.info(f"  Positions: {len(self.state.positions)} | Exposure: ${total_exposure:,.2f} "
                f"({total_exposure/self.state.bankroll*100:.1f}%)")
        log.info(f"  Daily P&L: ${self.state.daily_pnl:+,.2f} | Total P&L: ${self.state.total_pnl:+,.2f}")
        log.info(f"{'='*60}\n")
        
        self._save_state()
        return trades_executed
    
    def run_continuous(self, interval: int = WHALE_POLL_INTERVAL):
        """Run bot continuously"""
        log.info(f"\n{'='*70}")
        log.info(f"🚀 STARTING CONTINUOUS MODE (interval: {interval}s)")
        log.info(f"{'='*70}")
        log.info(f"Press Ctrl+C to stop\n")
        
        cycle_count = 0
        
        try:
            while True:
                cycle_count += 1
                log.info(f"--- Cycle #{cycle_count} ---")
                
                trades = self.run_cycle()
                
                log.info(f"⏰ Next cycle in {interval}s...")
                time.sleep(interval)
        
        except KeyboardInterrupt:
            log.info(f"\n🛑 Bot stopped after {cycle_count} cycles")
            self._print_report()
            self._save_state()
    
    def _print_report(self):
        """Print final report"""
        log.info(f"\n{'='*70}")
        log.info(f"📊 FINAL PERFORMANCE REPORT")
        log.info(f"{'='*70}")
        log.info(f"Mode: {'PAPER' if self.paper_mode else 'LIVE'}")
        log.info(f"Bankroll: ${self.state.bankroll:,.2f}")
        log.info(f"Total P&L: ${self.state.total_pnl:+,.2f}")
        log.info(f"Open Positions: {len(self.state.positions)}")
        log.info(f"Total Trades: {sum(self.state.strategy_trades.values())}")
        
        log.info(f"\n📈 Strategy Breakdown:")
        for strategy in Strategy:
            trades = self.state.strategy_trades.get(strategy.value, 0)
            pnl = self.state.strategy_pnl.get(strategy.value, 0)
            wins = self.state.strategy_wins.get(strategy.value, 0)
            wr = wins / trades * 100 if trades > 0 else 0
            log.info(f"  {strategy.value:15s}: {trades:3d} trades | "
                    f"${pnl:+8.2f} PnL | {wr:.0f}% WR")
        
        log.info(f"\n🐋 Whale Activity Summary:")
        for name, info in WHALE_WALLETS.items():
            if info.get("address"):
                log.info(f"  {name:15s}: PnL ${info['pnl']:>12,} | WR {info['win_rate']:.0%} | "
                        f"Trust {info['trust_score']:.0%} | {', '.join(info['specialty'])}")
        
        log.info(f"{'='*70}\n")


# ============================================================================
# CLI
# ============================================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Polymarket Whale Copier Bot")
    parser.add_argument("--live", action="store_true", help="Enable live trading (default: paper)")
    parser.add_argument("--continuous", "-c", action="store_true", help="Run continuously")
    parser.add_argument("--interval", "-i", type=int, default=60, help="Poll interval in seconds (default: 60)")
    parser.add_argument("--scan", action="store_true", help="Run single scan and show signals")
    parser.add_argument("--whales", action="store_true", help="Show whale database")
    parser.add_argument("--report", action="store_true", help="Show performance report")
    
    args = parser.parse_args()
    
    if args.whales:
        print("\n🐋 WHALE DATABASE")
        print("=" * 80)
        for name, info in sorted(WHALE_WALLETS.items(), key=lambda x: -x[1]["pnl"]):
            addr = info.get("address", "unknown")[:20] + "..." if info.get("address") else "unknown"
            print(f"  {name:15s} | PnL: ${info['pnl']:>12,} | WR: {info['win_rate']:.0%} | "
                  f"Trust: {info['trust_score']:.0%} | Addr: {addr}")
        print("=" * 80)
        return
    
    paper_mode = not args.live
    bot = WhaleCopierbBot(paper_mode=paper_mode)
    
    if args.report:
        bot._print_report()
    elif args.continuous:
        bot.run_continuous(interval=args.interval)
    else:
        bot.run_cycle()


if __name__ == "__main__":
    main()
