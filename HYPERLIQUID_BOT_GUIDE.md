# Hyperliquid Autonomous Trading Bot - Complete Guide

**Version:** 1.0.0  
**Product:** Professional BTC Perpetuals Trading Bot  
**Platform:** Hyperliquid Decentralized Exchange  

---

## 🎯 What This Bot Does

This is a **fully autonomous, production-ready trading bot** that:

- ✅ Trades BTC perpetuals 24/7 without human intervention
- ✅ Uses multi-timeframe analysis (1h, 4h, daily)
- ✅ Implements comprehensive risk management
- ✅ Sends real-time Telegram alerts
- ✅ Tracks performance and generates reports
- ✅ Restarts safely after crashes
- ✅ Protects against catastrophic losses

**This is NOT a backtest. This is NOT a signal generator. This is a REAL AUTONOMOUS TRADER.**

---

## ⚠️ Critical Safety Information

### READ THIS BEFORE RUNNING

1. **This bot trades real money autonomously** when paper_mode is disabled
2. **You can lose money** - crypto trading is risky
3. **Always test in paper mode first** - at least 24 hours
4. **Start with small positions** - 1-2% of account
5. **Monitor regularly** - check status reports
6. **Set risk limits** - daily loss limits, max positions
7. **Keep emergency stop ready** - set emergency_stop: true to halt immediately

### Financial Risk Warning

Trading cryptocurrency perpetuals involves substantial risk of loss. This bot:
- Uses leverage (amplifies both gains AND losses)
- Operates autonomously (no human approval)
- Cannot predict market crashes or black swan events
- May lose money during unfavorable market conditions

**Only risk capital you can afford to lose completely.**

---

## 📋 System Requirements

### Minimum Requirements

- **OS:** Linux, macOS, or Windows (WSL recommended)
- **Python:** 3.8 or higher
- **RAM:** 2GB minimum
- **Storage:** 1GB free space
- **Internet:** Stable connection (24/7 uptime recommended)

### Recommended Setup

- **VPS/Cloud Server:** For 24/7 operation (DigitalOcean, AWS, etc.)
- **RAM:** 4GB+ for smooth operation
- **Monitoring:** Telegram for alerts

---

## 🚀 Quick Start (Step-by-Step)

### Step 1: Setup Files

You should already have these files:
```
hyperliquid_autonomous_trader.py  # Main bot
trading_config.json               # Configuration
performance_stats.py              # Performance tracking
setup_hyperliquid_bot.sh         # Setup script
.hyperliquid_config.json         # Your API credentials (already exists)
```

### Step 2: Run Setup Script

```bash
chmod +x setup_hyperliquid_bot.sh
./setup_hyperliquid_bot.sh
```

This will:
- Create virtual environment
- Install dependencies
- Test Hyperliquid connection
- Verify your account

### Step 3: Configure Bot

Edit `trading_config.json`:

```bash
nano trading_config.json
```

**Key settings to review:**

```json
{
  "mode": {
    "paper_mode": true,        // ← KEEP TRUE FOR TESTING!
    "autonomous": true          // ← True = auto-execute
  },
  
  "risk_management": {
    "position_size_pct": 2.0,  // ← Start small (1-2%)
    "stop_loss_pct": 3.0,      // ← Stop loss per trade
    "take_profit_pct": 8.0,    // ← Profit target
    "max_positions": 2,         // ← Limit concurrent trades
    "daily_loss_limit_usd": 50  // ← Daily loss limit
  }
}
```

### Step 4: Test in Paper Mode

**IMPORTANT: Run in paper mode for at least 24 hours!**

```bash
python3 hyperliquid_autonomous_trader.py
```

You should see:
```
🤖 Hyperliquid Autonomous Trading Bot v1.0
✅ Connected to Hyperliquid MAINNET
📝 Running in PAPER MODE (no real trades)
🚀 STARTING AUTONOMOUS TRADING BOT
```

Let it run. Monitor the output. Check if signals are generated.

### Step 5: Monitor Performance

In another terminal:

```bash
python3 performance_stats.py
```

This shows:
- Total trades
- Win rate
- P&L
- Risk metrics

### Step 6: Go Live (When Ready)

**Only after successful paper trading!**

Edit `trading_config.json`:
```json
{
  "mode": {
    "paper_mode": false  // ← NOW IT'S LIVE!
  }
}
```

Start the bot:
```bash
python3 hyperliquid_autonomous_trader.py
```

---

## 📊 How The Bot Works

### Trading Logic

#### 1. Multi-Timeframe Analysis

The bot analyzes 3 timeframes:

- **1-hour:** Scalping (fast moves, 2% SL, 4% TP)
- **4-hour:** Swing trading (medium moves, 3% SL, 7% TP)
- **Daily:** Position trading (major trends, 5% SL, 10% TP)

Each timeframe gets a confidence score (0-100).

#### 2. Signal Generation

For each timeframe, the bot checks:

**Long Signals:**
- RSI oversold (<40)
- EMA fast > EMA slow (bullish crossover)
- Price above moving averages (uptrend)

**Short Signals:**
- RSI overbought (>60)
- EMA fast < EMA slow (bearish crossover)
- Price below moving averages (downtrend)

**Confidence scoring:**
- Need 50+ confidence to generate signal
- Weighted by timeframe importance (daily > 4h > 1h)
- Cross-timeframe confirmation increases confidence

#### 3. Trade Execution

When composite confidence ≥ 70% (configurable):

1. **Risk check:** Verify all safety limits
2. **Position sizing:** Calculate size based on account balance
3. **Order placement:** Execute market order
4. **Set stops:** Record stop-loss and take-profit levels
5. **Alert:** Send Telegram notification

#### 4. Position Management

Every 5 minutes, the bot:

- Checks current price vs stop-loss
- Checks current price vs take-profit
- Closes position if triggered
- Updates performance stats

#### 5. Risk Management

**Before every trade:**
- ✅ Daily loss limit not exceeded?
- ✅ Not too many consecutive losses?
- ✅ Max positions not reached?
- ✅ Drawdown within limits?
- ✅ Emergency stop not activated?

If any check fails: **TRADE BLOCKED**

---

## 🛡️ Risk Management Features

### Position Limits

```json
"position_size_pct": 3.0      // Max 3% of account per trade
"max_positions": 3             // Max 3 concurrent positions
```

### Stop-Loss & Take-Profit

Every position has:
- **Stop-loss:** Automatic exit at X% loss
- **Take-profit:** Automatic exit at X% gain

Configurable per timeframe.

### Daily Loss Limit

```json
"daily_loss_limit_usd": 100.0  // Stop trading after $100 loss today
```

Bot pauses until next day if limit hit.

### Consecutive Loss Protection

```json
"max_consecutive_losses": 3    // Pause after 3 losses in a row
```

Bot pauses for 4 hours to avoid revenge trading.

### Drawdown Protection

```json
"max_drawdown_pct": 15.0       // Pause if account down 15% from peak
```

Protects against sustained losing streaks.

### Emergency Stop

To immediately halt all trading:

```bash
# Edit config
nano trading_config.json

# Set emergency_stop to true
"emergency_stop": true

# Bot will stop on next iteration
```

Or:

```bash
# Kill the process
pkill -f hyperliquid_autonomous_trader
```

---

## 📱 Monitoring & Alerts

### Telegram Alerts

The bot sends alerts for:

1. **Trade entries** - When position opened
2. **Trade exits** - Stop-loss or take-profit hit
3. **Hourly status** - Balance, positions, P&L
4. **Warnings** - Approaching risk limits
5. **Errors** - API failures, connection issues

**Alert format:**

```
💰 LIVE TRADE EXECUTED

🟢 LONG BTC

💰 Entry: $95,432.00
📊 Size: $30.00
⏱️  Timeframe: 4h
🎯 Confidence: 78.5%

🛑 Stop Loss: $92,570.00
🎯 Target: $102,963.00

⏰ 2026-02-05 22:45:00
```

### Status Reports

Every hour:

```
📊 BOT STATUS REPORT

⏰ 2026-02-05 23:00:00

💰 Balance: $1,250.00
📊 Open Positions: 2
📈 Total Trades: 15
✅ Win Rate: 66.7%
📉 Daily P&L: $45.00
🔄 Consecutive Losses: 0
```

### Performance Tracking

Run anytime:

```bash
python3 performance_stats.py
```

Output:

```
📊 HYPERLIQUID BOT PERFORMANCE REPORT
======================================================================

📈 OVERALL PERFORMANCE
----------------------------------------------------------------------
Total Trades: 42
Winning Trades: 28
Losing Trades: 14
Win Rate: 66.67%

Total P&L: $347.50
Average Win: $18.20
Average Loss: -$8.40
Largest Win: $45.00
Largest Loss: -$15.00

Profit Factor: 2.17
Risk/Reward Ratio: 2.17
Sharpe Ratio: 1.85
Max Drawdown: 8.50%
```

---

## 🔧 Configuration Reference

### Complete `trading_config.json` Explained

```json
{
  // === OPERATING MODE ===
  "mode": {
    "paper_mode": true,
    // true = simulate trades (no real money)
    // false = execute real trades (DANGEROUS!)
    
    "autonomous": true
    // true = bot executes automatically
    // false = signals only (no execution)
  },
  
  // === RISK MANAGEMENT ===
  "risk_management": {
    "position_size_pct": 3.0,
    // Percentage of account per trade
    // Recommended: 1-5%
    // Higher = more risk, more reward
    
    "stop_loss_pct": 3.0,
    // Stop-loss percentage from entry
    // Recommended: 2-5%
    // Tighter = less risk per trade
    
    "take_profit_pct": 8.0,
    // Take-profit percentage from entry
    // Recommended: 6-12%
    // Should be 2-3x stop_loss
    
    "max_positions": 3,
    // Maximum concurrent positions
    // Recommended: 1-5
    // More = more exposure
    
    "daily_loss_limit_usd": 100.0,
    // Stop trading after this daily loss
    // Recommended: 5-10% of account
    
    "max_consecutive_losses": 3,
    // Pause after X losses in a row
    // Recommended: 3-5
    
    "max_drawdown_pct": 15.0,
    // Pause if account drops X% from peak
    // Recommended: 10-20%
    
    "max_leverage": 10
    // Maximum allowed leverage
    // Recommended: 5-10
    // Higher leverage = higher risk
  },
  
  // === SIGNAL GENERATION ===
  "signal_generation": {
    "min_confidence": 70,
    // Minimum confidence to trade
    // Recommended: 60-80
    // Higher = fewer trades, better quality
    
    "timeframes": {
      "1h": {
        "enabled": true,          // Enable 1h signals
        "weight": 1.0,            // Importance weight
        "stop_loss_pct": 2.0,     // 1h-specific stop
        "take_profit_pct": 4.0,   // 1h-specific target
        "leverage": 10            // 1h-specific leverage
      },
      "4h": {
        "enabled": true,
        "weight": 1.5,            // More important than 1h
        "stop_loss_pct": 3.0,
        "take_profit_pct": 7.0,
        "leverage": 8
      },
      "1d": {
        "enabled": true,
        "weight": 2.0,            // Most important
        "stop_loss_pct": 5.0,
        "take_profit_pct": 10.0,
        "leverage": 7
      }
    },
    
    "cross_timeframe_confirmation": true
    // Require multiple timeframes to agree
    // true = safer (fewer trades)
    // false = more trades (potentially lower quality)
  },
  
  // === MONITORING ===
  "monitoring": {
    "telegram_alerts": true,
    // Send Telegram notifications
    
    "hourly_status": true,
    // Send hourly status reports
    
    "alert_on_warnings": true
    // Alert when approaching limits
  },
  
  // === SAFETY ===
  "safety": {
    "emergency_stop": false,
    // Set to true to HALT immediately
    
    "max_slippage_pct": 0.5,
    // Cancel if slippage exceeds this
    
    "api_rate_limit_delay_sec": 1.0,
    // Delay between API calls
    
    "health_check_interval_sec": 60
    // How often to verify API connection
  }
}
```

---

## 🎛️ Advanced Configuration

### Conservative Settings (Low Risk)

```json
{
  "position_size_pct": 1.0,      // 1% per trade
  "stop_loss_pct": 2.0,          // Tight stop
  "take_profit_pct": 6.0,        // Modest target
  "max_positions": 1,             // One trade at a time
  "daily_loss_limit_usd": 50.0,  // Low daily limit
  "min_confidence": 80            // High confidence only
}
```

**Expected:** Low frequency, high quality trades

### Aggressive Settings (High Risk)

```json
{
  "position_size_pct": 5.0,      // 5% per trade
  "stop_loss_pct": 4.0,          // Wider stop
  "take_profit_pct": 12.0,       // Bigger targets
  "max_positions": 5,             // Multiple positions
  "daily_loss_limit_usd": 200.0, // Higher limit
  "min_confidence": 60            // More trades
}
```

**Expected:** High frequency, higher risk/reward

### Balanced Settings (Recommended)

```json
{
  "position_size_pct": 3.0,
  "stop_loss_pct": 3.0,
  "take_profit_pct": 8.0,
  "max_positions": 3,
  "daily_loss_limit_usd": 100.0,
  "min_confidence": 70
}
```

**Expected:** Moderate frequency, balanced risk

---

## 🐛 Troubleshooting

### Bot Won't Start

**Error:** "trading_config.json not found"
```bash
# Ensure you're in the correct directory
ls -la trading_config.json

# If missing, you need to create it
```

**Error:** "Cannot connect to Hyperliquid"
```bash
# Check internet connection
ping hyperliquid.xyz

# Verify API credentials
cat .hyperliquid_config.json
```

**Error:** "Python version too old"
```bash
# Check Python version
python3 --version

# Need 3.8+, upgrade if necessary
```

### No Trades Executing

**Issue:** Bot running but no trades

**Possible causes:**

1. **Confidence too high**
   - Lower `min_confidence` in config (try 60)

2. **No signals generated**
   - Check if market is trending or ranging
   - Market may not meet criteria

3. **Risk limits blocking trades**
   - Check status output for warnings
   - May have hit daily loss limit
   - May have max positions open

4. **Autonomous mode disabled**
   - Verify `autonomous: true` in config

### Position Not Closing

**Issue:** Position should have hit stop/target but didn't close

**Possible causes:**

1. **Paper mode enabled**
   - Paper mode simulates, doesn't execute real closes

2. **API error**
   - Check bot logs for error messages
   - Hyperliquid API may be slow

3. **Price didn't trigger**
   - Verify actual market price
   - Stops are checked every 5 minutes (not instant)

### High Losses

**Issue:** Bot losing money consistently

**Actions:**

1. **STOP THE BOT IMMEDIATELY**
   ```bash
   # Edit config
   nano trading_config.json
   # Set emergency_stop: true
   ```

2. **Review recent trades**
   ```bash
   python3 performance_stats.py
   ```

3. **Check market conditions**
   - Is market very choppy?
   - Are we in a range or trend?

4. **Adjust settings**
   - Reduce position size
   - Tighten stops
   - Increase min_confidence
   - Reduce max_positions

5. **Test in paper mode again**
   - Validate new settings before going live

---

## 📈 Performance Expectations

### Realistic Expectations

**Good performance:**
- Win rate: 55-70%
- Profit factor: 1.5-2.5
- Monthly return: 5-15%
- Max drawdown: 10-20%

**Warning signs:**
- Win rate < 40%
- Profit factor < 1.0
- Monthly loss > 20%
- Max drawdown > 30%

### Market Conditions

Bot performs differently in different conditions:

**Trending markets:**
- More signals
- Higher win rate
- Larger profits

**Ranging markets:**
- Fewer signals
- More whipsaws
- Smaller profits

**Volatile/choppy markets:**
- Many false signals
- Losses from whipsaws
- Consider pausing bot

---

## 🔄 Deployment & Operations

### Running 24/7 on a VPS

**Recommended: DigitalOcean, AWS, Linode**

1. **Create VPS** (Ubuntu 22.04, 2GB RAM)

2. **Upload files**
   ```bash
   scp -r * user@your-vps-ip:/home/user/trading-bot/
   ```

3. **SSH into VPS**
   ```bash
   ssh user@your-vps-ip
   cd trading-bot
   ```

4. **Run setup**
   ```bash
   ./setup_hyperliquid_bot.sh
   ```

5. **Start bot in screen/tmux**
   ```bash
   # Using screen (recommended)
   screen -S trading-bot
   python3 hyperliquid_autonomous_trader.py
   # Ctrl+A, D to detach
   
   # To reattach
   screen -r trading-bot
   ```

6. **Or use systemd service**
   ```bash
   sudo nano /etc/systemd/system/trading-bot.service
   ```
   
   ```ini
   [Unit]
   Description=Hyperliquid Trading Bot
   After=network.target
   
   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/home/your-user/trading-bot
   ExecStart=/home/your-user/trading-bot/venv/bin/python3 hyperliquid_autonomous_trader.py
   Restart=always
   RestartSec=10
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   sudo systemctl enable trading-bot
   sudo systemctl start trading-bot
   sudo systemctl status trading-bot
   ```

### Monitoring

**Check logs:**
```bash
# If using systemd
sudo journalctl -u trading-bot -f

# Or redirect to file
python3 hyperliquid_autonomous_trader.py >> logs/bot.log 2>&1
```

**Monitor performance:**
```bash
# Set up cron job for daily reports
crontab -e

# Add line:
0 0 * * * cd /home/user/trading-bot && python3 performance_stats.py >> logs/performance.log
```

### Backup & Recovery

**Backup important files:**
```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz \
  bot_state.json \
  trade_history.json \
  performance_metrics.json \
  trading_config.json

# Upload to cloud
scp backup-*.tar.gz your-backup-server:/backups/
```

**Recovery after crash:**
```bash
# Bot resumes from saved state automatically
# Just restart:
python3 hyperliquid_autonomous_trader.py

# State is loaded from bot_state.json
# Open positions are synced from Hyperliquid
```

---

## 💰 Commercial Deployment ($299/month SaaS)

### For Customers

**What they get:**
- Pre-configured bot
- Setup support
- Configuration guidance
- Performance monitoring
- Updates & bug fixes
- Community Discord/Telegram

**What they need:**
- Hyperliquid account with API access
- VPS or always-on computer
- $500+ trading capital (recommended)
- Basic terminal knowledge

### Setup for Customers

1. **Purchase** → Receive download link
2. **VPS Setup** → Follow guide
3. **Configure** → Set risk parameters
4. **Paper test** → 24 hours minimum
5. **Go live** → Monitor & adjust

### Support Checklist

- [ ] Telegram support group
- [ ] Setup documentation (this guide)
- [ ] Video walkthrough
- [ ] Configuration templates
- [ ] Performance benchmarks
- [ ] FAQ / Common issues
- [ ] Update notification system

---

## 🔐 Security Best Practices

### API Key Security

1. **Never share API keys**
2. **Use API wallet, not main wallet**
3. **Set API permissions to trading only**
4. **Rotate keys periodically**
5. **Keep `.hyperliquid_config.json` encrypted**

### Server Security

1. **Use SSH keys, not passwords**
2. **Enable firewall (UFW)**
3. **Keep system updated**
4. **Monitor access logs**
5. **Use VPN if possible**

### Operational Security

1. **Start small** - Test with minimal capital
2. **Monitor regularly** - Check status daily
3. **Set alerts** - Know when things go wrong
4. **Have exit plan** - Know when to stop
5. **Don't overtrade** - Respect risk limits

---

## 📞 Support & Resources

### Getting Help

**GitHub Issues:** [Your repo URL]  
**Telegram:** [Your support group]  
**Email:** [Your support email]

### Useful Commands

```bash
# Start bot
python3 hyperliquid_autonomous_trader.py

# Check performance
python3 performance_stats.py

# View logs (if using systemd)
sudo journalctl -u trading-bot -f

# Stop bot
pkill -f hyperliquid_autonomous_trader

# Emergency stop
nano trading_config.json  # Set emergency_stop: true
```

### Log Files

```
bot_state.json          - Current bot state
trade_history.json      - All executed trades
performance_metrics.json - Performance data
logs/bot.log           - Application logs
```

---

## 📜 Disclaimer & License

### Legal Disclaimer

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

- **No guarantees** of profit or performance
- **Use at your own risk** - you may lose money
- **Not financial advice** - DYOR
- **Cryptocurrency trading involves substantial risk**

By using this software, you acknowledge:
1. You understand the risks of automated trading
2. You are responsible for your own trading decisions
3. The developers are not liable for any losses
4. You comply with local regulations

### License

[Insert your license here - MIT, proprietary, etc.]

---

## 🚀 Future Enhancements

Planned features:
- [ ] Multi-asset support (ETH, SOL, etc.)
- [ ] Web dashboard
- [ ] Advanced order types (limit, trailing stop)
- [ ] Machine learning signal enhancement
- [ ] Portfolio rebalancing
- [ ] Backtesting integration
- [ ] Mobile app

---

## 📝 Changelog

**v1.0.0** (2026-02-05)
- Initial release
- Multi-timeframe analysis
- Autonomous execution
- Risk management system
- Telegram alerts
- Performance tracking

---

**Built with ❤️ for profitable autonomous trading**

*Good luck and trade safely! 🚀*
