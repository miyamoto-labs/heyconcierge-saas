# 🚀 Deployment Guide - Polymarket Superbot

**Status:** ✅ **PRODUCTION READY**

This guide covers deploying the bot from paper trading to live production.

---

## 📋 Pre-Flight Checklist

### 1. Environment Setup

```bash
cd /Users/erik/.openclaw/workspace/polymarket_superbot

# Verify Python 3.9+
python3 --version

# Verify dependencies
pip3 list | grep -E "requests|py-clob-client|eth-account"

# Make superbot executable
chmod +x superbot.py
```

### 2. Configuration Audit

Edit `config.py`:

```python
# For Paper Trading
PAPER_MODE = True
STARTING_CAPITAL = 100.0

# For Live Trading (when ready)
PAPER_MODE = False
LIVE_CAPITAL = 5000.0  # YOUR ACTUAL CAPITAL

# Verify wallet credentials
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
```

### 3. Wallet Verification

```bash
# Check USDC balance on Polygon
# Visit: https://polygonscan.com/address/0x114B7A51A4cF04897434408bd9003626705a2208
```

---

## 🧪 Phase 1: Paper Trading (Days 1-7)

**Goal:** Validate strategies without risking real money.

### Run Paper Trading

```bash
# Single cycle test
./superbot.py --mode paper --max-trades 3

# Continuous (5-minute cycles)
./superbot.py --mode paper --continuous --interval 300

# Aggressive testing (30-second cycles)
./superbot.py --mode paper --continuous --interval 30
```

### What to Monitor

1. **Opportunities Found**
   - Are strategies finding markets?
   - Are edges realistic?

2. **Trade Execution**
   - Do trades execute successfully?
   - Are position sizes correct?

3. **Risk Management**
   - Are limits being respected?
   - Any rejected trades?

### Expected Results After 7 Days

```
Trades executed: 50-100
Win rate: 55-70%
Paper P&L: +$5 to +$20
Daily opportunities: 5-15
```

---

## 💰 Phase 2: Live Trading (Small Scale)

**Goal:** Validate with real money at small scale.

### Pre-Launch Checks

```bash
# 1. Review paper trading results
./superbot.py --mode paper --report

# 2. Verify wallet has USDC
# Need: $500-$1,000 USDC on Polygon

# 3. Update config
# Edit config.py:
#   PAPER_MODE = False
#   LIVE_CAPITAL = 500.0
```

### Launch Live Bot

```bash
# First live cycle (manual)
./superbot.py --mode live --max-trades 1

# If successful, run continuously
./superbot.py --mode live --continuous --interval 300
```

### Week 1 Live Goals

- Execute 10-20 trades
- Validate execution works
- Check gas costs
- Monitor slippage
- Verify P&L tracking

### Emergency Stop

```bash
# Press Ctrl+C to stop bot gracefully

# Or kill process
ps aux | grep superbot
kill <PID>
```

---

## 📈 Phase 3: Scaling Up

Once validated (2-4 weeks live):

### Increase Capital

```python
# In config.py
LIVE_CAPITAL = 5000.0  # Scale to $5K

# Adjust position sizes
MAX_POSITION_SIZE_PCT = 20.0  # Max $1K per trade
```

### Optimize Cycle Frequency

```bash
# Conservative (5 minutes)
./superbot.py --mode live --continuous --interval 300

# Moderate (2 minutes)
./superbot.py --mode live --continuous --interval 120

# Aggressive (30 seconds)
./superbot.py --mode live --continuous --interval 30
```

---

## 🔧 Production Deployment

### Option 1: Screen Session (Simple)

```bash
# Start screen session
screen -S polymarket-bot

# Run bot
cd /Users/erik/.openclaw/workspace/polymarket_superbot
./superbot.py --mode live --continuous

# Detach: Ctrl+A then D

# Reattach later
screen -r polymarket-bot
```

### Option 2: Systemd Service (Robust)

Create `/etc/systemd/system/polymarket-bot.service`:

```ini
[Unit]
Description=Polymarket Superbot
After=network.target

[Service]
Type=simple
User=erik
WorkingDirectory=/Users/erik/.openclaw/workspace/polymarket_superbot
ExecStart=/usr/bin/python3 superbot.py --mode live --continuous --interval 300
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable polymarket-bot
sudo systemctl start polymarket-bot
sudo systemctl status polymarket-bot

# View logs
sudo journalctl -u polymarket-bot -f
```

### Option 3: Docker Container (Advanced)

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY . /app

RUN pip install requests py-clob-client eth-account

CMD ["python3", "superbot.py", "--mode", "live", "--continuous"]
```

Build and run:

```bash
docker build -t polymarket-bot .
docker run -d --name polybot polymarket-bot
```

---

## 📊 Monitoring & Alerts

### Daily Checks

```bash
# Performance report
./superbot.py --mode live --report

# Check logs
tail -100 data/superbot.log

# Review trades
tail -50 data/trades_log.jsonl
```

### Weekly Review

1. **Win Rate** - Should be >55%
2. **P&L** - Positive trend?
3. **Strategy Performance** - Which is best?
4. **Failed Trades** - Any patterns?

### Monthly Optimization

```python
# Adjust strategy weights based on performance
STRATEGY_WEIGHTS = {
    "llm_forecast": 0.50,  # If outperforming
    "whale_copy": 0.20,    # If underperforming
    "low_risk_bond": 0.30
}
```

---

## 🐛 Troubleshooting

### Bot Won't Start

```bash
# Check Python path
which python3

# Check dependencies
pip3 install -r requirements.txt

# Check permissions
chmod +x superbot.py

# Check config syntax
python3 -c "import config; print('Config OK')"
```

### No Opportunities Found

- **Market API down?** - Check Polymarket status
- **Filters too strict?** - Reduce `min_edge` in config
- **Low liquidity?** - Markets might be thin
- **Already positioned?** - Bot won't double-bet

### Trades Failing

- **Insufficient balance?** - Check USDC wallet
- **Gas too low?** - Increase gas limit
- **Slippage?** - Use limit orders
- **API rate limit?** - Reduce cycle frequency

### High Losses

```bash
# STOP THE BOT
# Press Ctrl+C or kill process

# Review what went wrong
./superbot.py --mode live --report

# Check data/trades_log.jsonl for losing trades

# Adjust risk limits in config.py
MAX_DAILY_LOSS_PCT = 5.0  # More conservative
```

---

## 🔐 Security Best Practices

### Wallet Security

1. **Never commit private keys** to git
2. **Use environment variables** for sensitive data
3. **Enable 2FA** on Polymarket account
4. **Monitor wallet** regularly

### Config Template (Safe)

```python
import os

# Load from environment
PRIVATE_KEY = os.getenv("POLYMARKET_PRIVATE_KEY")
WALLET_ADDRESS = os.getenv("POLYMARKET_WALLET")

# Never hardcode keys in production!
```

### API Keys

If using OpenClaw integration:

```bash
# Store in environment
export DEEPSEEK_API_KEY="your-key"
export TWITTER_API_KEY="your-key"
```

---

## 📈 Scaling Strategy

### Phase 1: Validation ($500)
- 2-4 weeks
- Prove edge exists
- Learn and adapt

### Phase 2: Growth ($5,000)
- Scale successful strategies
- Optimize cycle frequency
- Add automation

### Phase 3: Full Scale ($20,000+)
- Deploy multiple instances
- Add more strategies
- Integrate advanced analytics

---

## 🎯 Success Metrics

### Short-Term (30 Days)
- [ ] 100+ trades executed
- [ ] 55%+ win rate
- [ ] +10% return
- [ ] Zero critical failures

### Medium-Term (90 Days)
- [ ] 500+ trades executed
- [ ] 60%+ win rate
- [ ] +30% return
- [ ] Adaptive learning working

### Long-Term (6 Months)
- [ ] 2000+ trades executed
- [ ] 65%+ win rate
- [ ] +100% return
- [ ] Profitable every month

---

## 🚨 Risk Warnings

### Market Risks
- Prediction markets can be volatile
- Edge may disappear as competition increases
- Regulatory changes possible

### Technical Risks
- API downtime
- Execution failures
- Slippage on large orders

### Financial Risks
- You can lose money
- Past performance ≠ future results
- No guarantees

### Risk Mitigation
✅ Start small  
✅ Use stop losses  
✅ Diversify strategies  
✅ Monitor daily  
✅ Keep learning  

---

## 📞 Support & Resources

### Documentation
- `README.md` - Full system documentation
- `POLYMARKET_WINNING_STRATEGIES.md` - Research findings
- `config.py` - Configuration reference

### Tools
- [PolyTrack](https://polytrackhq.app) - Whale monitoring
- [Polygonscan](https://polygonscan.com) - On-chain data
- [Polymarket Docs](https://docs.polymarket.com) - API reference

### Community
- r/PolymarketTrading - Reddit community
- Polymarket Discord - Official server
- Twitter: @polymarket - Official updates

---

## ✅ Launch Checklist

Before going live with real money:

- [ ] Paper traded for 7+ days
- [ ] Reviewed all trades
- [ ] Win rate >55%
- [ ] Positive paper P&L
- [ ] Wallet funded with USDC
- [ ] Config.py updated correctly
- [ ] Risk limits set appropriately
- [ ] Emergency stop procedure tested
- [ ] Monitoring system in place
- [ ] Comfortable with potential losses

---

**Remember:** This is an experimental trading system. Start small. Validate your edge. Scale gradually.

**Good luck. Trade wisely. 🚀**
