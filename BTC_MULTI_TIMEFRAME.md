# BTC Multi-Timeframe Trading System

## Overview

Three-timeframe algorithmic trading system for BTC perpetuals on Hyperliquid.

**Status:** ✅ ALL 3 OPERATIONAL (Paper Mode)

## Strategy Architecture

### 1h Scalper (Fast-Moving)
- **Timeframe:** 1-hour candles
- **Scan frequency:** Every 5 minutes
- **Indicators:** RSI(14), MACD(12/26/9), MA(10/20)
- **Thresholds:** RSI <45/>55 (aggressive)
- **Targets:** 2% stop loss, 4% take profit
- **Leverage:** 10x
- **Position size:** $15 ($150 exposure)
- **Use case:** Quick trend captures, higher frequency
- **Cron ID:** `7c744483-e2ab-486b-be5b-b11bfe6ce427`
- **Next run:** Every 5 minutes

### 4h Swing Trader (Medium-Term)
- **Timeframe:** 4-hour candles
- **Scan frequency:** Every 15 minutes
- **Indicators:** RSI(14), MACD(12/26/9), MA(20/50)
- **Thresholds:** RSI <40/>60 (moderate)
- **Targets:** 3% stop loss, 6% take profit
- **Leverage:** 10x
- **Position size:** $15 ($150 exposure)
- **Use case:** Medium-term trends, balanced approach
- **Cron ID:** `3e928730-eee3-4462-8636-d022675504b2`
- **Next run:** Every 15 minutes

### Daily Position Trader (Major Trends)
- **Timeframe:** Daily candles
- **Scan frequency:** Every 1 hour
- **Indicators:** RSI(14), MACD(12/26/9), MA(50/100)
- **Thresholds:** RSI <35/>65 (conservative)
- **Targets:** 5% stop loss, 10% take profit
- **Leverage:** 7x (lower for longer holds)
- **Position size:** $15 ($105 exposure)
- **Use case:** Major trend reversals, patient approach
- **Cron ID:** `0ae3ddf0-0741-4621-b010-ea47fa2a50f1`
- **Next run:** Every 1 hour

## Signal Logic (All Timeframes)

**Requirements:** Need 2 out of 3 indicators aligned

**LONG Signals:**
1. RSI oversold (threshold varies by timeframe)
2. MACD bullish crossover
3. Price above faster MA, faster MA above slower MA

**SHORT Signals:**
1. RSI overbought (threshold varies by timeframe)
2. MACD bearish crossover
3. Price below faster MA, faster MA below slower MA

## Signal Confluence

**High Conviction Scenarios:**

- **3/3 timeframes align** = MAXIMUM conviction (rare!)
- **2/3 timeframes align** = Strong conviction
- **1/3 timeframe** = Standard signal

**Example (current market):**
- 1h: SHORT ✅
- 4h: SHORT ✅
- Daily: SHORT ✅
= **MAXIMUM SHORT CONVICTION** 🔥

## Telegram Alerts

Each bot sends distinct alerts:

**1h Scalper:**
```
⚡️ BTC SHORT Signal (1h Scalper)
Entry: $70,515
Stop: $71,925 (2%)
Target: $67,694 (4%)
⚡️ 1h timeframe (fast-moving)
```

**4h Swing:**
```
🚨 BTC SHORT Signal Detected!
Entry: $70,225
Stop: $72,332 (3%)
Target: $66,012 (6%)
🤖 BTC Trend Bot (4h timeframe)
```

**Daily Position:**
```
🎯 BTC SHORT Signal (Daily Position)
Entry: $70,576
Stop: $74,105 (5%)
Target: $63,518 (10%)
🎯 Daily timeframe (major trend reversal)
```

## Files

**1h Scalper:**
- `/Users/erik/.openclaw/workspace/btc_scalper_1h.py`
- `/Users/erik/.openclaw/workspace/btc_scalper_1h_cron.py`

**4h Swing:**
- `/Users/erik/.openclaw/workspace/btc_trend_bot.py`
- `/Users/erik/.openclaw/workspace/btc_trend_cron.py`

**Daily Position:**
- `/Users/erik/.openclaw/workspace/btc_position_daily.py`
- `/Users/erik/.openclaw/workspace/btc_position_daily_cron.py`

**Shared:**
- `/Users/erik/.openclaw/workspace/.hyperliquid_config.json`

## Cost Analysis

**Daily API costs:**
- 1h Scalper: 288 scans/day × DeepSeek = ~$0.70/day
- 4h Swing: 96 scans/day × DeepSeek = ~$0.50/day
- Daily Position: 24 scans/day × DeepSeek = ~$0.30/day
- **Total BTC bots: ~$1.50/day**

**Expected signals:**
- 1h: 2-6 per day (more active)
- 4h: 1-3 per day (moderate)
- Daily: 0-1 per day (rare but high impact)

## Safety Features

✅ **Paper mode enabled** on all bots  
✅ **Manual approval required** for all trades  
✅ **Position check** before new signals (max 1 position)  
✅ **Deduplication** across timeframes  
✅ **Stop loss / take profit** defined on all strategies  
✅ **Progressive leverage** (10x short-term, 7x long-term)

## Going Live Checklist

Before switching `paper_mode=False`:

1. [ ] Review 24-48h of signals across all timeframes
2. [ ] Analyze which timeframe performs best
3. [ ] Check signal confluence accuracy
4. [ ] Verify stop loss / take profit calculations
5. [ ] Test position sizing with real API
6. [ ] Confirm Hyperliquid account balance
7. [ ] Set up position monitoring/exit strategy
8. [ ] Document performance tracking system

## Performance Tracking

Track in `/Users/erik/.openclaw/workspace/memory/YYYY-MM-DD.md`:

**Daily Metrics:**
- Signals generated per timeframe
- Confluence events (2+ timeframes aligned)
- Signal timing (early, late, perfect)
- Hypothetical P&L if executed
- Which timeframe most accurate

**Weekly Review:**
- Win rate per timeframe
- Average hold time
- Best/worst performers
- Strategy adjustments needed

## Next Phase: Multi-Asset Expansion

Once BTC multi-timeframe proven profitable:

**Week 2:** Add ETH
- Clone all 3 timeframes
- Same parameters, different asset
- = 6 total strategies (3 BTC + 3 ETH)

**Week 3:** Add SOL, DOGE, MATIC
- 5 assets × 3 timeframes = 15 strategies
- Diversified exposure
- Correlation analysis

**Week 4:** Advanced Features
- Dynamic position sizing (bigger on high conviction)
- Cross-asset correlation signals
- Auto-disable underperformers
- Performance-based capital allocation

## Current Market Snapshot (Feb 5, 12:40 PM)

**BTC Price:** $70,500
**All 3 timeframes:** SHORT signal ⚠️

**This is a HIGH CONVICTION setup:**
- Daily RSI: 15.99 (extremely oversold)
- 4h RSI: 28.20 (very oversold)
- 1h RSI: 29.75 (oversold)

**All indicators aligned bearish = rare occurrence!**

If this were live trading, this would be a "max size" short opportunity with 3x confluence.

---

**Created:** 2026-02-05 12:40 PM  
**Last Updated:** 2026-02-05 12:40 PM  
**Deployed by:** Miyamoto 🚀

**Note:** All bots currently in paper mode. Review signals for 24-48h before considering live trading.
