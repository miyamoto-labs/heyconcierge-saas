# Polymarket Autonomous Trading Bot - Setup Guide

**🚀 FULLY AUTOMATED - SET AND FORGET**

Erik's bot that monitors Polymarket 24/7, detects opportunities, and executes trades automatically. No manual intervention needed!

---

## 🎯 WHAT THIS BOT DOES

**Automatic Operation:**
1. ✅ Monitors Binance BTC/ETH prices continuously
2. ✅ Detects when Binance moves but Chainlink hasn't updated
3. ✅ **AUTOMATICALLY EXECUTES** trades on Polymarket
4. ✅ Sends Telegram alerts (after trade, for transparency)
5. ✅ Tracks P&L and pauses if safety limits hit

**Erik Does:** Fund wallet once  
**Bot Does:** Everything else (24/7)

---

## 🚀 QUICK START

### 1. Start the Bot (Paper Mode First)

```bash
cd /Users/erik/.openclaw/workspace
./start_bot.sh
```

**What happens:**
- Bot starts in background
- Connects to Binance WebSocket
- Monitors for opportunities
- Executes trades automatically (paper mode = safe)
- Logs everything to `bot_output.log`

### 2. Monitor Status

```bash
./bot_status.sh
```

**Shows:**
- Running status
- Today's trades
- Win rate
- P&L
- Recent activity

### 3. Watch Live

```bash
tail -f bot_output.log
```

**Or check Telegram** - you'll get alerts for every trade!

### 4. Stop the Bot

```bash
./stop_bot.sh
```

---

## ⚙️ CONFIGURATION

### Edit Settings

Open `polymarket_autonomous_trader.py` and adjust:

```python
# MODE
PAPER_TRADING = True   # Set False when wallet funded
AUTO_EXECUTE = True    # Keep True for autonomy

# MONEY MANAGEMENT
POSITION_SIZE = 15.0          # $15 per trade
MAX_DAILY_LOSS = 100.0        # Pause if lose $100/day
MAX_CONSECUTIVE_LOSSES = 3    # Pause after 3 losses

# SIGNAL SENSITIVITY
MIN_PRICE_MOVE = 0.003   # 0.3% trigger
MAX_TRADE_WINDOW = 300   # First 5 minutes only
MIN_CONFIDENCE = 0.60    # 60% min confidence

# RATE LIMITS
MAX_TRADES_PER_HOUR = 20
MAX_TRADES_PER_DAY = 100
```

**For Erik (Recommended Defaults):**
- Keep `POSITION_SIZE = 15.0`
- Keep `MAX_DAILY_LOSS = 100.0`
- Keep `MAX_CONSECUTIVE_LOSSES = 3`
- Start with `PAPER_TRADING = True`

---

## 🛡️ SAFETY CONTROLS

Bot **automatically pauses** if:

1. **Daily loss exceeds $100**
   - Prevents catastrophic losses
   - Resumes next day
   - Sends urgent Telegram alert

2. **3 consecutive losses**
   - Strategy may be broken
   - Pauses for 1 hour
   - Requires manual review if persistent

3. **Rate limits hit**
   - 20 trades/hour max
   - 100 trades/day max
   - Prevents runaway behavior

**Erik's controls:**
- Can stop anytime: `./stop_bot.sh`
- Gets alerts for every trade
- Can review logs: `tail -f bot_output.log`

---

## 📱 TELEGRAM ALERTS

### You'll receive alerts for:

**1. Bot Started/Stopped**
```
🚀 BOT STARTED - AUTONOMOUS MODE
Mode: 📝 Paper Trading
Position Size: $15.00
Auto-Execute: ✅ ENABLED
```

**2. Every Trade Executed**
```
⚡ TRADE AUTO-EXECUTED

📝 PAPER MODE

📈 Asset: BTC
🎯 Direction: UP
💰 Position: $15.00
📊 Confidence: 78.5%

📉 Price Move: +0.42%
⏱️ Window: 125s / 300s
🔗 TX: PAPER_170332...

Stats Today:
- Trades: 8
- Win Rate: 5/8 (62%)
- P&L: $12.50
```

**3. Safety Pauses**
```
🛑 BOT PAUSED

Reason: Daily loss limit hit: $100.00

Today's Stats:
- Trades: 24
- Win Rate: 11/24
- P&L: $-102.34

Action: Bot will resume tomorrow
```

---

## 💰 GOING LIVE (When Ready)

### Step 1: Validate Paper Trading

Run bot in paper mode for **1-2 hours**:

```bash
./start_bot.sh
# Wait 1-2 hours
./bot_status.sh
```

**Check:**
- Win rate >55% ✅
- No crashes ✅
- Confidence scores look good ✅

### Step 2: Fund Wallet

```bash
# Erik adds money to wallet
# Amount: $500-1000 recommended for $15 positions
# Address: 0xD8CA1953F4A4A2dA9EDD28fD40E778C2F706757F
```

### Step 3: Switch to Live Mode

Edit `polymarket_autonomous_trader.py`:

```python
PAPER_TRADING = False  # ⚠️ LIVE MODE
```

### Step 4: Restart Bot

```bash
./stop_bot.sh
./start_bot.sh
```

**Bot is now trading real money!** 💸

---

## 📊 MONITORING & MAINTENANCE

### Daily Check

```bash
./bot_status.sh
```

**Look for:**
- Win rate staying above 55%
- P&L trending positive
- No unusual pauses

### Weekly Review

1. Check total P&L
2. Review trade history
3. Adjust thresholds if needed

### Monthly Optimization

1. Analyze best-performing conditions
2. Adjust `MIN_PRICE_MOVE` or `MIN_CONFIDENCE`
3. Consider scaling position size

---

## 🔧 ADVANCED OPERATIONS

### Run Bot on System Startup (macOS)

Create LaunchAgent to start bot automatically:

```bash
# Edit the plist file
nano ~/Library/LaunchAgents/com.erik.polymarket.bot.plist
```

Paste:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.erik.polymarket.bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/erik/.openclaw/workspace/start_bot.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/erik/.openclaw/workspace/bot_output.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/erik/.openclaw/workspace/bot_error.log</string>
</dict>
</plist>
```

Load:

```bash
launchctl load ~/Library/LaunchAgents/com.erik.polymarket.bot.plist
```

**Bot now starts automatically** when Mac boots!

---

## 🐛 TROUBLESHOOTING

### Bot Won't Start

```bash
# Check Python dependencies
pip3 install websockets requests web3 eth-account

# Check for errors
cat bot_output.log
```

### Bot Keeps Pausing

**Check:**
- Win rate < 50%? → Strategy needs tuning
- Daily loss limit hit? → Normal, wait for tomorrow
- Consecutive losses? → Market conditions may be bad

**Fix:**
- Increase `MIN_CONFIDENCE` to 0.70 (more selective)
- Increase `MIN_PRICE_MOVE` to 0.004 (only bigger moves)

### No Trades Being Executed

**Possible reasons:**
1. Market not volatile enough (normal)
2. Paused due to safety limits (check status)
3. Window timing (only trades first 5 min)

**Verify:**
```bash
./bot_status.sh
tail -f bot_output.log
```

### Bot Crashed

```bash
# Check error log
tail -50 bot_output.log

# Restart
./stop_bot.sh
./start_bot.sh
```

---

## 📈 PERFORMANCE EXPECTATIONS

### Realistic Targets

**Daily:**
- Trades: 10-20
- Win rate: 55-65%
- P&L: $15-40

**Weekly:**
- Trades: 70-140
- Cumulative P&L: $100-280

**Monthly:**
- Trades: 300-600
- Cumulative P&L: $400-1,200

**These are ESTIMATES** - actual results depend on market volatility and bot configuration.

### Warning Signs

**Stop the bot if:**
- Win rate drops below 45% for 2+ days
- Consistent daily losses (>$50/day)
- Unusual behavior (too many trades, weird patterns)

---

## 🎯 OPTIMIZATION TIPS

### If Win Rate Too Low (<50%)

Increase selectivity:
```python
MIN_CONFIDENCE = 0.70    # Was 0.60
MIN_PRICE_MOVE = 0.004   # Was 0.003
```

### If Too Few Trades (<5/day)

Decrease selectivity:
```python
MIN_CONFIDENCE = 0.55    # Was 0.60
MIN_PRICE_MOVE = 0.0025  # Was 0.003
MAX_TRADE_WINDOW = 420   # Was 300 (7 minutes)
```

### If Profitable, Scale Up

```python
POSITION_SIZE = 25.0        # Was 15.0
MAX_DAILY_LOSS = 150.0      # Was 100.0
```

**Only scale after 100+ trades with >58% win rate!**

---

## ✅ SUCCESS CHECKLIST

**Before Going Live:**

- [ ] Paper trading win rate >55% (50+ trades)
- [ ] No crashes in 24h operation
- [ ] Telegram alerts working
- [ ] Wallet funded ($500+ recommended)
- [ ] `PAPER_TRADING = False` in config
- [ ] Daily monitoring plan in place

**After Going Live:**

- [ ] Check status daily (`./bot_status.sh`)
- [ ] Review P&L weekly
- [ ] Withdraw profits monthly
- [ ] Optimize thresholds based on results

---

## 📞 SUPPORT

**Files to check:**
- `bot_output.log` - All activity
- `.bot_stats_YYYY-MM-DD.json` - Daily stats
- `bot_activity.log` - Persistent log

**Commands:**
- `./start_bot.sh` - Start bot
- `./stop_bot.sh` - Stop bot
- `./bot_status.sh` - Check status
- `tail -f bot_output.log` - Watch live

---

## 🚀 READY TO GO!

**Paper Trading (Safe):**
```bash
# Bot config has PAPER_TRADING = True
./start_bot.sh
```

**Live Trading (When validated):**
```bash
# 1. Edit bot: PAPER_TRADING = False
# 2. Fund wallet
# 3. Start:
./start_bot.sh
```

**Monitor:**
```bash
./bot_status.sh
# Or check Telegram alerts!
```

---

**Erik's Next Steps:**

1. **Tonight:** Start bot in paper mode (`./start_bot.sh`)
2. **Tomorrow:** Check results (`./bot_status.sh`)
3. **This Week:** If win rate >55%, fund wallet and go live
4. **Ongoing:** Check Telegram alerts, withdraw profits weekly

**Set it and forget it!** 🚀💰

---

**Created:** Feb 5, 2026, 21:45 GMT+1  
**Status:** ✅ FULLY AUTONOMOUS - READY TO RUN
