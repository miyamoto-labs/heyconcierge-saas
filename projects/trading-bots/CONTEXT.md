# Trading Bots - Project Context

## What
Automated crypto trading across Hyperliquid and Polymarket.

## Active Bots

### Hyperliquid V2.1 MTF
- **Strategy:** Multi-timeframe trend following
- **Capital:** ~$585
- **Key:** Hard blocks on counter-trend trades, trailing stops, 4 timeframes
- **File:** `hyperliquid_bot_v2_optimized.py`

### Polymarket Chainlink Lag
- **Strategy:** Exploits Chainlink oracle lag vs Binance price
- **Capital:** ~$102.66 USDC.e
- **Status:** LIVE since 2026-02-08 00:43
- **File:** In polymarket directory

### Polymarket Superbot
- **Strategy:** Multi-strategy (LLM 40%, Whale Copy 30%, Bonds 20%, News 10%)
- **Status:** Paper trading only
- **File:** `polymarket_superbot/superbot.py`

## Dashboard
- `hyperliquid-dashboard/index.html` — TradingView, P&L, Quick Trade

## Key Learning
- True arbitrage (YES+NO < $1) doesn't exist on Polymarket — markets are efficient
- Real edge: oracle lag exploitation
- Static rules lose; adaptive systems win

## Pending Requests
*None*
