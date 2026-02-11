# TODO: Launchd Setup for Trading Bots

**Problem:** Both bots crash after 30 minutes due to exec timeout

**Solution:** Configure persistent launchd services

## Bots Needing Launchd

1. **Hyperliquid HMM Regime Bot**
   - Script: `/Users/erik/.openclaw/workspace/hyperliquid_hmm_bot.py`
   - Log: `/Users/erik/.openclaw/workspace/hmm_bot_live.log`
   - Current balance: ~$585

2. **Polymarket Chainlink Lag Bot**
   - Script: `/Users/erik/.openclaw/workspace/polymarket_chainlink_lag.py`
   - Log: `/Users/erik/.openclaw/workspace/polymarket_paper.log`
   - Mode: Paper trading

## What Launchd Does

- Keeps processes running indefinitely (no 30-min exec timeout)
- Auto-restarts on crash
- Survives system reboots
- Proper daemon management

## Next Steps

1. Create `.plist` files for each bot
2. Load with `launchctl load`
3. Verify with `launchctl list | grep bot`
4. Remove manual exec calls

**Created:** 2026-02-10 03:49 AM
