"""
Configuration for Polymarket Superbot
Central config for all strategies and execution
"""

import os
from typing import Dict, Any

# ============================================================================
# WALLET & EXECUTION
# ============================================================================

# Wallet credentials
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"

# Trading mode
PAPER_MODE = True  # Set to False for live trading
MAX_DAILY_LOSS_PCT = 10.0  # Stop trading if down >10% in a day
MAX_POSITION_SIZE_PCT = 20.0  # Max 20% of capital per trade

# Capital allocation
STARTING_CAPITAL = 100.0  # Start with $100 (paper mode)
LIVE_CAPITAL = 5000.0  # Use $5K for live trading

# ============================================================================
# API ENDPOINTS
# ============================================================================

CLOB_HOST = "https://clob.polymarket.com"
GAMMA_API = "https://gamma-api.polymarket.com"
CHAIN_ID = 137  # Polygon mainnet

# ============================================================================
# STRATEGY WEIGHTS
# ============================================================================

STRATEGY_WEIGHTS = {
    "llm_forecast": 0.40,      # 40% - LLM probability forecasting
    "whale_copy": 0.30,        # 30% - Copy whale trades
    "low_risk_bond": 0.20,     # 20% - Near-certain outcomes
    "news_scalp": 0.10         # 10% - Breaking news reactions
}

# ============================================================================
# LLM FORECASTING CONFIG
# ============================================================================

LLM_CONFIG = {
    "model": "deepseek-chat",  # Ultra-cheap for cost efficiency
    "min_edge": 0.05,  # Only trade if edge >5%
    "min_confidence": "MEDIUM",  # HIGH/MEDIUM/LOW
    "news_sources": [
        "coindesk.com",
        "theblock.co",
        "decrypt.co",
        "reuters.com",
        "bloomberg.com",
        "apnews.com"
    ],
    "max_news_age_hours": 24,
    "twitter_monitoring": True,  # Use existing bird skill
    "reddit_monitoring": True    # Monitor r/cryptocurrency, r/polymarket
}

# ============================================================================
# WHALE COPY CONFIG
# ============================================================================

WHALE_WALLETS = {
    "ImJustKen": {
        "address": "0x9d84ce0306f8551e02efef1680475fc0f1dc1344",
        "profit": 2400000,
        "specialty": "politics",
        "min_position_usd": 5000  # Only copy if whale bets >$5K
    },
    "fengdubiying": {
        "address": "0x17db3fcd93ba12d38382a0cade24b200185c5f6d",
        "profit": 2900000,
        "specialty": "esports",
        "min_position_usd": 3000
    },
    "Walrus": {
        "address": "0xfde62dd29574bab38f9f3e4f1da3c1b98c67dfb8",
        "profit": 1300000,
        "specialty": "crypto",
        "min_position_usd": 2000
    },
    "Domer": {
        "address": "0x7bce56c30bb2e09c33ed0b4a68a5c0b6e8c6dc97",
        "profit": 1200000,
        "specialty": "politics",
        "min_position_usd": 2000
    },
    "Fredi9999": {
        "address": "0x3b90fb6b60c8e8f57f9e0a8d35fe4f7c30c07e91",
        "profit": 600000,
        "specialty": "general",
        "min_position_usd": 1000
    }
}

WHALE_COPY_CONFIG = {
    "position_size_pct": 15,  # Copy with 10-20% of whale size
    "delay_seconds": 30,  # Wait 30-60 seconds to avoid front-running
    "max_copies_per_day": 5,
    "min_whale_conviction": 5000  # Only copy bets >$5K
}

# ============================================================================
# LOW-RISK BOND CONFIG
# ============================================================================

BOND_CONFIG = {
    "min_probability": 0.95,  # Only markets >95% certain
    "max_price": 0.96,  # Must be underpriced
    "max_time_to_resolution_hours": 72,  # Resolve within 3 days
    "min_liquidity_usd": 10000,  # Ensure we can exit
    "max_position_pct": 20,  # Never >20% per bond
    "min_positions": 5,  # Diversify across 5+ bonds
    "target_return_pct": 3.0  # Target 3%+ return per trade
}

# ============================================================================
# NEWS SCALPING CONFIG
# ============================================================================

NEWS_CONFIG = {
    "sources": [
        "https://twitter.com/wublockchain",  # Crypto news
        "https://twitter.com/zerohedge",      # Breaking market news
        "https://twitter.com/degen_gambler",  # Polymarket insider
        "https://www.reddit.com/r/cryptocurrency/new/",
        "https://cryptopanic.com/api/v1/posts/"
    ],
    "keywords_crypto": [
        "hack", "exploit", "sec", "regulation", 
        "exchange", "binance", "coinbase", "ftx"
    ],
    "keywords_politics": [
        "resign", "fired", "appointed", "indicted",
        "announcement", "breaking"
    ],
    "reaction_time_seconds": 30,  # Act within 30 seconds
    "min_edge": 0.10,  # Only trade if LLM sees >10% mispricing
    "max_positions": 3  # Max 3 scalp trades active
}

# ============================================================================
# RISK MANAGEMENT
# ============================================================================

RISK_LIMITS = {
    "max_position_size_usd": 20.0,  # Never bet >$20 per trade
    "max_daily_trades": 20,
    "max_daily_loss_usd": 10.0,  # Stop if lose $10 in a day
    "max_correlated_positions": 3,  # Don't bet same direction on related markets
    "require_liquidity_check": True,
    "min_exit_liquidity_usd": 1000  # Must be able to sell $1K instantly
}

# ============================================================================
# LEARNING & ADAPTATION
# ============================================================================

LEARNING_CONFIG = {
    "track_all_predictions": True,
    "update_weights_daily": True,
    "min_trades_before_adjustment": 20,
    "strategy_kill_threshold": -0.15,  # Disable if down >15%
    "calibration_window_days": 7
}

# ============================================================================
# MONITORING & LOGGING
# ============================================================================

LOGGING_CONFIG = {
    "log_level": "INFO",
    "log_file": "data/superbot.log",
    "save_all_predictions": True,
    "save_orderbook_snapshots": True,
    "enable_telegram_alerts": False,  # TODO: Add Telegram notifications
    "alert_on_trade": True,
    "alert_on_error": True
}

# ============================================================================
# DATA PATHS
# ============================================================================

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
WHALE_WALLETS_FILE = os.path.join(DATA_DIR, "whale_wallets.json")
MARKET_HISTORY_FILE = os.path.join(DATA_DIR, "market_history.json")
LEARNED_PARAMS_FILE = os.path.join(DATA_DIR, "learned_params.json")
POSITIONS_FILE = os.path.join(DATA_DIR, "active_positions.json")

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_capital() -> float:
    """Get current trading capital based on mode"""
    return STARTING_CAPITAL if PAPER_MODE else LIVE_CAPITAL

def get_max_position_size() -> float:
    """Calculate max position size"""
    capital = get_capital()
    return min(
        capital * (MAX_POSITION_SIZE_PCT / 100),
        RISK_LIMITS["max_position_size_usd"]
    )

def get_strategy_allocation(strategy_name: str) -> float:
    """Get capital allocation for a strategy"""
    weight = STRATEGY_WEIGHTS.get(strategy_name, 0.0)
    return get_capital() * weight

# ============================================================================
# EXPORT ALL
# ============================================================================

__all__ = [
    "WALLET_ADDRESS",
    "PRIVATE_KEY",
    "PAPER_MODE",
    "CLOB_HOST",
    "GAMMA_API",
    "STRATEGY_WEIGHTS",
    "LLM_CONFIG",
    "WHALE_WALLETS",
    "WHALE_COPY_CONFIG",
    "BOND_CONFIG",
    "NEWS_CONFIG",
    "RISK_LIMITS",
    "LEARNING_CONFIG",
    "LOGGING_CONFIG",
    "get_capital",
    "get_max_position_size",
    "get_strategy_allocation"
]
