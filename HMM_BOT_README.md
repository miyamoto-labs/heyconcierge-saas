# 🧠 HMM Regime Detection Trading Bot

**Hidden Markov Model regime detector + BB Squeeze strategy on Hyperliquid**

Built on MoonDev's RBI system and Jim Simons' HMM approach. Uses 7 hidden states to detect market regimes, then layers BB Squeeze breakout strategy filtered by regime.

## Quick Start

```bash
# Install dependencies
pip install hmmlearn pandas_ta scikit-learn requests eth-account hyperliquid-python-sdk backtesting

# Set API key
export HYPER_LIQUID_KEY="your_private_key_here"

# Train HMM and see regime analysis
python hmm_regime_bot.py --train-only

# Run backtest
python hmm_regime_bot.py --backtest

# Run live
python hmm_regime_bot.py
```

## How It Works

### 1. HMM Regime Detector (The Brain)
- Trains on 5000 hourly BTC candles from Hyperliquid
- 7 hidden states (Jim Simons sweet spot)
- Features: **volume_change** (94% importance), BB_width, volatility
- Retrains every 24 hours
- Labels states automatically: bullish, bearish, sideways, high_vol, capitulation, recovery

### 2. Strategy Layer (Regime-Filtered Trading)

| Regime | Action | Strategy |
|--------|--------|----------|
| **Bullish** | LONG | BB Squeeze breakout above upper band |
| **Bearish** | SHORT | BB Squeeze breakdown below lower band |
| **Recovery** | LONG | BB Squeeze breakout (cautious) |
| **Capitulation** | LONG | Mean reversion (liquidation hunting) |
| **Sideways** | SKIP | Capital preservation 🛡️ |
| **High Vol** | SKIP | Too dangerous |

### 3. BB Squeeze Signal
1. Bollinger Bands contract inside Keltner Channels (squeeze)
2. Squeeze releases (BB expands outside KC)
3. ADX > 25 confirms trend strength
4. Price breaks above upper BB → LONG / below lower BB → SHORT

### 4. Capitulation Signal (Liquidation Hunting)
1. Volume spike > 3x average
2. Price at or below lower BB
3. RSI < 35 (oversold)
→ Mean reversion LONG entry

## Risk Management

| Parameter | Value |
|-----------|-------|
| Take Profit | 5% |
| Stop Loss | 3% |
| Max Leverage | 5x (hard cap) |
| Position Size | $10 USD |
| Max Hold Time | 24 hours |
| Order Type | LIMIT only (3x less fees) |
| Max Positions | 1 at a time |

## Modes

```bash
# Live trading (default)
python hmm_regime_bot.py

# Backtest on historical data (70/30 train/test split)
python hmm_regime_bot.py --backtest

# Train HMM model only, show regime analysis
python hmm_regime_bot.py --train-only

# Custom parameters
python hmm_regime_bot.py --symbol ETH --size 20 --leverage 3
```

## Files Created

| File | Purpose |
|------|---------|
| `hmm_model.pkl` | Saved HMM model (auto-retrains every 24h) |
| `hmm_scaler.pkl` | Feature scaler |
| `hmm_bot_state.json` | Current position state |
| `hmm_trade_log.json` | All trade entries/exits with PnL |
| `hmm_regime_log.json` | Regime predictions over time |
| `hmm_backtest_results.html` | Backtest chart (from --backtest) |

## Configuration

Edit the constants at the top of `hmm_regime_bot.py`:

```python
SYMBOL = "BTC"
LEVERAGE = 5
POSITION_SIZE_USD = 10
TAKE_PROFIT_PCT = 5.0
STOP_LOSS_PCT = 3.0
MAX_HOLD_HOURS = 24
HMM_N_STATES = 7
HMM_RETRAIN_HOURS = 24
```

API key is read from (in order):
1. `HYPER_LIQUID_KEY` environment variable
2. `trading_config.json` in workspace
3. `.env` file in workspace

## Architecture

```
┌─────────────────────────────────────┐
│  Hyperliquid API (5000 1h candles)  │
└──────────────┬──────────────────────┘
               │
       ┌───────▼───────┐
       │  Indicators    │  BB, Keltner, ADX, RSI, ATR
       └───────┬───────┘
               │
    ┌──────────▼──────────┐
    │  HMM Regime Detect  │  7 states → regime label
    │  (retrain/24h)      │  volume_change = king feature
    └──────────┬──────────┘
               │
     ┌─────────▼─────────┐
     │  Strategy Filter   │  regime → allowed direction
     └─────────┬─────────┘
               │
      ┌────────▼────────┐
      │  Signal Check    │  BB Squeeze or Capitulation
      └────────┬────────┘
               │
       ┌───────▼───────┐
       │  Risk Mgmt     │  5% TP, 3% SL, 24h max hold
       └───────┬───────┘
               │
        ┌──────▼──────┐
        │ LIMIT ORDER  │  Entry at bid/ask (not market!)
        └─────────────┘
```

## Key Insights (from MoonDev)

- **Volume change dominates** (94% feature importance) — it captures something fundamental about BTC
- **HMM is a filter, not a strategy** — layer strategies on top of regime detection
- **7 states optimal** for practical trading (84% accuracy, stable transitions)
- **11% exposure time** on BTC = capital free 89% of the time
- **Limit orders save 3x** on fees vs market orders
- **Never predict price** — predict regimes instead (Jim Simons' approach)

## Disclaimer

This is not financial advice. Past backtest performance does not guarantee future results. Start with small sizes ($10) and validate before scaling. The bot trades real money in live mode.
