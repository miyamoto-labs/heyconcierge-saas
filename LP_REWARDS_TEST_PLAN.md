# Polymarket LP Rewards Test Plan

## Goal
Validate if Polymarket LP rewards are real and profitable before building automation bot.

## Capital
$100 USDC (from existing Phantom wallet on Polygon)

## Timeline
- **Day 1 (Feb 6):** Manual setup + place first LP positions
- **Day 2-3:** Monitor rewards, adjust positions
- **Day 4:** Collect results, calculate ROI
- **Decision:** Build bot if profitable, abandon if not

## Strategy

### Market Selection Criteria
1. **High rewards:** $50+ per day listed
2. **Low competition:** Few other LPs (less than 5)
3. **Balanced markets:** 40-60% probability (not extreme)
4. **High volume:** Active trading (>$1K daily volume)
5. **Simple resolution:** Clear yes/no outcomes

### Position Sizing
- Start with 2-3 markets
- $30-50 per market
- Place simultaneous buy/sell orders (market-making)
- Maintain narrow spread (1-2%)

### Target Markets (Initial)
Look for:
- BTC price predictions (15m/1h markets)
- ETH price predictions (15m/1h markets)
- SOL movements (if available)
- Political markets with volume

Avoid:
- Illiquid markets
- Extreme probabilities (>90% or <10%)
- Complex multi-outcome markets
- Low reward markets (<$10/day)

## Execution Steps

### Setup (30 min)
1. ✅ Phantom wallet already funded ($79.84 USDC)
2. Navigate to polymarket.com/rewards
3. Browse eligible markets (100+ options)
4. Filter by daily rewards amount
5. Identify 2-3 target markets

### Day 1 - Place Orders (60 min)
1. **Market 1:** Place Yes + No orders (market-making)
   - Example: BTC >$100K in 15m
   - Yes order: 48% ($25)
   - No order: 52% ($25)
   - Spread: 4% (profit if filled)

2. **Market 2:** Repeat process
   - Different asset or timeframe
   - Same balanced approach

3. **Document:**
   - Market IDs
   - Order sizes
   - Entry prices
   - Expected daily reward
   - Timestamp

### Day 2-3 - Monitor (2x 30 min)
1. Check if orders filled
2. Re-place if filled (maintain LP position)
3. Monitor rewards page (midnight UTC updates)
4. Track actual earnings vs. claimed rewards
5. Adjust if needed (move capital to better markets)

### Day 4 - Results (60 min)
1. Calculate total rewards earned
2. Calculate net profit (rewards - fees - slippage)
3. Extrapolate to monthly/yearly
4. Document lessons learned

## Success Metrics

### Profitable Validation
- **Minimum:** $5-10 in 3 days ($50-100/month)
- **Target:** $15-25 in 3 days ($150-250/month)
- **Excellent:** $30+ in 3 days ($300+/month)

### Scale Potential
If profitable:
- $100 → $50-250/month = **50-250% monthly ROI**
- $1,000 capital = $500-2,500/month
- $5,000 capital = $2,500-12,500/month

## Build Decision

### ✅ BUILD BOT IF:
- Earned $5+ in 3 days (profitable)
- Process is repeatable (not luck)
- Multiple markets available (scalable)
- Low technical barriers (automation feasible)

### ❌ ABANDON IF:
- <$5 in 3 days (not worth time)
- Rewards are fake/not distributed
- Markets are illiquid (can't place orders)
- Too much manual intervention required

## Bot Design (if validated)

### Features
1. **Market scanner:** Monitor rewards page (100+ markets)
2. **Smart selection:** High rewards + low competition + balanced odds
3. **Auto market-making:** Place simultaneous Yes/No orders
4. **Position maintenance:** Re-balance if filled
5. **Reward tracking:** Monitor daily earnings (midnight UTC)
6. **Reinvestment:** Compound profits automatically

### Tech Stack
- Unbrowse.ai (internal Polymarket API)
- Python script (similar to current bots)
- Phantom wallet integration (existing auth)
- Telegram alerts (earnings updates)

### Build Timeline
- **Day 1-2:** Unbrowse capture (Polymarket rewards API)
- **Day 3-4:** Bot logic (market selection + order placement)
- **Day 5:** Testing + deployment
- **Total:** 5 days from validation to live bot

## Revenue Model

### Option A: SaaS Subscription
- $199/month per user
- User provides capital + wallet
- Bot runs on their machine
- We support + optimize

### Option B: Profit Sharing
- Free bot
- 20-30% of rewards to us
- Higher user adoption
- Passive income at scale

### Option C: Premium Tier Add-on
- Add to existing $749/month package
- Bundled with trading bots
- "Complete passive income suite"

## Risk Assessment

### What Could Go Wrong?
1. **Rewards are fake** (not distributed as claimed)
   - Mitigation: Test with small amount first
2. **Markets are illiquid** (can't place orders)
   - Mitigation: Choose high-volume markets only
3. **Fees eat profits** (gas + spread losses)
   - Mitigation: Calculate break-even before placing
4. **Competition increases** (others discover opportunity)
   - Mitigation: First-mover advantage (build fast)
5. **Polymarket changes rules** (rewards reduced/eliminated)
   - Mitigation: Diversify income streams

## Documentation

### Track Everything:
- Market names + IDs
- Order sizes + prices
- Fill times
- Rewards earned (timestamp)
- Total profit/loss
- Screenshots of rewards page

### Share Transparently:
- Daily updates in builder's journal
- Tweet results (win or lose)
- Moltbook post if profitable
- Add to website if we build bot

## Next Steps

**Tomorrow Morning (Feb 6):**
1. Navigate to polymarket.com/rewards
2. Identify 2-3 high-reward markets
3. Place $100 in LP positions (market-making)
4. Document everything
5. Wait for Day 2 results

**Decision Point (Feb 9):**
- If profitable → Build bot immediately (5-day sprint)
- If not profitable → Abandon, focus on trading bots

---

**Status:** Ready to execute
**Capital:** Available ($79.84 USDC in Phantom)
**Timeline:** 3-day validation + 5-day build (if validated)
**Downside:** Lose $100 testing (acceptable risk)
**Upside:** Discover $500-2,500/month passive income stream

Let's validate tomorrow. 🚀
