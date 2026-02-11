# 🚀 HYPERLIQUID SCALPING STRATEGY DOCUMENTATION

## Overview

**Bot:** `hyperliquid_scalping_bot.py`  
**Target:** 5-15 trades per day on BTC perpetuals  
**Capital:** $100  
**Goal:** $3-10 profit per day (3-10% daily return)

## Why This Bot is DIFFERENT

The old bot (`hyperliquid_autonomous_trader.py`) was **too conservative**:
- Used 1h/4h/1d timeframes (way too slow)
- Required 70%+ confidence (missed opportunities)
- Checked every 5 minutes (too slow)
- Cross-timeframe confirmation (delayed entries)

**This bot is AGGRESSIVE:**
- Uses 1m/5m timeframes (fast)
- 50-60% confidence threshold (more trades)
- Checks every 45 seconds
- Multiple independent strategies (more signals)

---

## 📊 STRATEGIES

### 1. MOMENTUM SCALPING
**Goal:** Ride short-term trends

**Signals:**
- Fast EMA (5) vs Slow EMA (13) crossover
- Price position relative to EMAs
- RSI momentum (not overbought/oversold)
- 3 consecutive bullish/bearish candles

**Parameters:**
- Stop Loss: 0.8%
- Take Profit: 1.0%
- Risk:Reward = 1:1.25
- Min Confidence: 55%

**When it triggers:**
- EMA bullish + RSI 50-70 + price above EMAs = LONG
- EMA bearish + RSI 30-50 + price below EMAs = SHORT

---

### 2. RANGE TRADING
**Goal:** Buy support, sell resistance

**Signals:**
- Bollinger Bands position (lower 15% = buy, upper 85% = sell)
- RSI confirmation
- Bounce/rejection candle patterns

**Parameters:**
- Stop Loss: 0.5% (very tight)
- Take Profit: Middle of Bollinger Band
- Risk:Reward = 1:1.6
- Min Confidence: 55%

**When it triggers:**
- Price at lower Bollinger + RSI < 40 + bounce forming = LONG
- Price at upper Bollinger + RSI > 60 + rejection forming = SHORT

---

### 3. BREAKOUT TRADING
**Goal:** Catch volatility spikes

**Signals:**
- Price breaks 20-bar high/low
- Strength of breakout (>0.3%)
- Volume spike confirmation

**Parameters:**
- Stop Loss: 1.0%
- Take Profit: 1.5%
- Risk:Reward = 1:1.5
- Min Confidence: 60%

**When it triggers:**
- Price breaks above 20-bar high + volume spike = LONG
- Price breaks below 20-bar low + volume spike = SHORT

---

### 4. ORDERBOOK IMBALANCE
**Goal:** Trade with the flow

**Signals:**
- Bid/Ask depth ratio (top 10 levels)
- >60% imbalance = signal
- >70% imbalance = strong signal

**Parameters:**
- Stop Loss: 0.5% (very tight)
- Take Profit: 0.6%
- Risk:Reward = 1:1.2
- Min Confidence: 50%

**When it triggers:**
- Bid depth >60% of total = LONG
- Ask depth >60% of total = SHORT

---

### 5. VOLUME SPIKE
**Goal:** Trade high-activity moments

**Signals:**
- Volume > 1.5x 20-period average
- Candle direction (bullish/bearish)
- Body ratio (strong candles)

**Parameters:**
- Stop Loss: 0.7%
- Take Profit: 1.2%
- Risk:Reward = 1:1.7
- Min Confidence: 55%

**When it triggers:**
- Volume spike + bullish candle + strong body = LONG
- Volume spike + bearish candle + strong body = SHORT

---

## ⚠️ RISK MANAGEMENT

### Position Sizing
- **Max per trade:** 2% of capital ($2 on $100)
- **Max concurrent positions:** 3
- **Max leverage:** 5x (conservative for scalping)

### Loss Limits
- **Per trade stop:** 0.5-1.0% (depending on strategy)
- **Daily loss limit:** $20 (stops trading if hit)
- **Max consecutive losses:** 5 (30-min pause)
- **Max drawdown:** 30% from peak (emergency stop)

### Protection Mechanisms
1. ✅ Position size limits (2% max)
2. ✅ Tight stop losses (0.5-1.0%)
3. ✅ Daily loss limit ($20)
4. ✅ Consecutive loss pause (5 losses = 30 min break)
5. ✅ Max positions (3 concurrent)
6. ✅ Max drawdown protection (30%)
7. ✅ State persistence (survives restarts)

---

## 📈 EXPECTED PERFORMANCE

### Conservative Estimate
- **Trades/day:** 5-10
- **Win rate:** 55%
- **Avg winner:** +0.8%
- **Avg loser:** -0.6%
- **Daily profit:** $1.50-3.00

### Optimistic Estimate
- **Trades/day:** 10-15
- **Win rate:** 60%
- **Avg winner:** +1.0%
- **Avg loser:** -0.6%
- **Daily profit:** $3-6

### Math Example (10 trades, 60% win rate)
```
Winners: 6 trades × $2 position × 0.8% = $0.096 × 6 = $0.58
Losers:  4 trades × $2 position × 0.6% = $0.048 × 4 = $0.19
Net:     $0.58 - $0.19 = $0.39 per 10 trades

With leverage (5x): $0.39 × 5 = ~$2/day
```

### Monthly Projection
- **Conservative:** $45-90/month (45-90% return)
- **Optimistic:** $90-180/month (90-180% return)

⚠️ **DISCLAIMER:** These are projections, not guarantees. Crypto markets are volatile.

---

## 🚀 LAUNCH INSTRUCTIONS

### Start the Bot
```bash
cd /Users/erik/.openclaw/workspace
python3 hyperliquid_scalping_bot.py
```

### Run in Background (Screen)
```bash
screen -S scalping
python3 hyperliquid_scalping_bot.py
# Detach: Ctrl+A, then D
# Reattach: screen -r scalping
```

### Monitor
- Watch console output (logs every signal, every trade)
- Check `scalping_state.json` for current state
- Check `scalping_history.json` for trade history

### Stop the Bot
- Press Ctrl+C (graceful shutdown)
- State is saved automatically

---

## 📊 FILES

| File | Purpose |
|------|---------|
| `hyperliquid_scalping_bot.py` | Main bot code |
| `scalping_state.json` | Risk state (P&L, positions, etc.) |
| `scalping_history.json` | Trade history |
| `.hyperliquid_config.json` | API credentials |

---

## ⚙️ TUNING

### Make More Aggressive
```python
# In ScalpingConfig class:
MIN_CONFIDENCE_MOMENTUM = 50    # Lower from 55
MIN_CONFIDENCE_ORDERBOOK = 45   # Lower from 50
CHECK_INTERVAL_SECONDS = 30     # Faster from 45
```

### Make More Conservative
```python
MIN_CONFIDENCE_MOMENTUM = 65    # Higher from 55
MIN_CONFIDENCE_BREAKOUT = 70    # Higher from 60
MAX_POSITION_SIZE_PCT = 1.5     # Lower from 2.0
```

### Adjust Risk
```python
DAILY_LOSS_LIMIT = 10.0         # Lower from $20
MAX_CONSECUTIVE_LOSSES = 3      # Lower from 5
MAX_STOP_LOSS_PCT = 0.5         # Tighter from 1.0
```

---

## 🔄 COMPARISON: OLD vs NEW

| Metric | Old Bot | New Bot |
|--------|---------|---------|
| Timeframes | 1h, 4h, 1d | 1m, 5m |
| Check interval | 5 min | 45 sec |
| Min confidence | 70% | 50-60% |
| Strategies | 1 (combined) | 5 (independent) |
| Trades/day | 0-1 | 5-15 |
| Stop loss | 2-5% | 0.5-1.0% |
| Position check | 5 min | 15 sec |

---

## 🎯 SUCCESS CRITERIA

After 24 hours:
- [ ] 5+ trades executed
- [ ] No catastrophic loss (>$30)

After 48 hours:
- [ ] Positive P&L
- [ ] Win rate >55%

After 1 week:
- [ ] Consistent daily profit
- [ ] Win rate 55-65%
- [ ] Total return >20%

---

**Built for profit. Trade responsibly. 🚀**
