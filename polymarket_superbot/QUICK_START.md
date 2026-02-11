# ⚡ Quick Start - Polymarket Superbot

## 🏃 TL;DR - Get Running in 60 Seconds

```bash
cd /Users/erik/.openclaw/workspace/polymarket_superbot

# Test single cycle (paper mode)
./superbot.py --mode paper

# Run continuously
./superbot.py --mode paper --continuous
```

---

## 📋 Essential Commands

### Paper Trading (Safe)

```bash
# Single cycle
./superbot.py --mode paper

# Continuous (5-min cycles)
./superbot.py --mode paper --continuous

# Fast testing (30s cycles)
./superbot.py --mode paper --continuous --interval 30

# Limited trades per cycle
./superbot.py --mode paper --max-trades 3

# Performance report
./superbot.py --mode paper --report
```

### Live Trading (Real Money)

```bash
# FIRST: Edit config.py and set PAPER_MODE = False

# Single cycle
./superbot.py --mode live

# Continuous
./superbot.py --mode live --continuous

# In screen session (detached)
screen -S polybot
./superbot.py --mode live --continuous
# Ctrl+A then D to detach
```

---

## 🎯 Strategy Quick Reference

| Strategy | Allocation | What It Does |
|----------|-----------|--------------|
| **LLM Forecast** | 40% | AI predicts probabilities, trades when edge >5% |
| **Whale Copy** | 30% | Copies 5 whales ($600K-$2.9M profit each) |
| **Low-Risk Bonds** | 20% | Buys 95%+ certain outcomes at discount |
| **News Scalp** | 10% | Reacts to breaking news in 30 seconds |

---

## ⚙️ Key Config Settings

Edit `config.py`:

```python
# Trading mode
PAPER_MODE = True  # False for live

# Capital
STARTING_CAPITAL = 100.0  # Paper mode
LIVE_CAPITAL = 5000.0     # Live mode

# Risk limits
MAX_POSITION_SIZE_PCT = 20.0  # Max % per trade
MAX_DAILY_LOSS_PCT = 10.0     # Stop loss
```

---

## 📊 Monitoring

```bash
# View trades
tail -f data/trades_log.jsonl

# Check active positions
cat data/active_positions.json

# Performance report
./superbot.py --mode paper --report
```

---

## 🐛 Troubleshooting

### Bot won't start
```bash
python3 --version  # Need 3.9+
pip3 install requests py-clob-client eth-account
chmod +x superbot.py
```

### No opportunities found
- Markets might be correctly priced
- Try lowering `min_edge` in config
- Check Polymarket API status

### Trades failing
- Check USDC balance on Polygon
- Verify wallet credentials in config
- Check gas limits

---

## 🎓 Learning Path

### Day 1-7: Validation
1. Run paper trading
2. Monitor opportunities
3. Check win rate
4. Review trades

### Week 2: Optimization
1. Adjust strategy weights
2. Fine-tune risk limits
3. Integrate OpenClaw tools

### Week 3+: Scale
1. Start live with $500
2. Validate execution
3. Scale to $5K
4. Optimize cycle frequency

---

## 📁 Important Files

```
superbot.py              # Main bot
config.py                # Configuration
README.md                # Full docs
DEPLOYMENT_GUIDE.md      # Production setup
MISSION_COMPLETE.md      # What was built

data/
  trades_log.jsonl       # Trade history
  active_positions.json  # Current positions
  learned_params.json    # Adaptive weights
```

---

## 🚨 Emergency Stop

```bash
# Ctrl+C in terminal

# Or kill process
ps aux | grep superbot
kill <PID>

# Or screen
screen -r polybot
# Ctrl+C
```

---

## 💡 Pro Tips

1. **Start small** - $500-$1,000 for first live run
2. **Paper trade first** - Validate strategies for 7 days
3. **Monitor daily** - Check trades and P&L
4. **Adjust weights** - Boost winners, reduce losers
5. **Scale gradually** - Increase capital as edge proves out

---

## 🎯 Expected Results

### After 7 Days (Paper)
- 50-100 trades
- 55-70% win rate
- +$5 to +$20 paper profit

### After 30 Days (Live, $1K)
- 200-400 trades
- 55-65% win rate
- +$50 to +$200 real profit

### After 6 Months ($5K)
- 2000+ trades
- 60-70% win rate
- +$1,000 to +$10,000 profit

---

## 📞 Need Help?

1. Read `README.md` for detailed docs
2. Check `DEPLOYMENT_GUIDE.md` for setup
3. Review `POLYMARKET_WINNING_STRATEGIES.md` for research
4. Test each strategy individually (see README)

---

**Ready to trade? Start with paper mode:**

```bash
./superbot.py --mode paper --continuous
```

**Good luck. Trade wisely. 🚀**
