# ⚡️ HYPERLIQUID BOT - QUICK START

**5-minute guide to get the bot running**

---

## 🚀 Start Trading in 3 Commands

```bash
# 1. Setup (installs everything)
./setup_hyperliquid_bot.sh

# 2. Start bot (paper mode - safe!)
python3 hyperliquid_autonomous_trader.py

# 3. Monitor performance (in another terminal)
python3 performance_stats.py
```

**That's it! Bot is now running in paper mode (no real trades).**

---

## 📋 What's Happening

The bot will:
1. ✅ Connect to Hyperliquid
2. ✅ Fetch BTC price data
3. ✅ Analyze 1h, 4h, and daily charts
4. ✅ Generate trading signals
5. ✅ Simulate trades (paper mode)
6. ✅ Print status updates every 5 minutes

**You'll see output like:**

```
🤖 Hyperliquid Autonomous Trading Bot v1.0
✅ Connected to Hyperliquid MAINNET
📝 Running in PAPER MODE (no real trades)
✅ Bot initialized successfully!

💰 Account Balance: $0.00

🔄 Iteration 1 - 2026-02-05 22:45:00
📊 Generating trading signals...
⏸️  No trading signal generated

😴 Sleeping for 300 seconds...
```

---

## ⚙️ Quick Configuration

**Before going live, edit this file:**

```bash
nano trading_config.json
```

**Key settings:**

```json
{
  "mode": {
    "paper_mode": true,     // ← Keep TRUE for testing!
    "autonomous": true       // ← True = auto-execute
  },
  
  "risk_management": {
    "position_size_pct": 3.0,       // 3% per trade
    "stop_loss_pct": 3.0,           // 3% stop loss
    "take_profit_pct": 8.0,         // 8% profit target
    "max_positions": 3,              // Max 3 trades
    "daily_loss_limit_usd": 100.0   // Stop after $100 loss
  },
  
  "signal_generation": {
    "min_confidence": 70  // Only trade 70%+ confidence
  }
}
```

---

## 🛑 Emergency Stop

**Need to stop the bot immediately?**

```bash
# Press Ctrl+C in the terminal

# Or kill it
pkill -f hyperliquid_autonomous_trader

# Or set emergency stop
nano trading_config.json
# Set: "emergency_stop": true
```

---

## 📊 Check Performance

```bash
python3 performance_stats.py
```

**Shows:**
- Total trades
- Win rate
- P&L
- Profit factor
- Sharpe ratio
- Max drawdown

---

## 💰 Go Live (When Ready)

**⚠️ ONLY after 24+ hours of paper testing!**

```bash
# 1. Stop the bot (Ctrl+C)

# 2. Edit config
nano trading_config.json

# 3. Change paper_mode to false
"paper_mode": false  # ← NOW LIVE!

# 4. Restart bot
python3 hyperliquid_autonomous_trader.py

# 🚨 NOW TRADING REAL MONEY! 🚨
```

---

## 📚 Full Documentation

**Everything you need to know:**

- **HYPERLIQUID_BOT_GUIDE.md** (20KB complete guide)
  - Detailed setup
  - Configuration reference
  - Risk management
  - Troubleshooting
  - Deployment guide
  - Security practices

- **README_HYPERLIQUID_BOT.md** (Quick reference)

- **DELIVERY_SUMMARY.md** (What was built)

---

## 🎯 Testing Checklist

**Before going live:**

- [ ] Bot runs in paper mode without errors
- [ ] Signals are generated (check output)
- [ ] Risk checks work (no invalid trades)
- [ ] Performance looks reasonable
- [ ] Understand emergency stop
- [ ] Read HYPERLIQUID_BOT_GUIDE.md
- [ ] Set conservative risk limits

---

## ⚠️ Safety Reminders

1. **ALWAYS test in paper mode first** (24+ hours)
2. **Start with SMALL positions** (1-2% of account)
3. **Monitor DAILY** (check status reports)
4. **Set CONSERVATIVE limits** (low daily loss)
5. **Keep emergency stop READY**

---

## 🆘 Common Issues

### Bot won't start
```bash
# Re-run setup
./setup_hyperliquid_bot.sh

# Check Python version (need 3.8+)
python3 --version
```

### No trades happening
- Lower `min_confidence` to 60
- Check market is active (not too ranging)
- Verify `autonomous: true` in config

### Bot losing money
1. **STOP IT** (Ctrl+C or emergency_stop: true)
2. Check performance: `python3 performance_stats.py`
3. Reduce position size
4. Tighten stops
5. Re-test in paper mode

---

## 📞 Need Help?

1. **Check documentation:** HYPERLIQUID_BOT_GUIDE.md
2. **Troubleshooting section** in the guide
3. **Review delivery summary:** DELIVERY_SUMMARY.md

---

## 🏆 Current Status

✅ **System operational and tested**  
✅ **All features implemented**  
✅ **Documentation complete**  
✅ **Ready for deployment**  

**You're ready to trade! 🚀**

Start with paper mode, test thoroughly, then go live when confident.

---

**Built for autonomous, profitable trading.**  
**Use wisely. Trade safely. Make money. 🚀**
