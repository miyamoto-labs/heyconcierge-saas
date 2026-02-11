# Polymarket Chainlink Lag Bot - Deployment Guide

**Created:** February 5, 2026  
**Deadline:** Midnight (00:00 GMT+1)  
**Status:** Paper trading ready, live trading requires Polymarket API completion

---

## 📋 QUICK START

### Prerequisites

```bash
# Python 3.9+
python3 --version

# Install dependencies
pip3 install websockets requests web3 eth-account
```

### Files

- `polymarket_chainlink_lag_bot.py` - Main bot
- `polymarket_api.py` - Polymarket integration (partial)
- `CHAINLINK_LAG_RESEARCH.md` - Strategy research
- `.polymarket_wallet.json` - Wallet credentials

---

## 🚀 RUNNING THE BOT

### Paper Trading Mode (RECOMMENDED FIRST)

```bash
cd /Users/erik/.openclaw/workspace
python3 polymarket_chainlink_lag_bot.py
```

**What it does:**
- Connects to Binance WebSocket for BTC/ETH real-time prices
- Tracks 15-minute market windows
- Generates trading signals when price moves ±0.3%+
- Logs trades (paper mode - no real money)
- Sends Telegram alerts

**Expected output:**
```
🚀 CHAINLINK LAG BOT STARTING
⚙️  Mode: 📝 PAPER TRADING
⚙️  Position size: $15.00
⚙️  Min price move: 0.30%
⚙️  Trade window: First 300s of 15-min markets

✅ Connected to Binance BTC WebSocket
✅ Connected to Binance ETH WebSocket
BTC - New 15-min window started at $65,590.50
ETH - New 15-min window started at $3,245.67
```

### Stop the Bot

Press `Ctrl+C` to stop gracefully. It will print a summary:

```
📊 TRADING SUMMARY
   Total trades: 12
   Winning trades: 8
   Win rate: 66.7%
   Total P&L: $24.50
```

---

## ⚙️ CONFIGURATION

### Edit Bot Parameters

Open `polymarket_chainlink_lag_bot.py` and modify:

```python
# At the top of the file
PAPER_TRADING = True  # Set False for live trading (NOT RECOMMENDED YET)
POSITION_SIZE = 15.0  # Dollar amount per trade
MIN_PRICE_MOVE = 0.003  # 0.3% = triggers at ±0.3% price change
MAX_TRADE_WINDOW = 300  # Only trade in first 5 minutes
MAX_CONSECUTIVE_LOSSES = 3  # Stop after this many losses
TELEGRAM_ALERTS = True  # Send alerts via OpenClaw
```

### Risk Management

**Conservative (default):**
- MIN_PRICE_MOVE = 0.003 (0.3%)
- MAX_TRADE_WINDOW = 300s (5 min)
- POSITION_SIZE = $15

**Aggressive:**
- MIN_PRICE_MOVE = 0.002 (0.2%)
- MAX_TRADE_WINDOW = 420s (7 min)
- POSITION_SIZE = $25

---

## 📊 TESTING PLAN

### 1-Hour Paper Trading Test

**Goal:** Validate strategy before going live

```bash
# Run for 1 hour
python3 polymarket_chainlink_lag_bot.py
```

**Monitor for:**
- Signal frequency (expect 5-15 signals/hour)
- Win rate (target: >55%)
- No crashes or errors

**Log output:**
Trades will be logged to console. Copy to file:

```bash
python3 polymarket_chainlink_lag_bot.py > paper_trading_log.txt
```

### Expected Performance

Based on research:
- **Signals:** 10-20 per day
- **Win rate target:** 60-70%
- **ROI per trade:** 7-17% (at 55-60% WR)
- **Daily P&L (15 trades):** $15-40

---

## 🔴 GOING LIVE (NOT READY YET)

**⚠️  DO NOT SET `PAPER_TRADING = False` YET**

**Why?**
- Polymarket API integration is incomplete
- Need to test actual trade execution
- Need to verify Chainlink lag exists in practice

**Before going live:**

1. **Complete Polymarket API Integration**
   - Implement order signing with private key
   - Test with $5 positions first
   - Verify actual fees match expectations

2. **Test Wallet**
   ```bash
   # Check wallet balance
   python3 polymarket_api.py
   ```

3. **Micro-Position Testing**
   - Set `POSITION_SIZE = 5.0`
   - Execute 10 real trades
   - Validate actual vs paper performance

4. **Gradual Scaling**
   - $5 positions: 20 trades
   - $10 positions: 20 trades
   - $15 positions: Once proven

---

## 📱 TELEGRAM ALERTS

When the bot detects a signal, it prints:

```
===================================================================
TELEGRAM_ALERT
🤖 **CHAINLINK LAG BOT - TRADE EXECUTED**

📈 **Asset:** BTC
🎯 **Direction:** UP
💰 **Position:** $15.00
📊 **Confidence:** 78.5%

📉 **Price Move:** +0.42%
⏱️ **Window Position:** 125s / 300s
💡 **Reason:** Price moved +0.42% in 125s

📝 **MODE:** PAPER TRADING

**Strategy:** Binance moved but Chainlink hasn't settled yet!
===================================================================
```

OpenClaw will automatically send this to Telegram (if configured).

---

## 🐛 TROUBLESHOOTING

### Bot Won't Start

**Error:** `ModuleNotFoundError: No module named 'websockets'`

```bash
pip3 install websockets requests
```

**Error:** `[Errno 61] Connection refused`

- Check internet connection
- Binance may be down (rare)
- Try restarting

### No Signals After 30 Minutes

This is **normal** if:
- BTC/ETH haven't moved much
- Price changes are <0.3%
- Outside of first 5 minutes of window

**Verify it's working:**
- Check log shows "Connected to Binance"
- Check log shows "New 15-min window started"
- Current price updates should appear in status

### Signals But No Trades

Check:
1. Are you in the first 5 minutes of a 15-min window?
2. Is price change > 0.3%?
3. Is confidence score > 0.6?

### Too Many Signals

If getting signals every minute:
- Increase `MIN_PRICE_MOVE` to 0.004 (0.4%)
- Decrease `MAX_TRADE_WINDOW` to 240s (4 min)

---

## 📈 PERFORMANCE MONITORING

### Check Bot Status

While running, the bot prints status every 60 seconds:

```
📊 STATUS UPDATE
   Total trades: 8
   Win rate: 5/8
   P&L: $12.50
   BTC: $65,654.23 (+0.12% | 245s)
   ETH: $3,267.89 (-0.05% | 245s)
```

### Paper Trading Results

After 1 hour, check:
- **Win rate:** Should be >50% (ideally 55-65%)
- **Trade frequency:** 1-3 trades/hour is normal
- **Confidence scores:** Most should be >0.65

**Red flags:**
- Win rate <50% after 20+ trades
- Confidence scores <0.55
- Crashes or errors

---

## 🚨 SAFETY LIMITS

Bot will **automatically stop** if:
- 3 consecutive losses
- WebSocket connection fails repeatedly
- Keyboard interrupt (Ctrl+C)

**Manual kill:**
```bash
# Find process
ps aux | grep polymarket_chainlink

# Kill it
kill <PID>
```

---

## 📝 NEXT STEPS

### Immediate (Before Midnight)

1. ✅ Run 1 hour of paper trading
2. ✅ Monitor Telegram alerts
3. ✅ Check win rate after 10+ trades
4. ⏳ Document results

### Short Term (Next 24h)

1. Complete Polymarket API integration
2. Test with $5 real trades
3. Measure actual Chainlink lag
4. Optimize signal thresholds

### Long Term

1. Add order book analysis
2. Implement early exit strategy
3. Add SOL/XRP markets
4. Multi-timeframe analysis (5-min, 15-min, 1-hour)

---

## 📞 SUPPORT

**Issues?**
- Check `CHAINLINK_LAG_RESEARCH.md` for strategy details
- Review bot code: `polymarket_chainlink_lag_bot.py`
- Test API: `python3 polymarket_api.py`

**Emergency Stop:**
```bash
pkill -f polymarket_chainlink
```

---

## ✅ PRE-FLIGHT CHECKLIST

Before running:

- [ ] Python 3.9+ installed
- [ ] Dependencies installed (`websockets`, `requests`)
- [ ] `PAPER_TRADING = True` in config
- [ ] Internet connection stable
- [ ] OpenClaw Telegram configured (for alerts)
- [ ] Read `CHAINLINK_LAG_RESEARCH.md`

**Ready to test:** `python3 polymarket_chainlink_lag_bot.py`

---

**Last Updated:** 2026-02-05 21:30 GMT+1  
**Status:** Paper trading ready ✅ | Live trading: needs API completion ⏳
