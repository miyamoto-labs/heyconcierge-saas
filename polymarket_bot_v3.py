#!/usr/bin/env python3
"""
Polymarket Bot v3 - Realistic $100 Strategy
=============================================
Focus: Near-resolution limit orders + whale-signal market selection

Key insights from v1/v2 failure:
- 98-99% spreads on most markets = can't be a taker
- Must use LIMIT ORDERS (be the market maker)
- Only trade markets with actual orderbook activity
- Near-resolution markets have price convergence = edge
- $100 bankroll = max 5 positions at $20 each

Strategy: "Resolution Sniper"
1. Find markets resolving in <14 days
2. Filter for ones with actual orderbook depth (spread < 30%)
3. Identify likely outcomes (price > 0.80 or < 0.20)
4. Place limit orders slightly better than best bid/ask
5. Use whale activity to confirm direction
6. Hold to resolution for full payout

Author: Miyamoto Labs v3
"""

import os
import sys
import json
import time
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from pathlib import Path

import requests

# ============================================================================
# CONFIG
# ============================================================================

PAPER_MODE = True
BANKROLL = 102.66  # Actual USDC.e balance
MAX_POSITION_SIZE = 20.0  # $20 max per position
MAX_POSITIONS = 5  # Max 5 open at once
MAX_DAILY_LOSS = 10.0  # Stop trading if down $10 in a day
MIN_SPREAD_QUALITY = 0.30  # Spread must be < 30% to consider
MIN_VOLUME = 10_000  # Minimum $10K volume (shows market is alive)
RESOLUTION_WINDOW_DAYS = 90  # Markets resolving within 90 days

# Polymarket APIs
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"
DATA_API = "https://data-api.polymarket.com"

# Wallet
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"

# Known whale addresses for signal confirmation
WHALE_ADDRESSES = {
    "Theo4": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
    "Fredi9999": "0x3b90fb6b60c8e8f57f9e0a8d35fe4f7c30c07e91",
    "ImJustKen": "0x9d84ce0306f8551e02efef1680475fc0f1dc1344",
    "fengdubiying": "0x17db3fcd93ba12d38382a0cade24b200185c5f6d",
    "Walrus": "0xfde62dd29574bab38f9f3e4f1da3c1b98c67dfb8",
    "Domer": "0x7bce56c30bb2e09c33ed0b4a68a5c0b6e8c6dc97",
}

# Files
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".bot_v3_state.json")
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bot_v3.log")

# ============================================================================
# LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("v3")

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Market:
    """A tradeable market opportunity"""
    slug: str
    question: str
    condition_id: str
    token_id_yes: str
    token_id_no: str
    yes_price: float
    no_price: float
    spread: float
    best_bid: float
    best_ask: float
    volume: float
    volume_24h: float
    end_date: Optional[str]
    days_to_resolution: float
    orderbook_depth_usd: float  # Total $ in orderbook

@dataclass
class Opportunity:
    """A scored trading opportunity"""
    market: Market
    side: str  # "yes" or "no"
    direction: str  # "buy" (expect price to go up/resolve YES) or "sell"
    limit_price: float  # Our limit order price
    expected_value: float  # Expected payout if correct
    edge: float  # Our estimated edge (EV - cost)
    confidence: float  # 0-1
    size_usd: float  # Position size
    reasoning: str
    whale_confirmed: bool = False
    whale_names: List[str] = field(default_factory=list)

@dataclass
class Position:
    """Open position"""
    id: str
    market_slug: str
    question: str
    token_id: str
    side: str  # "yes" or "no"
    entry_price: float
    size_usd: float
    shares: float
    opened_at: str
    expected_resolution: str
    status: str = "open"  # open, filled, won, lost

@dataclass
class BotState:
    """Persistent state"""
    bankroll: float = BANKROLL
    paper_bankroll: float = 1000.0
    total_pnl: float = 0.0
    daily_pnl: float = 0.0
    daily_date: str = ""
    positions: List[Dict] = field(default_factory=list)
    history: List[Dict] = field(default_factory=list)
    cycle_count: int = 0
    total_trades: int = 0
    wins: int = 0
    losses: int = 0
    markets_scanned: int = 0
    opportunities_found: int = 0


# ============================================================================
# API CLIENT
# ============================================================================

class API:
    """Minimal Polymarket API client with rate limiting"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers["Accept"] = "application/json"
        self._last_req = 0.0

    def _get(self, url: str, params: dict = None) -> Any:
        # Rate limit: 0.3 req/sec
        wait = 0.3 - (time.time() - self._last_req)
        if wait > 0:
            time.sleep(wait)
        self._last_req = time.time()

        try:
            r = self.session.get(url, params=params, timeout=15)
            if r.status_code == 429:
                log.warning("Rate limited, waiting 5s")
                time.sleep(5)
                r = self.session.get(url, params=params, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            log.debug(f"API error {url}: {e}")
            return None

    def get_events(self, limit=50) -> List[dict]:
        """Get active events sorted by volume"""
        return self._get(f"{GAMMA_API}/events", {
            "limit": limit, "active": "true",
            "order": "volume24hr", "ascending": "false",
        }) or []

    def get_markets(self, limit=100) -> List[dict]:
        """Get active markets"""
        return self._get(f"{GAMMA_API}/markets", {
            "limit": limit, "active": "true",
        }) or []

    def get_orderbook(self, token_id: str) -> Optional[dict]:
        return self._get(f"{CLOB_API}/book", {"token_id": token_id})

    def get_spread(self, token_id: str) -> Optional[dict]:
        return self._get(f"{CLOB_API}/spread", {"token_id": token_id})

    def get_midpoint(self, token_id: str) -> Optional[float]:
        data = self._get(f"{CLOB_API}/midpoint", {"token_id": token_id})
        if data and "mid" in data:
            try:
                return float(data["mid"])
            except (ValueError, TypeError):
                pass
        return None

    def get_price(self, token_id: str) -> Optional[dict]:
        return self._get(f"{CLOB_API}/price", {"token_id": token_id})

    def get_user_positions(self, address: str) -> List[dict]:
        return self._get(f"{DATA_API}/positions", {"user": address}) or []

    def get_user_activity(self, address: str, limit=20) -> List[dict]:
        return self._get(f"{DATA_API}/activity", {"user": address, "limit": limit}) or []


# ============================================================================
# MARKET SCANNER
# ============================================================================

class MarketScanner:
    """Find tradeable markets with real orderbook activity"""

    def __init__(self, api: API):
        self.api = api

    def scan(self) -> List[Market]:
        """Scan for tradeable markets"""
        markets = []
        events = self.api.get_events(limit=50)
        log.info(f"Scanning {len(events)} events...")

        for event in events:
            end_date = event.get("endDate") or event.get("estimatedEndDate")
            days_left = self._days_until(end_date)

            # Skip if too far out or already ended
            if days_left is None or days_left < 0 or days_left > RESOLUTION_WINDOW_DAYS:
                continue

            vol_24h = float(event.get("volume24hr", 0) or 0)
            volume = float(event.get("volume", 0) or 0)

            if volume < MIN_VOLUME:
                continue

            for mkt in event.get("markets", []):
                m = self._analyze_market(mkt, end_date, days_left, vol_24h, volume)
                if m:
                    markets.append(m)

        # Sort by spread quality (tighter = better) then volume
        markets.sort(key=lambda m: (m.spread, -m.volume_24h))
        log.info(f"Found {len(markets)} tradeable markets (spread < {MIN_SPREAD_QUALITY:.0%})")
        return markets

    def _analyze_market(self, mkt: dict, end_date, days_left, vol_24h, volume) -> Optional[Market]:
        """Analyze a single market for tradeability"""
        try:
            token_ids = json.loads(mkt.get("clobTokenIds", "[]"))
            if len(token_ids) < 2:
                return None

            prices = json.loads(mkt.get("outcomePrices", "[]"))
            if len(prices) < 2:
                return None

            yes_price = float(prices[0])
            no_price = float(prices[1])

            # Get actual orderbook to verify spread
            spread_data = self.api.get_spread(token_ids[0])
            if not spread_data:
                return None

            spread = float(spread_data.get("spread", "1") or "1")
            if spread >= MIN_SPREAD_QUALITY:
                return None  # Spread too wide

            # Get bid/ask from orderbook (spread endpoint doesn't always have them)
            book = self.api.get_orderbook(token_ids[0])
            bid, ask, depth = self._parse_book(book)

            if bid <= 0 or ask <= 0:
                return None

            if depth < 50:  # Need at least $50 in orderbook
                return None

            return Market(
                slug=mkt.get("slug", ""),
                question=mkt.get("question", ""),
                condition_id=mkt.get("conditionId", ""),
                token_id_yes=token_ids[0],
                token_id_no=token_ids[1],
                yes_price=yes_price,
                no_price=no_price,
                spread=spread,
                best_bid=bid,
                best_ask=ask,
                volume=volume,
                volume_24h=vol_24h,
                end_date=end_date,
                days_to_resolution=days_left,
                orderbook_depth_usd=depth,
            )
        except Exception as e:
            log.debug(f"Market analysis error: {e}")
            return None

    def _parse_book(self, book: Optional[dict]) -> Tuple[float, float, float]:
        """Parse orderbook: returns (best_bid, best_ask, total_depth_usd)"""
        if not book:
            return 0.0, 0.0, 0.0
        
        best_bid = 0.0
        best_ask = 1.0
        total = 0.0
        
        bids = book.get("bids") or []
        asks = book.get("asks") or []
        
        for level in bids:
            try:
                price = float(level.get("price", 0))
                size = float(level.get("size", 0))
                total += price * size
                if price > best_bid:
                    best_bid = price
            except (ValueError, TypeError):
                pass
        
        for level in asks:
            try:
                price = float(level.get("price", 0))
                size = float(level.get("size", 0))
                total += price * size
                if price < best_ask:
                    best_ask = price
            except (ValueError, TypeError):
                pass
        
        if not bids:
            best_bid = 0.0
        if not asks:
            best_ask = 0.0
            
        return best_bid, best_ask, total

    def _days_until(self, date_str: Optional[str]) -> Optional[float]:
        if not date_str:
            return None
        try:
            # Handle various date formats
            for fmt in ["%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%d"]:
                try:
                    end = datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                    now = datetime.now(timezone.utc)
                    return (end - now).total_seconds() / 86400
                except ValueError:
                    continue
        except Exception:
            pass
        return None


# ============================================================================
# WHALE SIGNAL CHECKER
# ============================================================================

class WhaleSignals:
    """Check if whales have positions on a market (confirmation signal)"""

    def __init__(self, api: API):
        self.api = api
        self._cache: Dict[str, List[dict]] = {}
        self._cache_time: Dict[str, float] = {}

    def check_whale_positions(self, market_slug: str) -> Tuple[bool, List[str], str]:
        """
        Check if any tracked whales have positions on this market.
        Returns: (has_whale_signal, whale_names, dominant_side)
        """
        whale_on_yes = []
        whale_on_no = []

        for name, addr in WHALE_ADDRESSES.items():
            positions = self._get_positions(addr)
            for pos in positions:
                pos_slug = pos.get("eventSlug") or pos.get("slug", "")
                if market_slug and pos_slug and market_slug in pos_slug:
                    outcome = pos.get("outcome", "").lower()
                    value = float(pos.get("currentValue", 0) or 0)
                    if value > 100:  # Meaningful position
                        if "yes" in outcome:
                            whale_on_yes.append(name)
                        else:
                            whale_on_no.append(name)

        if whale_on_yes or whale_on_no:
            if len(whale_on_yes) >= len(whale_on_no):
                return True, whale_on_yes, "yes"
            else:
                return True, whale_on_no, "no"

        return False, [], ""

    def _get_positions(self, addr: str) -> List[dict]:
        """Get cached whale positions"""
        now = time.time()
        if addr in self._cache and now - self._cache_time.get(addr, 0) < 300:
            return self._cache[addr]

        positions = self.api.get_user_positions(addr)
        self._cache[addr] = positions
        self._cache_time[addr] = now
        return positions


# ============================================================================
# OPPORTUNITY SCORER
# ============================================================================

class OpportunityScorer:
    """Score and rank trading opportunities"""

    def __init__(self, api: API, whales: WhaleSignals):
        self.api = api
        self.whales = whales

    def score(self, markets: List[Market]) -> List[Opportunity]:
        """Score all markets and return ranked opportunities"""
        opps = []

        for market in markets:
            opp = self._evaluate(market)
            if opp and opp.edge > 0.02:  # Min 2% edge
                opps.append(opp)

        opps.sort(key=lambda o: o.edge * o.confidence, reverse=True)
        return opps

    def _evaluate(self, m: Market) -> Optional[Opportunity]:
        """Evaluate a single market for opportunity"""

        # Strategy 1: Near-resolution convergence
        # If a market is near resolution and price is strongly directional,
        # the price should converge toward 0 or 1.
        # We can buy the likely winner at a discount.

        yes_price = m.yes_price
        no_price = m.no_price

        # Determine likely outcome based on price
        if yes_price >= 0.75:
            # Market thinks YES is likely
            side = "yes"
            current_price = yes_price
            token_id = m.token_id_yes
            limit_price = m.best_ask  # Buy at ask (or slightly below)
            payout_if_correct = 1.0
            prob_correct = min(0.90, yes_price + 0.05)  # Assume market is ~right
        elif no_price >= 0.75:
            # Market thinks NO is likely
            side = "no"
            current_price = no_price
            token_id = m.token_id_no
            limit_price = 1.0 - m.best_bid  # Buy NO token
            payout_if_correct = 1.0
            prob_correct = min(0.90, no_price + 0.05)
        else:
            # Price is in 25-75% range.
            # Strategy A: If whale signal exists, follow whale
            whale_signal, whale_names, whale_side = self.whales.check_whale_positions(m.slug)

            if whale_signal:
                if whale_side == "yes":
                    side = "yes"
                    current_price = yes_price
                    token_id = m.token_id_yes
                    limit_price = m.best_bid + 0.01
                else:
                    side = "no"
                    current_price = no_price
                    token_id = m.token_id_no
                    limit_price = (1.0 - m.best_ask) + 0.01

                prob_correct = 0.60
                edge = prob_correct - limit_price
                if edge < 0.02:
                    return None

                size = min(MAX_POSITION_SIZE, self._kelly_size(prob_correct, limit_price))
                return Opportunity(
                    market=m, side=side, direction="buy",
                    limit_price=round(limit_price, 4),
                    expected_value=round(prob_correct, 4),
                    edge=round(edge, 4), confidence=prob_correct,
                    size_usd=round(size, 2),
                    reasoning=f"Whale-confirmed ({', '.join(whale_names)}) {side.upper()} "
                             f"| Price: {current_price:.2f} | Spread: {m.spread:.1%} | Depth: ${m.orderbook_depth_usd:.0f}",
                    whale_confirmed=True, whale_names=whale_names,
                )

            # Strategy B: Market making on liquid uncertain markets
            # If spread > 2% and depth is high, place limit buy at mid and capture spread
            if m.spread >= 0.02 and m.orderbook_depth_usd >= 1000 and m.days_to_resolution <= 3:
                # Place a limit buy slightly above best bid
                # We're buying the "cheaper" side (further from 0.50 = more value)
                if yes_price <= 0.50:
                    side = "yes"
                    token_id = m.token_id_yes
                    limit_price = m.best_bid + 0.005
                else:
                    side = "no"
                    token_id = m.token_id_no
                    limit_price = (1.0 - m.best_ask) + 0.005

                # Edge is half the spread (we place in the middle)
                edge = m.spread / 2 - 0.005  # minus our 0.5c improvement
                if edge < 0.005:
                    return None

                size = min(MAX_POSITION_SIZE * 0.5, 10.0)  # Small size for MM
                return Opportunity(
                    market=m, side=side, direction="buy",
                    limit_price=round(limit_price, 4),
                    expected_value=round(0.50 + edge, 4),
                    edge=round(edge, 4), confidence=0.52,
                    size_usd=round(size, 2),
                    reasoning=f"MM: {side.upper()} @ {limit_price:.3f} | "
                             f"Spread: {m.spread:.1%} | Depth: ${m.orderbook_depth_usd:.0f} | "
                             f"Resolves: {m.days_to_resolution:.1f}d | {m.question[:50]}",
                )

            return None

        # For directional markets (price > 0.75), calculate edge
        # Edge = probability of correct * payout - cost
        # Cost = our limit price
        # We place limit slightly below ask to improve our price
        our_price = min(limit_price, m.best_ask - 0.01)  # Try to get better than ask
        our_price = max(our_price, m.best_bid + 0.005)  # But above best bid
        our_price = round(our_price, 4)

        edge = prob_correct * payout_if_correct - our_price

        if edge < 0.02:
            return None

        # Time decay bonus: closer to resolution = more confident in convergence
        time_bonus = max(0, 1.0 - m.days_to_resolution / RESOLUTION_WINDOW_DAYS) * 0.05
        adjusted_edge = edge + time_bonus

        # Whale confirmation
        whale_signal, whale_names, whale_side = self.whales.check_whale_positions(m.slug)
        whale_confirmed = whale_signal and whale_side == side
        if whale_confirmed:
            adjusted_edge += 0.03  # 3% bonus for whale confirmation

        size = min(MAX_POSITION_SIZE, self._kelly_size(prob_correct, our_price))

        return Opportunity(
            market=m,
            side=side,
            direction="buy",
            limit_price=our_price,
            expected_value=round(prob_correct * payout_if_correct, 4),
            edge=round(adjusted_edge, 4),
            confidence=round(prob_correct, 4),
            size_usd=round(size, 2),
            reasoning=self._build_reasoning(m, side, our_price, prob_correct, adjusted_edge, whale_confirmed, whale_names),
            whale_confirmed=whale_confirmed,
            whale_names=whale_names if whale_confirmed else [],
        )

    def _kelly_size(self, win_prob: float, cost: float) -> float:
        """Quarter-Kelly position sizing"""
        if cost <= 0 or cost >= 1 or win_prob <= 0:
            return 0
        b = (1.0 - cost) / cost  # Net odds
        q = 1.0 - win_prob
        kelly = (b * win_prob - q) / b
        quarter_kelly = max(0, kelly) * 0.25
        return quarter_kelly * BANKROLL

    def _build_reasoning(self, m, side, price, prob, edge, whale, whale_names):
        parts = [
            f"{side.upper()} @ {price:.3f}",
            f"({m.question[:60]})",
            f"Edge: {edge:.1%}",
            f"Spread: {m.spread:.1%}",
            f"Depth: ${m.orderbook_depth_usd:.0f}",
            f"Vol24h: ${m.volume_24h:,.0f}",
            f"Resolves in {m.days_to_resolution:.0f}d",
        ]
        if whale:
            parts.append(f"🐋 Confirmed by {', '.join(whale_names)}")
        return " | ".join(parts)


# ============================================================================
# TRADE EXECUTOR (Paper + Live-ready)
# ============================================================================

class Executor:
    """Execute trades - paper mode simulates limit order fills"""

    def __init__(self, paper: bool = True):
        self.paper = paper

    def place_limit_order(self, opp: Opportunity) -> Optional[Position]:
        """Place a limit order"""
        if self.paper:
            return self._paper_limit(opp)
        else:
            return self._live_limit(opp)

    def _paper_limit(self, opp: Opportunity) -> Position:
        """
        Paper trade: simulate limit order.
        Assume fill if our price is within the spread.
        In reality, limit orders may not fill - we model ~60% fill rate.
        """
        # Simulate fill probability based on where our price is relative to spread
        m = opp.market
        if opp.side == "yes":
            # Buying YES: our bid vs best ask
            fill_prob = 0.7 if opp.limit_price >= m.best_ask - 0.02 else 0.4
        else:
            fill_prob = 0.7 if opp.limit_price >= (1.0 - m.best_bid) - 0.02 else 0.4

        # For paper mode, simulate fill with slight slippage
        import random
        if random.random() > fill_prob:
            log.info(f"  📋 LIMIT ORDER NOT FILLED (simulated): {opp.side.upper()} "
                    f"@ {opp.limit_price:.3f} on {m.question[:50]}")
            return None

        fill_price = opp.limit_price  # Assume fill at our price
        shares = opp.size_usd / fill_price if fill_price > 0 else 0

        pos_id = hashlib.md5(f"{m.slug}:{time.time()}".encode()).hexdigest()[:10]

        pos = Position(
            id=pos_id,
            market_slug=m.slug,
            question=m.question,
            token_id=m.token_id_yes if opp.side == "yes" else m.token_id_no,
            side=opp.side,
            entry_price=fill_price,
            size_usd=opp.size_usd,
            shares=shares,
            opened_at=datetime.now().isoformat(),
            expected_resolution=m.end_date or "unknown",
            status="filled",
        )

        log.info(f"  ✅ PAPER FILL: {opp.side.upper()} @ {fill_price:.3f} | "
                f"${opp.size_usd:.2f} | {shares:.1f} shares | Edge: {opp.edge:.1%}")

        return pos

    def _live_limit(self, opp: Opportunity) -> Optional[Position]:
        """Live trade via CLOB API - placeholder"""
        log.warning("Live trading not yet implemented")
        return None


# ============================================================================
# POSITION MANAGER
# ============================================================================

class PositionManager:
    """Track and manage open positions"""

    def __init__(self, api: API):
        self.api = api

    def update_positions(self, positions: List[Dict]) -> Tuple[List[Dict], float]:
        """Update prices on open positions, return updated list and realized PnL"""
        realized_pnl = 0.0
        active = []

        for pos in positions:
            if pos.get("status") in ("won", "lost"):
                continue

            token_id = pos.get("token_id", "")
            mid = self.api.get_midpoint(token_id)

            if mid is not None:
                entry = float(pos.get("entry_price", 0))
                shares = float(pos.get("shares", 0))
                pos["current_price"] = mid
                pos["unrealized_pnl"] = round((mid - entry) * shares, 2)

                # Check if market resolved (price at 0 or 1)
                if mid >= 0.99:
                    pos["status"] = "won"
                    pnl = (1.0 - entry) * shares
                    pos["realized_pnl"] = round(pnl, 2)
                    realized_pnl += pnl
                    log.info(f"  🏆 WON: {pos['question'][:50]} | +${pnl:.2f}")
                elif mid <= 0.01:
                    pos["status"] = "lost"
                    pnl = -entry * shares
                    pos["realized_pnl"] = round(pnl, 2)
                    realized_pnl += pnl
                    log.info(f"  💀 LOST: {pos['question'][:50]} | ${pnl:.2f}")

            active.append(pos)

        return active, round(realized_pnl, 2)

    def check_exits(self, positions: List[Dict]) -> Tuple[List[Dict], float]:
        """Check for exit conditions (stop loss, take profit)"""
        realized = 0.0
        result = []

        for pos in positions:
            if pos.get("status") != "filled":
                result.append(pos)
                continue

            upnl = float(pos.get("unrealized_pnl", 0))
            entry = float(pos.get("entry_price", 0))
            size = float(pos.get("size_usd", 0))
            shares = float(pos.get("shares", 0))

            # Stop loss: exit if down >30% on a position
            if upnl < -(size * 0.30):
                mid = float(pos.get("current_price", entry))
                pnl = (mid - entry) * shares
                pos["status"] = "stopped"
                pos["realized_pnl"] = round(pnl, 2)
                realized += pnl
                log.info(f"  🛑 STOP LOSS: {pos['question'][:50]} | ${pnl:.2f}")

            # Take profit: exit if up >50% and price > 0.92
            elif upnl > (size * 0.50):
                mid = float(pos.get("current_price", entry))
                if mid > 0.92:
                    pnl = (mid - entry) * shares
                    pos["status"] = "profit_taken"
                    pos["realized_pnl"] = round(pnl, 2)
                    realized += pnl
                    log.info(f"  💰 TAKE PROFIT: {pos['question'][:50]} | +${pnl:.2f}")

            result.append(pos)

        return result, round(realized, 2)


# ============================================================================
# MAIN BOT
# ============================================================================

class PolymarketBotV3:
    """Main bot orchestrator"""

    def __init__(self):
        self.api = API()
        self.scanner = MarketScanner(self.api)
        self.whales = WhaleSignals(self.api)
        self.scorer = OpportunityScorer(self.api, self.whales)
        self.executor = Executor(paper=PAPER_MODE)
        self.positions = PositionManager(self.api)
        self.state = self._load_state()

    def _load_state(self) -> BotState:
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE) as f:
                    data = json.load(f)
                return BotState(**{k: v for k, v in data.items() if k in BotState.__dataclass_fields__})
            except Exception:
                pass
        return BotState()

    def _save_state(self):
        with open(STATE_FILE, "w") as f:
            json.dump(asdict(self.state), f, indent=2, default=str)

    def run_cycle(self):
        """One full cycle: scan → score → trade → manage"""
        self.state.cycle_count += 1
        today = datetime.now().strftime("%Y-%m-%d")
        if self.state.daily_date != today:
            self.state.daily_pnl = 0.0
            self.state.daily_date = today

        log.info(f"\n{'='*60}")
        log.info(f"🔄 CYCLE #{self.state.cycle_count} | "
                f"Bankroll: ${self.state.paper_bankroll:.2f} | "
                f"PnL: ${self.state.total_pnl:+.2f} | "
                f"Positions: {len([p for p in self.state.positions if p.get('status') == 'filled'])}")
        log.info(f"{'='*60}")

        # Check daily loss limit
        if self.state.daily_pnl < -MAX_DAILY_LOSS:
            log.warning(f"⚠️ Daily loss limit hit (${self.state.daily_pnl:.2f}). Skipping.")
            return

        # 1. Update existing positions
        if self.state.positions:
            log.info("\n📊 Updating positions...")
            self.state.positions, realized = self.positions.update_positions(self.state.positions)
            self.state.positions, exit_pnl = self.positions.check_exits(self.state.positions)
            total_realized = realized + exit_pnl
            if total_realized != 0:
                self.state.total_pnl += total_realized
                self.state.daily_pnl += total_realized
                self.state.paper_bankroll += total_realized
                if total_realized > 0:
                    self.state.wins += 1
                else:
                    self.state.losses += 1

        # 2. Count open positions
        open_positions = [p for p in self.state.positions if p.get("status") == "filled"]
        if len(open_positions) >= MAX_POSITIONS:
            log.info(f"📋 Max positions ({MAX_POSITIONS}) reached. Managing only.")
            self._print_positions(open_positions)
            self._save_state()
            return

        # 3. Scan markets
        log.info("\n🔍 Scanning markets...")
        markets = self.scanner.scan()
        self.state.markets_scanned += len(markets)

        if not markets:
            log.info("No tradeable markets found this cycle.")
            self._save_state()
            return

        # 4. Score opportunities
        log.info("\n📈 Scoring opportunities...")
        opportunities = self.scorer.score(markets)
        self.state.opportunities_found += len(opportunities)

        if not opportunities:
            log.info("No opportunities with sufficient edge.")
            self._save_state()
            return

        # 5. Show top opportunities
        log.info(f"\n🎯 Top {min(5, len(opportunities))} Opportunities:")
        for i, opp in enumerate(opportunities[:5], 1):
            whale_tag = " 🐋" if opp.whale_confirmed else ""
            log.info(f"  {i}. {opp.reasoning}{whale_tag}")

        # 6. Execute top opportunities (up to remaining slots)
        slots = MAX_POSITIONS - len(open_positions)
        for opp in opportunities[:slots]:
            log.info(f"\n💹 Attempting: {opp.side.upper()} @ {opp.limit_price:.3f}")
            pos = self.executor.place_limit_order(opp)
            if pos:
                self.state.positions.append(asdict(pos))
                self.state.total_trades += 1

                self.state.history.append({
                    "time": datetime.now().isoformat(),
                    "market": opp.market.question[:80],
                    "side": opp.side,
                    "price": opp.limit_price,
                    "size": opp.size_usd,
                    "edge": opp.edge,
                    "whale": opp.whale_confirmed,
                })

        # 7. Print summary
        self._print_positions([p for p in self.state.positions if p.get("status") == "filled"])
        self._save_state()

    def _print_positions(self, positions):
        if not positions:
            return
        log.info(f"\n📋 Open Positions ({len(positions)}):")
        total_exposure = 0
        total_upnl = 0
        for p in positions:
            upnl = float(p.get("unrealized_pnl", 0))
            total_upnl += upnl
            total_exposure += float(p.get("size_usd", 0))
            log.info(f"  • {p.get('side','?').upper()} {p['question'][:45]} "
                    f"@ {p.get('entry_price', 0):.3f} → {p.get('current_price', 0):.3f} "
                    f"| ${upnl:+.2f}")
        log.info(f"  Total exposure: ${total_exposure:.2f} | Unrealized: ${total_upnl:+.2f}")

    def run_continuous(self, interval=120):
        """Run continuously"""
        log.info(f"\n{'='*60}")
        log.info(f"🚀 POLYMARKET BOT V3 - Resolution Sniper")
        log.info(f"{'='*60}")
        log.info(f"Mode: {'PAPER' if PAPER_MODE else 'LIVE'}")
        log.info(f"Bankroll: ${BANKROLL:.2f}")
        log.info(f"Max position: ${MAX_POSITION_SIZE:.0f} | Max positions: {MAX_POSITIONS}")
        log.info(f"Interval: {interval}s | Whales tracked: {len(WHALE_ADDRESSES)}")
        log.info(f"{'='*60}\n")

        try:
            while True:
                self.run_cycle()
                log.info(f"\n⏰ Next cycle in {interval}s...\n")
                time.sleep(interval)
        except KeyboardInterrupt:
            log.info("\n🛑 Stopped")
            self._print_report()
            self._save_state()

    def _print_report(self):
        log.info(f"\n{'='*60}")
        log.info(f"📊 FINAL REPORT")
        log.info(f"{'='*60}")
        log.info(f"Cycles: {self.state.cycle_count}")
        log.info(f"Markets scanned: {self.state.markets_scanned}")
        log.info(f"Opportunities found: {self.state.opportunities_found}")
        log.info(f"Trades: {self.state.total_trades} (W:{self.state.wins} L:{self.state.losses})")
        wr = self.state.wins / max(1, self.state.wins + self.state.losses)
        log.info(f"Win rate: {wr:.0%}")
        log.info(f"Total PnL: ${self.state.total_pnl:+.2f}")
        log.info(f"Bankroll: ${self.state.paper_bankroll:.2f}")
        log.info(f"{'='*60}")


# ============================================================================
# CLI
# ============================================================================

def main():
    import argparse
    p = argparse.ArgumentParser(description="Polymarket Bot v3 - Resolution Sniper")
    p.add_argument("-c", "--continuous", action="store_true", help="Run continuously")
    p.add_argument("-i", "--interval", type=int, default=120, help="Cycle interval (seconds)")
    p.add_argument("--report", action="store_true", help="Show report")
    p.add_argument("--scan", action="store_true", help="Scan only (no trading)")
    args = p.parse_args()

    bot = PolymarketBotV3()

    if args.report:
        bot._print_report()
    elif args.scan:
        markets = bot.scanner.scan()
        for m in markets[:20]:
            print(f"  {m.question[:60]:60s} | Spread: {m.spread:.1%} | "
                  f"Vol24h: ${m.volume_24h:,.0f} | Depth: ${m.orderbook_depth_usd:.0f} | "
                  f"Resolves: {m.days_to_resolution:.0f}d")
    elif args.continuous:
        bot.run_continuous(interval=args.interval)
    else:
        bot.run_cycle()


if __name__ == "__main__":
    main()
