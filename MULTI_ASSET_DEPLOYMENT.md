# MULTI-ASSET SCALPING BOT - Deployment Guide

**Hyperliquid Multi-Asset Scalper v2.0**  
**Assets**: BTC, HYPE, FARTCOIN  
**Target**: 15-30 trades/day, 12-22% daily return on $100

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites Check
```bash
# Check Python version (need 3.10+)
python3 --version

# Check if hyperliquid-python-sdk installed
python3 -c "import hyperliquid; print('SDK installed')"

# Check if config exists
ls ~/.openclaw/workspace/.hyperliquid_config.json
```

**If anything missing**:
```bash
# Install SDK
pip3 install hyperliquid-python-sdk

# Config file should already exist from previous bot
# If not, create it with your Hyperliquid credentials
```

---

### 2. Test Run (Dry Run First)

**BEFORE going live**, do a quick test:

```bash
cd ~/.openclaw/workspace
python3 hyperliquid_multi_asset_scalper.py
```

**What to watch for**:
- ✅ Connects to Hyperliquid (no errors)
- ✅ Shows your balance
- ✅ Starts checking assets (BTC, HYPE, FARTCOIN)
- ✅ Generates signals (may take 30-45s)

**Stop it after 2-3 minutes** (`Ctrl+C`) if you just want to test.

---

### 3. Go Live

**When ready**:
```bash
# Start bot in background (keeps running after you close terminal)
nohup python3 hyperliquid_multi_asset_scalper.py > scalper.log 2>&1 &

# Get process ID
echo $! > scalper.pid
```

**Monitor live output**:
```bash
tail -f scalper.log
```

**Stop bot**:
```bash
kill $(cat scalper.pid)
```

---

## 📊 Monitoring

### 1. Real-Time Output
The bot prints:
- 🎯 Signals generated (asset, strategy, confidence)
- ✅ Trades executed (entry, stop, target)
- 🔔 Positions closed (reason, P&L %)
- 📊 Stats (open positions, daily P&L, win rate)

**Example output**:
```
🎯 FARTCOIN signal: VOLUME_SPIKE LONG (62%)
================================================================================
🎯 EXECUTING LONG FARTCOIN
================================================================================
📈 Strategy: VOLUME_SPIKE
💰 Price: $0.002450
📊 Size: $12.00 (4897.96 FARTCOIN)
⚡ Leverage: 15x
🎯 Confidence: 62%
🛑 Stop: $0.002438
✅ Target: $0.002472
📝 Reasons: Volume spike (2.3x), Bullish candle + volume, Strong body (72%)

✅ ORDER EXECUTED!
```

---

### 2. State File (`multi_asset_scalping_state.json`)

Contains:
```json
{
  "daily_pnl": 8.45,
  "daily_trades": 12,
  "consecutive_losses": 0,
  "total_trades": 24,
  "winning_trades": 15,
  "losing_trades": 9,
  "open_positions": {
    "FARTCOIN": {...}
  },
  "asset_trades_today": {
    "BTC": 4,
    "HYPE": 3,
    "FARTCOIN": 5
  },
  "asset_pnl_today": {
    "BTC": 2.30,
    "HYPE": 1.80,
    "FARTCOIN": 4.35
  }
}
```

**Check it anytime**:
```bash
cat multi_asset_scalping_state.json | python3 -m json.tool
```

---

### 3. Trade History (`multi_asset_scalping_history.json`)

Full record of every trade:
```json
[
  {
    "timestamp": "2026-02-06T10:15:23",
    "asset": "FARTCOIN",
    "side": "LONG",
    "strategy": "VOLUME_SPIKE",
    "entry_price": 0.00245,
    "stop_loss": 0.002438,
    "take_profit": 0.002472,
    "size_usd": 12.0,
    "confidence": 62,
    "leverage": 15,
    "reasons": ["Volume spike (2.3x)", "Bullish candle + volume", "Strong body (72%)"]
  }
]
```

---

## ⚙️ Configuration

### Asset Configs (in code)

**BTC** (Moderate):
- Position: 8% ($8 on $100)
- Leverage: 10x
- Check: Every 45s
- Max trades/day: 10

**HYPE** (Balanced):
- Position: 10% ($10 on $100)
- Leverage: 12x
- Check: Every 40s
- Max trades/day: 12

**FARTCOIN** (ULTRA AGGRESSIVE):
- Position: 12% ($12 on $100)
- Leverage: 15x
- Check: Every 30s
- Max trades/day: 20

**To adjust**, edit these values in `hyperliquid_multi_asset_scalper.py` (search for `ASSET_CONFIGS`).

---

### Global Risk Limits

```python
class GlobalConfig:
    MAX_CONCURRENT_POSITIONS = 3      # Max 3 positions total
    TOTAL_POSITION_EXPOSURE_PCT = 25.0  # Max 25% total exposure
    DAILY_LOSS_LIMIT = 15.0           # $15 total daily loss
    MAX_CONSECUTIVE_LOSSES = 5        # Pause after 5 losses
    PAUSE_DURATION_MINUTES = 20       # Pause for 20 min
    MAX_DRAWDOWN_PCT = 25.0           # Max 25% drawdown
```

**To adjust**, edit in code (search for `class GlobalConfig`).

---

## 🎯 Expected Behavior

### First Hour
- **Signals**: 2-5 per asset (6-15 total)
- **Trades**: 3-8 executed (depends on confidence)
- **Positions**: 1-3 open at any time
- **P&L**: +$2 to +$8 (if good market conditions)

**If NO signals in first 15 min**: 
- Normal. Bot waits for valid setups.
- FARTCOIN should fire first (lowest thresholds)
- Check terminal for "No signals generated" messages

### First Day (24 hours)
- **Total trades**: 15-30
- **Win rate**: 52-62% (target)
- **P&L**: +$10 to +$25 (good day) or -$10 to -$15 (bad day)
- **Pauses**: 0-2 (if hit consecutive loss limit)

### First Week
- **Total trades**: 100-200
- **Win rate**: Should stabilize around 55-60%
- **P&L**: +$50 to +$150 on $100 capital
- **Learnings**: You'll see which asset/strategy performs best

---

## 🛡️ Safety Mechanisms

### Automatic Stops

1. **Daily loss limit** ($15):
   - Bot stops trading for the day
   - Prevents catastrophic losses
   - Resets at midnight

2. **Consecutive losses** (5):
   - Bot pauses for 20 minutes
   - Prevents tilt-trading
   - Auto-resumes after cooldown

3. **Max drawdown** (25%):
   - Bot stops if balance drops 25% from peak
   - Prevents account blowup
   - Requires manual intervention to resume

4. **Position limits**:
   - Max 3 concurrent (one per asset)
   - Max 25% total exposure
   - Prevents over-leveraging

### Manual Stops

**Emergency kill**:
```bash
# Find process
ps aux | grep hyperliquid_multi_asset_scalper

# Kill it
kill -9 <PID>
```

**Close all positions manually**:
- Log into Hyperliquid web UI
- Click "Close All" in positions tab

---

## 📈 Performance Tracking

### Daily Review
1. Check `multi_asset_scalping_state.json` for P&L
2. Review win rate (target: 55-60%)
3. Check which asset performed best
4. Look for patterns (time of day, strategy type)

### Weekly Review
1. Total P&L vs starting capital
2. Win rate per asset
3. Win rate per strategy
4. Best/worst days (what happened?)
5. Adjust configs if needed

### Monthly Review
1. Overall return %
2. Sharpe ratio (returns vs volatility)
3. Max drawdown experienced
4. Strategy effectiveness ranking
5. Decide: scale up? adjust? pause?

---

## 🔧 Troubleshooting

### Bot crashes on start
**Error**: `ModuleNotFoundError: No module named 'hyperliquid'`  
**Fix**: `pip3 install hyperliquid-python-sdk`

**Error**: `FileNotFoundError: .hyperliquid_config.json`  
**Fix**: Create config file with your Hyperliquid credentials

---

### No signals generated
**Possible causes**:
1. Market is too quiet (low volatility)
2. Confidence thresholds too high
3. No clear setups in current market conditions

**What to check**:
- Are candles being fetched? (Check terminal output)
- Are prices updating? (Should see price checks)
- Try lowering confidence thresholds by 5 points

---

### Too many losses
**If losing >60% of trades**:
1. **Stop the bot immediately**
2. Review last 20 trades in history file
3. Which strategy is failing? Which asset?
4. Possible fixes:
   - Tighten stops (less loss per trade)
   - Increase confidence thresholds (fewer but better trades)
   - Disable worst-performing asset
   - Reduce leverage

**Market conditions changed**: Strategies decay. What worked last week may not work this week.

---

### Bot is too slow
**If trades are missed**:
1. Check internet connection (ping hyperliquid.xyz)
2. Reduce check intervals (45s → 30s)
3. Disable one asset to reduce API calls
4. Check for rate limiting errors in log

---

## 🚀 Scaling Strategy

### Phase 1: Validation ($100 → $200)
- **Goal**: Prove profitability
- **Timeline**: 2-4 weeks
- **Target**: 100% return ($100 → $200)
- **Don't**: Withdraw, change strategies mid-test

### Phase 2: Scaling ($200 → $500)
- **Goal**: Increase capital, maintain win rate
- **Timeline**: 2-4 weeks
- **Target**: 150% return
- **Adjust**: Position sizes may need tweaking

### Phase 3: Optimization ($500 → $2,000)
- **Goal**: Add more strategies, refine configs
- **Timeline**: 4-8 weeks
- **Target**: 300% return
- **Watch**: Liquidity limits (FARTCOIN may not support $50 orders)

### Phase 4: Production ($2,000+)
- **Goal**: Consistent returns, risk management
- **Timeline**: Ongoing
- **Target**: 50-100% monthly
- **Note**: At this capital level, consider:
  - Multiple accounts (spread risk)
  - Add more assets (SOL, ETH, etc.)
  - Implement trailing stops fully
  - Build web dashboard

---

## 📝 Daily Checklist

**Morning** (9 AM Oslo):
- [ ] Check bot is still running (`ps aux | grep scalper`)
- [ ] Review overnight P&L (`cat multi_asset_scalping_state.json`)
- [ ] Check Hyperliquid balance (web UI)
- [ ] Scan for any errors in log (`tail -50 scalper.log`)

**Midday** (12 PM Oslo):
- [ ] Check current open positions
- [ ] Review morning trades (history file)
- [ ] Adjust if one asset is dominating (good or bad)

**Evening** (6 PM Oslo):
- [ ] Final P&L check
- [ ] Win rate review
- [ ] Plan adjustments for tomorrow (if needed)
- [ ] Ensure bot will run overnight (if desired)

**Before bed**:
- [ ] Optional: Stop bot overnight (manual control)
- [ ] Or: Let it run 24/7 (set and forget)

---

## 🎓 Learning Resources

**Logs are your teacher**:
- Every signal shows reasons (EMA bullish, RSI momentum, etc.)
- Study which reasons = wins vs losses
- Adjust confidence scoring over time

**Backtesting** (future enhancement):
- Save candle data
- Replay past scenarios
- Test new strategies offline

**Community**:
- Hyperliquid Discord (technical support)
- Crypto Twitter (market insights)
- BuildInPublic (share your journey, learn from others)

---

## ⚠️ Final Warnings

**Don't**:
- Use money you can't afford to lose
- Trade drunk (seriously)
- Change configs mid-day (let day finish)
- Override safety limits (they're there for a reason)
- Expect 100% win rate (50-60% is good)
- Scale up too fast (prove first, then scale)

**Do**:
- Start small ($100-500)
- Monitor closely first week
- Trust the process (variance happens)
- Log everything (review weekly)
- Adjust slowly (one variable at a time)
- Take profits (withdraw 50% monthly)

---

## 🔥 LET'S GO LIVE

**You're ready when**:
- ✅ Bot runs without errors (tested)
- ✅ You understand the strategies (read docs)
- ✅ You can monitor it (have time)
- ✅ You accept the risk (can lose $100)
- ✅ You have a plan (scaling strategy)

**Command to start**:
```bash
cd ~/.openclaw/workspace
nohup python3 hyperliquid_multi_asset_scalper.py > scalper.log 2>&1 &
echo $! > scalper.pid
tail -f scalper.log
```

**Good luck. May the profits be with you.** 🚀💰
