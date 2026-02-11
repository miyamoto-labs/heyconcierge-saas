# Hyperliquid Whale Copy Trading Setup

## Overview

Automated whale copy trading for Hyperliquid perpetuals - monitors profitable traders and alerts when they open new positions.

**Status:** 🟡 INFRASTRUCTURE READY (needs whale wallet addresses)

## How It Works

1. **Monitor** profitable trader wallets
2. **Detect** new positions (long/short on any coin)
3. **Alert** via Telegram with whale stats
4. **Copy** position with your own size/leverage
5. **Track** performance

## Configuration

**Position Sizing:**
- $15 per trade
- 10x leverage = $150 exposure
- Same size for all coins

**Scan Frequency:**
- Every 10 minutes (cron job)

**Current Mode:**
- 📝 PAPER MODE (signals only, no execution)

## Files

- `/Users/erik/.openclaw/workspace/hyperliquid_whale_tracker.py` - Main tracker
- `/Users/erik/.openclaw/workspace/hl_whale_cron.py` - Cron scanner (to be created)
- `/Users/erik/.openclaw/workspace/.hl_whale_alerted.json` - Tracking file

## Finding Profitable Whales

**Resources to find top traders:**

1. **Official Leaderboard**: https://app.hyperliquid.xyz/leaderboard
   - Sort by 30-day P&L or win rate
   - Look for consistent performers (not just lucky streaks)

2. **HyperDash**: https://hyperdash.info/top-traders
   - Advanced trader analytics
   - Position tracking

3. **CoinGlass**: https://www.coinglass.com/hyperliquid
   - Whale alerts & monitoring
   - Large position tracking

4. **Nansen** (premium): Perp leaderboard API
   - Smart money filters
   - Detailed trader metrics

**What to look for:**
- Win rate >55%
- Consistent 30-day profits
- Active trading (not just holding)
- Position sizes >$10K (serious traders)
- Multiple successful coins (not one-trick ponies)

**Known profitable traders (from research):**
- "White Whale" - $50M+ profit (Aug 2025) - *need wallet address*

## Adding Whales

Edit `/Users/erik/.openclaw/workspace/hyperliquid_whale_tracker.py`:

```python
self.whales = {
    "0x1234...abcd": {"name": "WhaleNickname", "win_rate": 0.65},
    "0x5678...efgh": {"name": "AnotherWhale", "win_rate": 0.62},
    # Add more here
}
```

**Recommended starting point:**
- 5-10 whales
- Mix of high win rate (65%+) and high volume traders
- Different trading styles (scalpers, swing traders)

## Alert Format

When a whale opens a new position, you'll get:

```
🐋 HYPERLIQUID WHALE ALERT

👤 Trader: WhaleNickname
📊 Win Rate: 65%

📈 Position:
  Coin: BTC
  Side: LONG
  Entry: $70,500
  Whale Size: $50,000
  Whale Leverage: 5
  Unrealized P&L: $0.00

💸 Your Copy:
  Size: $15
  Leverage: 10x
  Exposure: $150

⏸️  This is a signal only - no auto-execute
```

## Deployment Steps

**Step 1: Find whales** (manual)
- Check leaderboards
- Copy 5-10 profitable wallet addresses
- Note their win rates

**Step 2: Add to tracker**
- Edit `hyperliquid_whale_tracker.py`
- Add wallet addresses and stats

**Step 3: Test**
```bash
cd /Users/erik/.openclaw/workspace
python3 hyperliquid_whale_tracker.py
```

**Step 4: Deploy cron job**
- Ask Miyamoto to deploy
- Every 10 minutes
- DeepSeek model

**Step 5: Monitor & optimize**
- Track which whales generate best signals
- Remove underperformers
- Add new profitable traders

## Safety

✅ Paper mode by default
✅ Manual approval required
✅ Only alerts on NEW positions (not existing)
✅ Minimum whale position size: $1,000
✅ Deduplication (won't re-alert same trade)

## Performance Tracking

Track in daily memory files:
- Number of alerts
- Which whales trading what coins
- Signal quality
- Entry timing vs whale

## Next Steps

1. ⏳ **Find 5-10 profitable whale wallets** (check leaderboards)
2. ⏳ **Add wallets to tracker script**
3. ⏳ **Test scanner**
4. ⏳ **Deploy cron job**
5. ⏳ **Monitor for 24-48h**
6. ⏳ **Optimize whale selection**
7. ⏳ **Go live if signals are good**

---

**Created:** 2026-02-05  
**Last Updated:** 2026-02-05

**TODO:** Add real whale wallet addresses from leaderboard research
