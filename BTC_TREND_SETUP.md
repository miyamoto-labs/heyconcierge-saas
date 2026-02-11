# BTC Trend-Following Bot Setup

## Overview

Automated trend-following bot for BTC perpetuals on Hyperliquid using technical analysis.

**Status:** ✅ OPERATIONAL (Paper Mode)

## Strategy

**Indicators Used:**
- RSI (14 period) - Oversold/Overbought detection
- MACD (12/26/9) - Trend momentum
- Moving Averages (20/50) - Trend direction

**Signal Generation (need 2/3):**

**LONG Signals:**
- RSI < 40 (oversold)
- MACD bullish crossover
- Price > MA20 AND MA20 > MA50 (uptrend)

**SHORT Signals:**
- RSI > 60 (overbought)
- MACD bearish crossover
- Price < MA20 AND MA20 < MA50 (downtrend)

**Risk Management:**
- Stop Loss: 3% from entry
- Take Profit: 6% from entry
- Max 1 position at a time

## Configuration

**Position Sizing:**
- $15 per trade
- 10x leverage = $150 BTC exposure

**Scan Frequency:**
- Every 15 minutes (cron job)

**Current Mode:**
- 📝 PAPER MODE (signals only, no execution)
- Change to live: Edit `btc_trend_cron.py`, set `paper_mode=False`

## Files

- `/Users/erik/.openclaw/workspace/btc_trend_bot.py` - Main bot logic
- `/Users/erik/.openclaw/workspace/btc_trend_cron.py` - Cron scanner
- `/Users/erik/.openclaw/workspace/.hyperliquid_config.json` - API credentials

## Hyperliquid Account

**Wallet:** `0xF1CcD889c2b340636A567DfF3f1d157f7FFD00dB`
**API Wallet:** `0x20b361f7df0633fba47bd757dfac4a81072b1ece`
**Leverage:** 10x (cross margin)
**Valid Until:** May 6, 2026

## Usage

### Manual Test
```bash
cd /Users/erik/.openclaw/workspace
python3 btc_trend_bot.py
```

### Deploy Cron Job (15 min intervals)
Ask Miyamoto to deploy with:
```
"Deploy BTC trend bot cron job - every 15 minutes"
```

## Workflow

1. **Bot scans** every 15 minutes
2. **Checks for existing position** - skips if already in trade
3. **Analyzes** 72 hours of BTC price data
4. **Generates signal** if 2/3 indicators align
5. **Sends Telegram alert** with:
   - Entry price
   - Technical indicators
   - Stop loss / Take profit levels
   - Reasoning

6. **Manual approval required** - no auto-execute

## Telegram Alerts

Alerts sent via OpenClaw include:
- 📝 Mode (Paper/Live)
- 🚨 Signal direction (LONG/SHORT)
- 💰 Entry price & position size
- 📈 Technical indicators
- 🎯 Stop loss & take profit
- 💡 Reasoning

## Safety

✅ Paper mode by default
✅ Manual approval required
✅ Max 1 position at a time
✅ Position check before new signals
✅ Stop loss / take profit defined

## Next Steps

1. ✅ Bot built and tested
2. ⏳ Deploy cron job
3. ⏳ Monitor signals for 24-48h
4. ⏳ Review performance
5. ⏳ Switch to live trading if profitable

## Performance Tracking

Track in `/Users/erik/.openclaw/workspace/memory/YYYY-MM-DD.md`:
- Signals generated
- Win rate
- P&L (paper or live)
- Strategy adjustments

---

**Created:** 2026-02-05  
**Last Updated:** 2026-02-05
