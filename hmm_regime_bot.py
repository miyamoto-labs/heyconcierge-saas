#!/usr/bin/env python3
"""
🌙 HMM Regime Detection Trading Bot 🧠
========================================
Hidden Markov Model regime detector + BB Squeeze strategy on Hyperliquid.

Architecture:
  1. HMM trains on BTC hourly data (5000 candles) → detects 7 market regimes
  2. Strategy layer trades BB Squeeze breakouts filtered by regime
  3. Risk management: 5% TP, 3% SL, 5x leverage, limit orders only, $10/trade
  4. Retrains HMM every 24 hours

Inspired by MoonDev's RBI system and Jim Simons' HMM approach.
Volume change = 94% feature importance (the king feature).

Usage:
  python hmm_regime_bot.py              # Live trading
  python hmm_regime_bot.py --backtest   # Backtest mode
  python hmm_regime_bot.py --train-only # Train HMM and exit

Author: Miyamoto Labs
Disclaimer: Not financial advice. Use at your own risk.
"""

import sys
import os
import json
import time
import pickle
import argparse
import traceback
import warnings
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

SYMBOL = "BTC"
LEVERAGE = 5
POSITION_SIZE_USD = 10       # Starting small per MoonDev's rules
TAKE_PROFIT_PCT = 1.5        # 2.5% TP (was 5% - never hit in backtest)
STOP_LOSS_PCT = 1.5          # 2% SL (tighter risk:reward)
MAX_HOLD_HOURS = 24          # Close after 24h no matter what
LOOP_INTERVAL_SEC = 60       # Check every 60 seconds
HMM_RETRAIN_HOURS = 24       # Retrain every 24 hours
HMM_N_STATES = 7             # Jim Simons sweet spot
HMM_N_ITER = 100
HMM_LOOKBACK_CANDLES = 5000  # Max from Hyperliquid
CANDLE_INTERVAL = "1h"       # Hourly candles
BB_WINDOW = 20
BB_STD = 2.0
KELTNER_WINDOW = 20
KELTNER_ATR_MULT = 1.5
ADX_PERIOD = 14
ADX_THRESHOLD = 25

# Paper trading state
PAPER_MODE = False
PAPER_CASH = 10000

# File paths
WORKSPACE = Path(__file__).parent
STATE_FILE = WORKSPACE / "hmm_bot_state.json"
TRADE_LOG_FILE = WORKSPACE / "hmm_trade_log.json"
REGIME_LOG_FILE = WORKSPACE / "hmm_regime_log.json"
HMM_MODEL_FILE = WORKSPACE / "hmm_model.pkl"
HMM_SCALER_FILE = WORKSPACE / "hmm_scaler.pkl"
CONFIG_FILE = WORKSPACE / "trading_config.json"

# ═══════════════════════════════════════════════════════════════════
# COLORED OUTPUT (MoonDev style)
# ═══════════════════════════════════════════════════════════════════

class C:
    """Simple ANSI colors."""
    R = "\033[91m"  # Red
    G = "\033[92m"  # Green
    Y = "\033[93m"  # Yellow
    B = "\033[94m"  # Blue
    M = "\033[95m"  # Magenta
    C = "\033[96m"  # Cyan
    W = "\033[97m"  # White
    X = "\033[0m"   # Reset

BANNER = f"""
{C.C}
   ╔═══════════════════════════════════════════════════╗
   ║  🧠  HMM REGIME DETECTION BOT  🧠               ║
   ║  Hidden Markov Model + BB Squeeze on Hyperliquid  ║
   ║  7 States • Volume King • Limit Orders Only       ║
   ╚═══════════════════════════════════════════════════╝
{C.X}"""

def log(msg, color=C.W):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{C.C}[{ts}]{C.X} {color}{msg}{C.X}")

def log_trade(msg): log(f"💰 {msg}", C.G)
def log_warn(msg):  log(f"⚠️  {msg}", C.Y)
def log_err(msg):   log(f"❌ {msg}", C.R)
def log_info(msg):  log(f"📊 {msg}", C.B)
def log_regime(msg):log(f"🧠 {msg}", C.M)

# ═══════════════════════════════════════════════════════════════════
# HYPERLIQUID API (from MoonDev's nice_funcs pattern)
# ═══════════════════════════════════════════════════════════════════

HL_API = "https://api.hyperliquid.xyz/info"
HL_HEADERS = {"Content-Type": "application/json"}

def _hl_post(data):
    """Post to Hyperliquid info API."""
    r = requests.post(HL_API, headers=HL_HEADERS, json=data, timeout=15)
    r.raise_for_status()
    return r.json()

def ask_bid(symbol):
    """Get current ask and bid prices."""
    data = _hl_post({"type": "l2Book", "coin": symbol})
    levels = data["levels"]
    bid = float(levels[0][0]["px"])
    ask = float(levels[1][0]["px"])
    return ask, bid

def get_sz_px_decimals(symbol):
    """Get size and price decimal precision for a symbol."""
    meta = _hl_post({"type": "meta"})
    sym_info = next((s for s in meta["universe"] if s["name"] == symbol), None)
    sz_decimals = sym_info["szDecimals"] if sym_info else 0
    ask = ask_bid(symbol)[0]
    ask_str = str(ask)
    px_decimals = len(ask_str.split(".")[1]) if "." in ask_str else 0
    return sz_decimals, px_decimals

def fetch_candles(symbol, interval, lookback_days):
    """Fetch OHLCV candles from Hyperliquid."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=lookback_days)
    data = {
        "type": "candleSnapshot",
        "req": {
            "coin": symbol,
            "interval": interval,
            "startTime": int(start_time.timestamp() * 1000),
            "endTime": int(end_time.timestamp() * 1000),
        },
    }
    raw = _hl_post(data)
    if not raw:
        return pd.DataFrame()

    rows = []
    for c in raw:
        rows.append({
            "timestamp": pd.to_datetime(c["t"], unit="ms"),
            "open": float(c["o"]),
            "high": float(c["h"]),
            "low": float(c["l"]),
            "close": float(c["c"]),
            "volume": float(c["v"]),
        })
    df = pd.DataFrame(rows)
    df.sort_values("timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df

def fetch_funding_rate(symbol):
    """Get current funding rate."""
    try:
        data = _hl_post({"type": "metaAndAssetCtxs"})
        meta = data[0]["universe"]
        ctxs = data[1]
        for i, m in enumerate(meta):
            if m["name"] == symbol:
                return float(ctxs[i].get("funding", 0))
    except Exception:
        pass
    return 0.0

def fetch_open_interest(symbol):
    """Get current open interest."""
    try:
        data = _hl_post({"type": "metaAndAssetCtxs"})
        meta = data[0]["universe"]
        ctxs = data[1]
        for i, m in enumerate(meta):
            if m["name"] == symbol:
                return float(ctxs[i].get("openInterest", 0))
    except Exception:
        pass
    return 0.0

# ═══════════════════════════════════════════════════════════════════
# EXCHANGE EXECUTION (requires hyperliquid SDK + API key)
# ═══════════════════════════════════════════════════════════════════

_account = None
_exchange = None
_info = None

def _init_exchange():
    """Initialize Hyperliquid exchange connection."""
    global _account, _exchange, _info
    if _account is not None:
        return

    try:
        import eth_account
        from hyperliquid.exchange import Exchange
        from hyperliquid.info import Info
        from hyperliquid.utils import constants
    except ImportError:
        log_err("Missing packages: pip install eth-account hyperliquid-python-sdk")
        sys.exit(1)

    key = os.environ.get("HYPER_LIQUID_KEY")
    if not key and CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            cfg = json.load(f)
            # Check common key locations
            key = cfg.get("api_key") or cfg.get("hyper_liquid_key")

    if not key:
        # Try .env file
        env_file = WORKSPACE / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("HYPER_LIQUID_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")

    if not key:
        log_err("No HYPER_LIQUID_KEY found! Set env var or add to trading_config.json")
        sys.exit(1)

    _account = eth_account.Account.from_key(key)
    _exchange = Exchange(_account, constants.MAINNET_API_URL)
    _info = Info(constants.MAINNET_API_URL, skip_ws=True)
    log_info(f"Exchange initialized: {_account.address[:10]}...")

def get_position(symbol):
    """Get current position info. Returns dict with keys: in_pos, size, entry_px, pnl_pct, is_long."""
    if PAPER_MODE:
        ps = _load_paper_state()
        pos = ps.get("position", {})
        if pos and pos.get("size"):
            current_price = ask_bid(symbol)[0]  # use ask as mark
            entry = pos["entry_price"]
            if pos["is_long"]:
                pnl_pct = (current_price - entry) / entry * 100
            else:
                pnl_pct = (entry - current_price) / entry * 100
            return {
                "in_pos": True, "size": pos["size"], "entry_px": entry,
                "pnl_pct": pnl_pct, "is_long": pos["is_long"],
                "acct_value": ps["cash"] + pos.get("cost_usd", 0),
            }
        return {"in_pos": False, "size": 0, "entry_px": 0, "pnl_pct": 0, "is_long": None, "acct_value": ps["cash"]}
    _init_exchange()
    user_state = _info.user_state(_account.address)
    acct_value = float(user_state["marginSummary"]["accountValue"])

    for pos in user_state["assetPositions"]:
        p = pos["position"]
        if p["coin"] == symbol and float(p["szi"]) != 0:
            size = float(p["szi"])
            return {
                "in_pos": True,
                "size": size,
                "entry_px": float(p["entryPx"]),
                "pnl_pct": float(p["returnOnEquity"]) * 100,
                "is_long": size > 0,
                "acct_value": acct_value,
            }

    return {"in_pos": False, "size": 0, "entry_px": 0, "pnl_pct": 0, "is_long": None, "acct_value": acct_value}

def set_leverage(symbol, leverage):
    if PAPER_MODE:
        log_info(f"📝 Paper: leverage set to {leverage}x")
        return
    """Set leverage for symbol."""
    _init_exchange()
    try:
        _exchange.update_leverage(leverage, symbol, is_cross=False)
    except Exception as e:
        log_warn(f"Leverage set issue: {e}")

def place_limit_order(symbol, is_buy, sz, price, reduce_only=False):
    """Place a limit order (GTC). Returns order result."""
    side = "BUY" if is_buy else "SELL"

    if PAPER_MODE:
        log_trade(f"📝 PAPER LIMIT {side} {sz:.6f} {symbol} @ ${price:.2f}")
        _paper_state = _load_paper_state()
        if not reduce_only:
            _paper_state["position"] = {
                "symbol": symbol, "is_long": is_buy, "size": sz,
                "entry_price": price, "entry_time": datetime.utcnow().isoformat(),
                "cost_usd": sz * price / LEVERAGE,
            }
            _paper_state["cash"] -= sz * price / LEVERAGE  # margin used
        else:
            # Closing position
            pos = _paper_state.get("position", {})
            if pos:
                entry_px = pos["entry_price"]
                if pos["is_long"]:
                    pnl = (price - entry_px) / entry_px * pos["cost_usd"] * LEVERAGE
                else:
                    pnl = (entry_px - price) / entry_px * pos["cost_usd"] * LEVERAGE
                _paper_state["cash"] += pos["cost_usd"] + pnl
                _paper_state["total_pnl"] = _paper_state.get("total_pnl", 0) + pnl
                _paper_state["trades"] = _paper_state.get("trades", 0) + 1
                _paper_state["wins"] = _paper_state.get("wins", 0) + (1 if pnl > 0 else 0)
                log_trade(f"📝 PAPER CLOSE PnL: ${pnl:+.2f} | Total: ${_paper_state['total_pnl']:+.2f} | Cash: ${_paper_state['cash']:.2f}")
                _paper_state["position"] = {}
        _save_paper_state(_paper_state)
        return {"paper": True}

    _init_exchange()
    sz_dec = get_sz_px_decimals(symbol)[0]
    sz = round(sz, sz_dec)
    if sz == 0:
        log_warn("Order size rounds to 0, skipping")
        return None

    log_trade(f"LIMIT {side} {sz} {symbol} @ ${price:.2f} (reduce_only={reduce_only})")

    result = _exchange.order(
        symbol, is_buy, sz, price,
        {"limit": {"tif": "Gtc"}},
        reduce_only=reduce_only,
    )
    return result

PAPER_STATE_FILE = WORKSPACE / "hmm_paper_state.json"

def _load_paper_state():
    if PAPER_STATE_FILE.exists():
        return json.loads(PAPER_STATE_FILE.read_text())
    return {"cash": PAPER_CASH, "position": {}, "total_pnl": 0, "trades": 0, "wins": 0, "start_cash": PAPER_CASH}

def _save_paper_state(state):
    PAPER_STATE_FILE.write_text(json.dumps(state, indent=2))

def cancel_all_orders():
    """Cancel all open orders."""
    if PAPER_MODE:
        return
    _init_exchange()
    try:
        open_orders = _info.open_orders(_account.address)
        for order in open_orders:
            _exchange.cancel(order["coin"], order["oid"])
        if open_orders:
            log_info(f"Cancelled {len(open_orders)} open orders")
    except Exception as e:
        log_warn(f"Cancel orders issue: {e}")

def close_position(symbol):
    """Market-close position using aggressive limit order."""
    pos = get_position(symbol)
    if not pos["in_pos"]:
        return
    ask, bid = ask_bid(symbol)
    size = abs(pos["size"])
    if pos["is_long"]:
        # Sell to close - use bid price (aggressive)
        place_limit_order(symbol, False, size, bid, reduce_only=True)
    else:
        # Buy to close - use ask price (aggressive)
        place_limit_order(symbol, True, size, ask, reduce_only=True)

# ═══════════════════════════════════════════════════════════════════
# TECHNICAL INDICATORS (pandas_ta based)
# ═══════════════════════════════════════════════════════════════════

def compute_indicators(df):
    """Add all technical indicators to dataframe. Uses `ta` library (pip install ta)."""
    import ta as ta_lib

    # Core features for HMM
    df["returns"] = df["close"].pct_change()
    df["volatility"] = df["returns"].rolling(20).std()
    df["volume_change"] = df["volume"].pct_change()

    # Bollinger Bands
    bb_ind = ta_lib.volatility.BollingerBands(df["close"], window=BB_WINDOW, window_dev=BB_STD)
    df["bb_upper"] = bb_ind.bollinger_hband()
    df["bb_mid"] = bb_ind.bollinger_mavg()
    df["bb_lower"] = bb_ind.bollinger_lband()
    df["bb_width"] = bb_ind.bollinger_wband()

    # Keltner Channels (for squeeze detection)
    kc_ind = ta_lib.volatility.KeltnerChannel(df["high"], df["low"], df["close"],
                                               window=KELTNER_WINDOW, window_atr=KELTNER_WINDOW,
                                               multiplier=KELTNER_ATR_MULT)
    df["kc_upper"] = kc_ind.keltner_channel_hband()
    df["kc_lower"] = kc_ind.keltner_channel_lband()

    # BB Squeeze: BB inside Keltner
    df["squeeze"] = (df["bb_upper"] < df["kc_upper"]) & (df["bb_lower"] > df["kc_lower"])

    # ADX
    adx_ind = ta_lib.trend.ADXIndicator(df["high"], df["low"], df["close"], window=ADX_PERIOD)
    df["adx"] = adx_ind.adx()

    # ATR for volatility context
    atr_ind = ta_lib.volatility.AverageTrueRange(df["high"], df["low"], df["close"], window=14)
    df["atr"] = atr_ind.average_true_range()

    # RSI
    rsi_ind = ta_lib.momentum.RSIIndicator(df["close"], window=14)
    df["rsi"] = rsi_ind.rsi()

    return df

# ═══════════════════════════════════════════════════════════════════
# HMM REGIME DETECTOR (the brain)
# ═══════════════════════════════════════════════════════════════════

class RegimeDetector:
    """
    Hidden Markov Model regime detector.

    7 states trained on: volume_change (94%), bb_width, volatility
    Uses GaussianHMM with full covariance.
    """

    FEATURE_COLS = ["volume_change", "bb_width", "volatility"]

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.regime_labels = {}  # state_id -> label
        self.last_train_time = None

    def _prepare_features(self, df):
        """Extract and clean feature matrix."""
        features = df[self.FEATURE_COLS].copy()
        features.replace([np.inf, -np.inf], np.nan, inplace=True)
        features.dropna(inplace=True)
        return features

    def train(self, df):
        """Train HMM on dataframe with indicators already computed."""
        from hmmlearn import hmm

        features = self._prepare_features(df)
        if len(features) < 100:
            log_err(f"Not enough data to train HMM: {len(features)} rows")
            return False

        X = features.values
        X_scaled = self.scaler.fit_transform(X)

        log_regime(f"Training HMM on {len(X_scaled)} samples, {HMM_N_STATES} states...")

        self.model = hmm.GaussianHMM(
            n_components=HMM_N_STATES,
            covariance_type="full",
            n_iter=HMM_N_ITER,
            random_state=42,
            verbose=False,
        )
        self.model.fit(X_scaled)

        # Predict states to label them
        states = self.model.predict(X_scaled)
        self._label_states(df.loc[features.index], states)

        self.last_train_time = datetime.utcnow()

        # Compute metrics
        score = self.model.score(X_scaled)
        log_regime(f"HMM trained! Log-likelihood: {score:.1f}")
        log_regime(f"Transition matrix diagonal (stability): {np.diag(self.model.transmat_).round(3)}")

        # Save model
        self._save()
        return True

    def _label_states(self, df, states):
        """
        Label each HMM state based on average returns and volatility
        in that state. This determines our trading behavior.
        
        Labels: bullish, bearish, sideways, high_vol, low_vol, capitulation, recovery
        """
        df = df.copy()
        df["state"] = states

        state_stats = {}
        for s in range(HMM_N_STATES):
            mask = df["state"] == s
            if mask.sum() == 0:
                state_stats[s] = {"mean_ret": 0, "mean_vol": 0, "count": 0}
                continue
            state_stats[s] = {
                "mean_ret": df.loc[mask, "returns"].mean() if "returns" in df.columns else 0,
                "mean_vol": df.loc[mask, "volatility"].mean() if "volatility" in df.columns else 0,
                "mean_vol_chg": df.loc[mask, "volume_change"].mean() if "volume_change" in df.columns else 0,
                "count": int(mask.sum()),
            }

        # Sort states by mean return
        sorted_states = sorted(state_stats.items(), key=lambda x: x[1]["mean_ret"])

        # Assign labels based on return ranking
        labels = {}
        n = len(sorted_states)
        for i, (state_id, stats) in enumerate(sorted_states):
            if stats["count"] == 0:
                labels[state_id] = "inactive"
            elif i == 0:
                labels[state_id] = "capitulation"  # Most negative returns
            elif i == 1:
                labels[state_id] = "bearish"
            elif i == n - 1:
                labels[state_id] = "bullish"  # Most positive returns
            elif i == n - 2:
                labels[state_id] = "recovery"
            elif stats["mean_vol"] > np.median([s["mean_vol"] for s in state_stats.values()]):
                labels[state_id] = "high_vol"
            else:
                labels[state_id] = "sideways"

        self.regime_labels = labels

        log_regime("State labels assigned:")
        for s_id, label in sorted(labels.items()):
            stats = state_stats[s_id]
            log_regime(f"  State {s_id} → {label:15s} | ret={stats['mean_ret']:.6f} vol={stats['mean_vol']:.6f} n={stats['count']}")

    def predict(self, df):
        """Predict current regime from latest data. Returns (state_id, label, probabilities)."""
        if self.model is None:
            return None, "unknown", None

        features = self._prepare_features(df)
        if len(features) == 0:
            return None, "unknown", None

        X = features.values
        X_scaled = self.scaler.transform(X)

        states = self.model.predict(X_scaled)
        probs = self.model.predict_proba(X_scaled)

        current_state = states[-1]
        current_label = self.regime_labels.get(current_state, "unknown")
        current_probs = probs[-1]

        return current_state, current_label, current_probs

    def needs_retrain(self):
        """Check if HMM needs retraining."""
        if self.model is None or self.last_train_time is None:
            return True
        elapsed = (datetime.utcnow() - self.last_train_time).total_seconds() / 3600
        return elapsed >= HMM_RETRAIN_HOURS

    def _save(self):
        """Save model and scaler to disk."""
        with open(HMM_MODEL_FILE, "wb") as f:
            pickle.dump({"model": self.model, "labels": self.regime_labels, "train_time": self.last_train_time}, f)
        with open(HMM_SCALER_FILE, "wb") as f:
            pickle.dump(self.scaler, f)
        log_info(f"HMM model saved to {HMM_MODEL_FILE}")

    def load(self):
        """Load model from disk."""
        if HMM_MODEL_FILE.exists() and HMM_SCALER_FILE.exists():
            with open(HMM_MODEL_FILE, "rb") as f:
                data = pickle.load(f)
                self.model = data["model"]
                self.regime_labels = data["labels"]
                self.last_train_time = data.get("train_time")
            with open(HMM_SCALER_FILE, "rb") as f:
                self.scaler = pickle.load(f)
            log_info("HMM model loaded from disk")
            return True
        return False

# ═══════════════════════════════════════════════════════════════════
# STATE PERSISTENCE
# ═══════════════════════════════════════════════════════════════════

def load_state():
    """Load bot state from disk."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        "entry_time": None,
        "entry_price": None,
        "entry_side": None,
        "regime_at_entry": None,
        "trades": [],
    }

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2, default=str)

def log_regime_prediction(state_id, label, probs):
    """Append regime prediction to log."""
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "state_id": int(state_id) if state_id is not None else None,
        "label": label,
        "probabilities": [round(float(p), 4) for p in probs] if probs is not None else None,
    }
    log_data = []
    if REGIME_LOG_FILE.exists():
        try:
            with open(REGIME_LOG_FILE) as f:
                log_data = json.load(f)
        except Exception:
            log_data = []
    log_data.append(entry)
    # Keep last 1000 entries
    log_data = log_data[-1000:]
    with open(REGIME_LOG_FILE, "w") as f:
        json.dump(log_data, f, indent=2)

def log_trade_entry(trade_info):
    """Append trade to log."""
    trades = []
    if TRADE_LOG_FILE.exists():
        try:
            with open(TRADE_LOG_FILE) as f:
                trades = json.load(f)
        except Exception:
            trades = []
    trades.append(trade_info)
    with open(TRADE_LOG_FILE, "w") as f:
        json.dump(trades, f, indent=2, default=str)

# ═══════════════════════════════════════════════════════════════════
# STRATEGY LOGIC
# ═══════════════════════════════════════════════════════════════════

def should_trade(regime_label):
    """
    Determine if we should trade based on regime.
    
    Bullish regime → LONG on BB squeeze breakout
    Bearish regime → SHORT on BB squeeze breakdown
    Recovery regime → LONG (cautious)
    Capitulation → Mean reversion LONG (liquidation hunting)
    Sideways → Both directions (BB squeeze is the filter)
    High_vol → SKIP (too dangerous)
    """
    tradeable = {
        "bullish": "long",
        "bearish": "short",
        "recovery": "long",
        "capitulation": "long",  # Mean reversion after capitulation
        "sideways": "both",     # Let BB squeeze direction decide
    }
    return tradeable.get(regime_label, None)

def check_bb_squeeze_signal(df):
    """
    Check for BB Squeeze breakout signal.
    Returns: "long", "short", or None
    
    Signal: Squeeze was active → now released + ADX confirms trend + price breaks band
    """
    if len(df) < 3:
        return None

    curr = df.iloc[-1]
    prev = df.iloc[-2]

    # Squeeze must have just released
    squeeze_released = prev["squeeze"] and not curr["squeeze"]
    if not squeeze_released:
        return None

    # ADX must confirm trend strength
    if pd.isna(curr["adx"]) or curr["adx"] < ADX_THRESHOLD:
        return None

    # Check breakout direction (within 0.3% of band counts as break)
    bb_tolerance = 0.003
    if curr["close"] > curr["bb_upper"] * (1 - bb_tolerance):
        return "long"
    elif curr["close"] < curr["bb_lower"] * (1 + bb_tolerance):
        return "short"

    return None

def check_capitulation_signal(df):
    """
    Check for mean reversion after capitulation (liquidation hunting).
    Large volume spike + price near BB lower = buy opportunity.
    Returns: "long" or None
    """
    if len(df) < 5:
        return None

    curr = df.iloc[-1]

    # Volume spike (3x average)
    avg_vol = df["volume"].rolling(50).mean().iloc[-1]
    if pd.isna(avg_vol) or avg_vol == 0:
        return None

    vol_ratio = curr["volume"] / avg_vol
    if vol_ratio < 3.0:
        return None

    # Price near or below lower BB (oversold after capitulation)
    if pd.isna(curr["bb_lower"]):
        return None
    if curr["close"] <= curr["bb_lower"] * 1.01:  # Within 1% of lower BB
        # RSI oversold confirmation
        if not pd.isna(curr["rsi"]) and curr["rsi"] < 35:
            return "long"

    return None

# ═══════════════════════════════════════════════════════════════════
# MAIN BOT LOOP
# ═══════════════════════════════════════════════════════════════════

def run_live():
    """Main live trading loop."""
    print(BANNER)
    log_info(f"Starting LIVE mode | {SYMBOL} | {LEVERAGE}x | ${POSITION_SIZE_USD}/trade")
    log_info(f"TP: {TAKE_PROFIT_PCT}% | SL: {STOP_LOSS_PCT}% | Max hold: {MAX_HOLD_HOURS}h")

    detector = RegimeDetector()
    if not detector.load():
        log_info("No saved model found, will train on first run")

    state = load_state()

    while True:
        try:
            _one_cycle(detector, state)
            save_state(state)
            time.sleep(LOOP_INTERVAL_SEC)
        except KeyboardInterrupt:
            log_warn("Bot stopped by user")
            save_state(state)
            break
        except Exception as e:
            log_err(f"Cycle error: {e}")
            traceback.print_exc()
            time.sleep(30)

def _one_cycle(detector, state):
    """Single bot cycle."""
    now = datetime.utcnow()

    # ── Fetch data ───────────────────────────────────
    lookback_days = max(int(HMM_LOOKBACK_CANDLES / 24) + 5, 30)
    df = fetch_candles(SYMBOL, CANDLE_INTERVAL, lookback_days)
    if df.empty or len(df) < 100:
        log_warn(f"Not enough candle data: {len(df)} rows")
        return

    df = compute_indicators(df)
    df.dropna(subset=["volume_change", "bb_width", "volatility"], inplace=True)

    # ── Retrain HMM if needed ────────────────────────
    if detector.needs_retrain():
        log_regime("HMM retraining triggered...")
        detector.train(df)

    # ── Predict current regime ───────────────────────
    state_id, regime_label, probs = detector.predict(df)
    log_regime(f"Current regime: {regime_label} (state {state_id})")
    if probs is not None:
        top3 = sorted(enumerate(probs), key=lambda x: -x[1])[:3]
        prob_str = " | ".join([f"S{s}({detector.regime_labels.get(s,'?')}): {p:.1%}" for s, p in top3])
        log_regime(f"Top probabilities: {prob_str}")
    log_regime_prediction(state_id, regime_label, probs)

    # ── Check existing position ──────────────────────
    pos = get_position(SYMBOL)
    funding = fetch_funding_rate(SYMBOL)
    ask, bid = ask_bid(SYMBOL)

    log_info(f"Price: ${bid:.2f}/{ask:.2f} | Funding: {funding:.6f} | Acct: ${pos['acct_value']:.2f}")

    if pos["in_pos"]:
        _manage_position(pos, state, df)
        return

    # ── Check for entry ──────────────────────────────
    direction = should_trade(regime_label)
    if direction is None:
        log_info(f"Regime '{regime_label}' → no trade (capital preservation) 🛡️")
        return

    # Get signal based on regime
    signal = None
    if regime_label == "capitulation":
        signal = check_capitulation_signal(df)
        if signal:
            log_trade("CAPITULATION signal! Mean reversion entry 🎯")
    else:
        signal = check_bb_squeeze_signal(df)
        if signal:
            log_trade(f"BB SQUEEZE breakout signal: {signal} 🚀")

    if signal is None:
        log_info("No entry signal this cycle")
        return

    # Regime-direction alignment check ("both" allows any signal direction)
    if direction != "both":
        if regime_label in ("bullish", "recovery", "capitulation") and signal != "long":
            log_info(f"Signal {signal} conflicts with {regime_label} regime, skipping")
            return
        if regime_label == "bearish" and signal != "short":
            log_info(f"Signal {signal} conflicts with bearish regime, skipping")
            return

    # ── Execute entry ────────────────────────────────
    cancel_all_orders()
    set_leverage(SYMBOL, LEVERAGE)

    is_buy = signal == "long"
    entry_price = bid if is_buy else ask  # Limit order at best price
    sz_dec = get_sz_px_decimals(SYMBOL)[0]
    size = round((POSITION_SIZE_USD / entry_price) * LEVERAGE, sz_dec)

    if size == 0:
        log_warn("Calculated size is 0, skipping")
        return

    log_trade(f"ENTERING {signal.upper()} | Size: {size} | Price: ${entry_price:.2f} | Regime: {regime_label}")

    result = place_limit_order(SYMBOL, is_buy, size, entry_price, reduce_only=False)

    state["entry_time"] = now.isoformat()
    state["entry_price"] = entry_price
    state["entry_side"] = signal
    state["regime_at_entry"] = regime_label

    trade_info = {
        "timestamp": now.isoformat(),
        "action": "entry",
        "side": signal,
        "price": entry_price,
        "size": size,
        "regime": regime_label,
        "state_id": int(state_id) if state_id is not None else None,
    }
    log_trade_entry(trade_info)

def _manage_position(pos, state, df):
    """Manage existing position: check TP/SL/time exit."""
    pnl = pos["pnl_pct"]
    side = "LONG" if pos["is_long"] else "SHORT"
    log_info(f"Position: {side} {abs(pos['size'])} @ ${pos['entry_px']:.2f} | PnL: {pnl:.2f}%")

    # Take profit
    if pnl >= TAKE_PROFIT_PCT:
        log_trade(f"🎯 TAKE PROFIT hit! PnL: {pnl:.2f}% ≥ {TAKE_PROFIT_PCT}%")
        close_position(SYMBOL)
        _record_exit(state, "take_profit", pnl)
        return

    # Stop loss
    if pnl <= -STOP_LOSS_PCT:
        log_trade(f"🛑 STOP LOSS hit! PnL: {pnl:.2f}% ≤ -{STOP_LOSS_PCT}%")
        close_position(SYMBOL)
        _record_exit(state, "stop_loss", pnl)
        return

    # Max hold time
    if state.get("entry_time"):
        entry_dt = datetime.fromisoformat(state["entry_time"])
        hours_held = (datetime.utcnow() - entry_dt).total_seconds() / 3600
        if hours_held >= MAX_HOLD_HOURS:
            log_trade(f"⏰ MAX HOLD TIME ({MAX_HOLD_HOURS}h) reached! Closing. PnL: {pnl:.2f}%")
            close_position(SYMBOL)
            _record_exit(state, "max_hold_time", pnl)
            return
        log_info(f"Hold time: {hours_held:.1f}h / {MAX_HOLD_HOURS}h")

def _record_exit(state, reason, pnl):
    """Record trade exit."""
    trade_info = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": "exit",
        "reason": reason,
        "pnl_pct": pnl,
        "side": state.get("entry_side"),
        "entry_price": state.get("entry_price"),
        "regime_at_entry": state.get("regime_at_entry"),
    }
    log_trade_entry(trade_info)
    state["entry_time"] = None
    state["entry_price"] = None
    state["entry_side"] = None
    state["regime_at_entry"] = None

# ═══════════════════════════════════════════════════════════════════
# BACKTESTING MODE
# ═══════════════════════════════════════════════════════════════════

def run_backtest():
    """Run backtest using backtesting.py library."""
    print(BANNER)
    log_info("Starting BACKTEST mode...")

    try:
        from backtesting import Backtest, Strategy
    except ImportError:
        log_err("Missing packages: pip install backtesting pandas_ta")
        sys.exit(1)

    # Fetch data
    log_info(f"Fetching {SYMBOL} {CANDLE_INTERVAL} data...")
    lookback_days = int(HMM_LOOKBACK_CANDLES / 24) + 5
    df = fetch_candles(SYMBOL, CANDLE_INTERVAL, lookback_days)
    if df.empty:
        log_err("No data fetched!")
        return

    df = compute_indicators(df)
    df.dropna(inplace=True)

    log_info(f"Data: {len(df)} candles from {df['timestamp'].iloc[0]} to {df['timestamp'].iloc[-1]}")

    # Train HMM on first 70% (in-sample), test on last 30% (out-of-sample)
    split = int(len(df) * 0.7)
    train_df = df.iloc[:split].copy()
    test_df = df.iloc[split:].copy()

    log_info(f"Train: {len(train_df)} candles | Test: {len(test_df)} candles")

    detector = RegimeDetector()
    detector.train(train_df)

    # Predict regimes for full dataset
    _, _, _ = detector.predict(df)
    features = df[RegimeDetector.FEATURE_COLS].replace([np.inf, -np.inf], np.nan).dropna()
    X_scaled = detector.scaler.transform(features.values)
    all_states = detector.model.predict(X_scaled)
    df.loc[features.index, "hmm_state"] = all_states
    df["hmm_label"] = df["hmm_state"].map(detector.regime_labels)

    # Prepare data for backtesting.py (needs Open/High/Low/Close/Volume columns)
    bt_df = test_df.copy()
    # Re-align HMM states with test data
    bt_df = bt_df.loc[bt_df.index.isin(features.index)]
    bt_df["hmm_state"] = df.loc[bt_df.index, "hmm_state"]
    bt_df["hmm_label"] = df.loc[bt_df.index, "hmm_label"]

    bt_data = bt_df.rename(columns={
        "open": "Open", "high": "High", "low": "Low",
        "close": "Close", "volume": "Volume",
    })
    bt_data.set_index("timestamp", inplace=True)

    # Encode regimes as numeric for backtesting.py compatibility
    _regime_map = {"bullish": 1, "bearish": 2, "recovery": 3, "capitulation": 4,
                   "sideways": 5, "high_vol": 6, "inactive": 7, "unknown": 0}
    _regime_map_inv = {v: k for k, v in _regime_map.items()}

    _regime_series = bt_data["hmm_label"].map(lambda x: _regime_map.get(str(x), 0)).astype(float)
    _squeeze_series = bt_data["squeeze"].astype(float) if "squeeze" in bt_data.columns else pd.Series(0.0, index=bt_data.index)
    _adx_series = bt_data["adx"].copy() if "adx" in bt_data.columns else pd.Series(0.0, index=bt_data.index)
    _bb_upper_series = bt_data["bb_upper"].copy() if "bb_upper" in bt_data.columns else pd.Series(np.nan, index=bt_data.index)
    _bb_lower_series = bt_data["bb_lower"].copy() if "bb_lower" in bt_data.columns else pd.Series(np.nan, index=bt_data.index)
    _rsi_series = bt_data["rsi"].copy() if "rsi" in bt_data.columns else pd.Series(50.0, index=bt_data.index)
    _vol_ratio_series = (bt_data["Volume"] / bt_data["Volume"].rolling(50).mean()).copy()

    # Keep only OHLCV for backtesting.py
    bt_data = bt_data[["Open", "High", "Low", "Close", "Volume"]].copy()
    bt_data.dropna(inplace=True)

    # Align all series
    common_idx = bt_data.index
    _regime_series = _regime_series.reindex(common_idx).fillna(0).astype(float)
    _squeeze_series = _squeeze_series.reindex(common_idx).fillna(0).astype(float)
    _adx_series = _adx_series.reindex(common_idx).fillna(0).astype(float)
    _bb_upper_series = _bb_upper_series.reindex(common_idx).ffill().bfill().astype(float)
    _bb_lower_series = _bb_lower_series.reindex(common_idx).ffill().bfill().astype(float)
    _rsi_series = _rsi_series.reindex(common_idx).fillna(50).astype(float)
    _vol_ratio_series = _vol_ratio_series.reindex(common_idx).fillna(1).astype(float)

    # Debug: count squeeze releases in test data
    _sq_vals = _squeeze_series.values
    _release_count = 0
    _tradeable_count = 0
    for _i in range(1, len(_sq_vals)):
        if _sq_vals[_i-1] > 0.5 and _sq_vals[_i] < 0.5:
            _release_count += 1
            _a = _adx_series.values[_i]
            _r = _regime_series.values[_i]
            _regime_lbl = _regime_map_inv.get(int(_r), "unknown")
            _dir = should_trade(_regime_lbl)
            _p = bt_data["Close"].iloc[_i]
            _bu = _bb_upper_series.values[_i]
            _bl = _bb_lower_series.values[_i]
            _tol = 0.003
            _go_l = _p > _bu * (1 - _tol)
            _go_s = _p < _bl * (1 + _tol)
            if _a > ADX_THRESHOLD and _dir and ((_dir in ("long","both") and _go_l) or (_dir in ("short","both") and _go_s)):
                _tradeable_count += 1
                log_info(f"BT signal: {bt_data.index[_i]} regime={_regime_lbl} dir={_dir} price={_p:.0f} bb_u={_bu:.0f} bb_l={_bl:.0f} adx={_a:.1f}")
    log_info(f"Squeeze releases in test: {_release_count}, tradeable: {_tradeable_count}")
    log_info(f"Array lengths: data={len(bt_data)} regime={len(_regime_series)} squeeze={len(_squeeze_series)}")

    class HMMRegimeStrategy(Strategy):
        tp_pct = TAKE_PROFIT_PCT / 100
        sl_pct = STOP_LOSS_PCT / 100

        def init(self):
            self.regime = self.I(lambda: _regime_series.values, name="regime", plot=False)
            self.squeeze_arr = self.I(lambda: _squeeze_series.values, name="squeeze", plot=False)
            self.adx_arr = self.I(lambda: _adx_series.values, name="adx", plot=False)
            self.bb_up = self.I(lambda: _bb_upper_series.values, name="bb_upper")
            self.bb_lo = self.I(lambda: _bb_lower_series.values, name="bb_lower")
            self.rsi_arr = self.I(lambda: _rsi_series.values, name="rsi", plot=False)
            self.vol_ratio = self.I(lambda: _vol_ratio_series.values, name="vol_ratio", plot=False)
            self._bars_in_trade = 0

        def next(self):
            if self.position:
                self._bars_in_trade += 1
                price = self.data.Close[-1]
                entry = getattr(self, '_entry_price', price)
                if self.position.is_long:
                    pnl_pct = (price - entry) / entry
                else:
                    pnl_pct = (entry - price) / entry
                # TP/SL/MaxHold
                if pnl_pct >= self.tp_pct or pnl_pct <= -self.sl_pct or self._bars_in_trade >= MAX_HOLD_HOURS:
                    self.position.close()
                    self._bars_in_trade = 0
                return

            self._bars_in_trade = 0

            # backtesting.py: [-1] = current bar, [-2] = previous bar
            regime_val = self.regime[-1]
            if np.isnan(regime_val):
                return
            regime_num = int(regime_val)
            regime = _regime_map_inv.get(regime_num, "unknown")

            sq_now = self.squeeze_arr[-1]
            sq_prev = self.squeeze_arr[-2]
            if np.isnan(sq_now) or np.isnan(sq_prev):
                return
            squeeze_prev = sq_prev > 0.5
            squeeze_now = sq_now > 0.5

            adx_val = self.adx_arr[-1]
            if np.isnan(adx_val):
                adx_val = 0
            price = self.data.Close[-1]

            # Determine allowed direction
            direction = should_trade(regime)
            if direction is None:
                return

            # BB Squeeze breakout
            squeeze_released = squeeze_prev and not squeeze_now
            if squeeze_released:
                if not hasattr(self, '_debug_count'):
                    self._debug_count = 0
                self._debug_count += 1
                if self._debug_count <= 5:
                    print(f"  DBG squeeze_release: bar={len(self.data)} regime={regime} dir={direction} adx={adx_val:.1f} price={price:.0f}")
            if squeeze_released and adx_val > ADX_THRESHOLD:
                try:
                    bb_u = float(self.bb_up[-1])
                    bb_l = float(self.bb_lo[-1])
                except (IndexError, ValueError):
                    return

                bb_tol = 0.003  # 0.3% tolerance
                go_long = price > bb_u * (1 - bb_tol)
                go_short = price < bb_l * (1 + bb_tol)
                if not hasattr(self, '_dbg2'):
                    self._dbg2 = 0
                self._dbg2 += 1
                if self._dbg2 <= 10:
                    print(f"  DBG2: bar={len(self.data)} dir={direction} price={price:.0f} bb_u={bb_u:.0f} bb_l={bb_l:.0f} go_l={go_long} go_s={go_short}")

                if (direction in ("long", "both")) and go_long:
                    print(f"  >>> BUYING at bar {len(self.data)} price={price:.0f}")
                    self.buy(size=0.99)
                    self._entry_price = price
                elif (direction in ("short", "both")) and go_short:
                    print(f"  >>> SELLING at bar {len(self.data)} price={price:.0f}")
                    self.sell(size=0.99)
                    self._entry_price = price

            # Capitulation mean reversion
            elif regime == "capitulation":
                try:
                    vr = float(self.vol_ratio[-1])
                    rsi_val = float(self.rsi_arr[-1])
                    bb_l = float(self.bb_lo[-1])
                except (IndexError, ValueError):
                    return
                if vr > 3.0 and rsi_val < 35 and price <= bb_l * 1.01:
                    self.buy(size=0.99)
                    self._entry_price = price

    # Run backtest
    bt = Backtest(
        bt_data,
        HMMRegimeStrategy,
        cash=100000,
        margin=1/LEVERAGE,   # 5x leverage
        commission=0.00035,  # Hyperliquid maker fee
        exclusive_orders=True,
        trade_on_close=False,
        hedging=False,
    )

    stats = bt.run()

    print(f"\n{C.C}{'='*80}")
    print(f"{'='*25} 📊 BACKTEST RESULTS 📊 {'='*25}")
    print(f"{'='*80}{C.X}")
    print(stats)
    print(f"\n{C.G}Key Metrics:{C.X}")
    print(f"  Return:        {stats.get('Return [%]', 'N/A'):.2f}%")
    print(f"  Buy & Hold:    {stats.get('Buy & Hold Return [%]', 'N/A'):.2f}%")
    print(f"  Sharpe:        {stats.get('Sharpe Ratio', 'N/A'):.3f}")
    print(f"  Max Drawdown:  {stats.get('Max. Drawdown [%]', 'N/A'):.2f}%")
    print(f"  Win Rate:      {stats.get('Win Rate [%]', 'N/A'):.1f}%")
    print(f"  # Trades:      {stats.get('# Trades', 'N/A')}")
    print(f"  Exposure Time: {stats.get('Exposure Time [%]', 'N/A'):.1f}%")
    print(f"  Profit Factor: {stats.get('Profit Factor', 'N/A')}")
    print(f"  Expectancy:    {stats.get('Expectancy [%]', 'N/A')}")

    # Regime distribution
    print(f"\n{C.M}Regime Distribution in Test Data:{C.X}")
    regime_counts = _regime_series.loc[common_idx].value_counts()
    for code, count in regime_counts.items():
        label = _regime_map_inv.get(int(code), "unknown")
        pct = count / len(common_idx) * 100
        print(f"  {label:15s}: {count:5d} ({pct:.1f}%)")

    try:
        bt.plot(filename=str(WORKSPACE / "hmm_backtest_results.html"), open_browser=False)
        log_info(f"Chart saved to {WORKSPACE / 'hmm_backtest_results.html'}")
    except Exception:
        pass

    return stats

# ═══════════════════════════════════════════════════════════════════
# TRAIN-ONLY MODE
# ═══════════════════════════════════════════════════════════════════

def run_train_only():
    """Train HMM and show regime analysis, then exit."""
    print(BANNER)
    log_info("Training HMM model...")

    lookback_days = int(HMM_LOOKBACK_CANDLES / 24) + 5
    df = fetch_candles(SYMBOL, CANDLE_INTERVAL, lookback_days)
    if df.empty:
        log_err("No data!")
        return

    df = compute_indicators(df)
    df.dropna(subset=RegimeDetector.FEATURE_COLS, inplace=True)
    log_info(f"Training on {len(df)} candles")

    detector = RegimeDetector()
    detector.train(df)

    state_id, label, probs = detector.predict(df)
    log_regime(f"Current market regime: {label} (state {state_id})")

    # Show transition matrix
    print(f"\n{C.M}Transition Matrix:{C.X}")
    tm = detector.model.transmat_
    for i in range(HMM_N_STATES):
        row = " ".join([f"{tm[i][j]:.3f}" for j in range(HMM_N_STATES)])
        lbl = detector.regime_labels.get(i, "?")
        print(f"  State {i} ({lbl:12s}): [{row}]")

    # Feature importance (approximate via mean variance contribution)
    print(f"\n{C.M}Feature Importance (variance contribution):{C.X}")
    means = detector.model.means_
    total_var = np.var(means, axis=0)
    total = total_var.sum()
    for i, col in enumerate(RegimeDetector.FEATURE_COLS):
        imp = total_var[i] / total * 100 if total > 0 else 0
        print(f"  {col:20s}: {imp:.1f}%")

    log_info("Training complete! Model saved.")

# ═══════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="HMM Regime Detection Trading Bot")
    parser.add_argument("--backtest", action="store_true", help="Run backtest mode")
    parser.add_argument("--train-only", action="store_true", help="Train HMM and exit")
    parser.add_argument("--symbol", default=SYMBOL, help="Trading symbol (default: BTC)")
    parser.add_argument("--size", type=float, default=POSITION_SIZE_USD, help="Position size in USD")
    parser.add_argument("--leverage", type=int, default=LEVERAGE, help="Leverage (max 5)")
    parser.add_argument("--paper", action="store_true", help="Paper trading mode (no real orders)")
    parser.add_argument("--cash", type=float, default=10000, help="Paper trading starting cash")
    args = parser.parse_args()

    # Update globals via module-level assignment
    globals()["SYMBOL"] = args.symbol
    globals()["POSITION_SIZE_USD"] = args.size
    globals()["LEVERAGE"] = min(args.leverage, 5)  # Hard cap at 5x

    globals()["PAPER_MODE"] = args.paper
    globals()["PAPER_CASH"] = args.cash

    if args.backtest:
        run_backtest()
    elif args.train_only:
        run_train_only()
    else:
        if args.paper:
            log(f"🔶 PAPER TRADING MODE — ${args.cash:,.0f} virtual capital", C.Y)
        run_live()

if __name__ == "__main__":
    main()
