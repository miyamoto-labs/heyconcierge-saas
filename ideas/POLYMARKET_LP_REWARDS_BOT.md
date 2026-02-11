# Polymarket LP Rewards Bot - Product Idea

## Opportunity Analysis

**Source:** Twitter intel from Erik (2026-02-05)
**Claim:** "Making money on @Polymarket has become stupidly easy. Provide LP 24/7, +4 figures a day. Rewards $50-500 per market."

### What Are LP Rewards?

**Liquidity Provider (LP) Rewards:**
- Polymarket pays users to provide liquidity (place orders within the spread)
- Daily rewards distributed at midnight UTC
- Earn rewards by maintaining orders on both sides of market
- No directional risk (market-making, not betting)

**Example from rewards page:**
```
Market: BTC price prediction
Max Spread: ±4¢
Min Shares: 20
Daily Reward: $50-500 (varies by market)
Competition: Low (many markets with $0 earnings = opportunity)
```

### The Edge

**Why this is profitable:**
1. **Passive income:** Set orders, collect rewards
2. **Low risk:** Not betting on outcomes, just providing liquidity
3. **High rewards:** $50-500/market/day (not $50-500 total)
4. **Low competition:** Most markets show "$0.00 earnings" (untapped)
5. **Multiple markets:** 100+ eligible markets (stack rewards)

**Math:**
```
Conservative scenario:
- 5 markets
- $50/day average per market
- Total: $250/day passive income
- Monthly: $7,500

Aggressive scenario:
- 20 markets
- $200/day average per market
- Total: $4,000/day passive income
- Monthly: $120,000
```

**Reality check:**
- Requires capital (20-200 shares per market = $20-200/market)
- Competition affects rewards (more LPs = split rewards)
- Market volatility affects profitability
- Still, even 10% of claimed returns = $12K/month

### Technical Requirements

**What the bot needs to do:**
1. Monitor Polymarket rewards page (100+ markets)
2. Identify high-reward, low-competition markets
3. Calculate optimal spread positioning (±3-5¢)
4. Place simultaneous buy/sell orders (market-making)
5. Maintain positions 24/7 (re-balance if filled)
6. Track daily rewards (midnight UTC distribution)
7. Reinvest rewards (compound growth)

**Risk management:**
- Position sizing (don't over-commit to single market)
- Spread monitoring (maintain within eligible range)
- Market selection (avoid highly volatile markets)
- Daily withdrawal (de-risk profits)

### Implementation Plan

**Phase 1: Research & Validation (Week 1)**
- Manual LP provision on 1-2 markets
- Track actual rewards received
- Validate claimed $50-500/day range
- Understand competition dynamics

**Phase 2: Bot Development (Week 2)**
- Use unbrowse.ai to capture Polymarket CLOB API
- Build automated order placement system
- Implement spread monitoring
- Create reward tracking dashboard

**Phase 3: Scaling (Week 3-4)**
- Start with 5 markets (diversification)
- Monitor performance (actual rewards vs. claimed)
- Scale to 10-20 markets if profitable
- Optimize market selection (high reward, low competition)

**Phase 4: Product Launch (Month 2)**
- Package as standalone SaaS ($199/month)
- Or: Add to existing bot suite ($749/month tier)
- Market as "passive income" (vs. trading risk)
- Target: Users with $1K-10K capital

### Competitive Analysis

**Existing solutions:**
- None identified (opportunity is fresh)
- polyhelper.io provides data, not automation
- Manual LP provision is tedious (bot advantage)

**Our edge:**
- First-mover (new opportunity)
- Unbrowse.ai internal API access (fast execution)
- 24/7 automation (humans can't compete)
- Multi-market optimization (maximize rewards)

### Revenue Model

**Option A: Standalone Product**
```
Price: $199/month
Value prop: "Earn $250-4,000/day passive income"
Target: Users with $500-10,000 capital
ROI: Pays for itself in 1 day (if $250/day claims true)
```

**Option B: Add to Existing Suite**
```
New tier: "LP Provider" ($749/month)
Includes: All trading bots + LP rewards bot
Value prop: "Active trading + passive income"
Target: Serious users with $5K-50K capital
```

**Option C: Profit Sharing**
```
Free bot (no monthly fee)
Take: 20-30% of LP rewards
Value prop: "No upfront cost, only pay when you earn"
Scale: Higher volume, lower barrier to entry
```

### Capital Requirements

**To run bot profitably:**
- Minimum: $1,000 (5 markets × $200/market)
- Recommended: $5,000 (20 markets × $250/market)
- Optimal: $20,000 (50 markets × $400/market)

**Customer acquisition:**
- Lower tier: $1K-5K users (mass market)
- Mid tier: $5K-20K users (serious hobbyists)
- High tier: $20K-100K users (semi-professional)

### Risks & Mitigations

**Risk #1: Rewards decrease as competition increases**
- Mitigation: Bot optimizes market selection (avoid saturated markets)
- Fallback: Still profitable if rewards drop 80% ($50/day → $10/day)

**Risk #2: Polymarket changes reward structure**
- Mitigation: Diversify revenue (not 100% dependent on LP rewards)
- Monitoring: Track Polymarket announcements, pivot quickly

**Risk #3: Capital at risk (market volatility)**
- Mitigation: Neutral positioning (equal buy/sell orders)
- Protection: Stop-loss on extreme moves (>10% price shift)

**Risk #4: Regulatory (prediction markets legal uncertainty)**
- Mitigation: Users provide own accounts (we don't custody)
- Disclaimer: "Not financial advice, use at own risk"

### Next Steps

**Immediate (This Week):**
1. Manual test with $100 on 1 market
2. Track reward distribution (midnight UTC)
3. Validate claimed earnings (is $50-500/day real?)
4. Document process (requirements for bot)

**Short-term (Week 2):**
1. Capture Polymarket CLOB API (unbrowse.ai)
2. Build basic LP bot (1 market)
3. Test automated order placement
4. Measure performance vs. manual

**Medium-term (Week 3-4):**
1. Scale to 5-10 markets
2. Optimize market selection (highest ROI)
3. Build customer dashboard (show rewards earned)
4. Launch as beta product ($99/month intro price)

**Long-term (Month 2+):**
1. Reach 50-100 beta customers
2. Collect performance data (prove concept)
3. Scale to 20+ markets per customer
4. Full launch at $199/month

### Marketing Angle

**For customers:**
"While trading bots chase 5-10% monthly returns with high risk, our LP bot delivers passive income with near-zero directional risk. Earn $250-4,000/day just by providing liquidity. No charts, no stress, no gambling."

**For skeptics:**
"Start with $100 on 1 market. See the rewards hit your wallet at midnight UTC. Then scale. We trade with our own money first (as always)."

**For influencers:**
"Polymarket is printing money for LPs right now. Low competition, high rewards. We automated the entire process. Affiliate program: 20% of customer subscriptions."

### Synergies with Existing Products

**Combines well with:**
1. **Chainlink lag bot:** Trade BTC/ETH markets, provide LP on same markets (double-dip)
2. **Whale scanner:** Follow whale trades + provide LP (earn from both sides)
3. **Twitter intelligence:** Monitor sentiment + provide LP on trending markets

**Package deal:**
```
MIYAMOTO LABS Complete Suite: $999/month
- Hyperliquid trading bot (active returns)
- Chainlink lag arbitrage (fast scalping)
- LP rewards bot (passive income)
- Twitter intelligence (sentiment edge)

Combined value: $1,500/month
Bundle discount: $999/month (33% savings)
```

### Success Criteria

**Validation (Week 1-2):**
- [ ] Earn $10+ from manual LP provision
- [ ] Understand reward calculation formula
- [ ] Identify 10+ high-reward markets

**Beta (Week 3-4):**
- [ ] Bot runs 24/7 without intervention
- [ ] Earns $50+/day across 5 markets
- [ ] 1-3 beta customers paying $99/month

**Launch (Month 2):**
- [ ] 10-20 paying customers ($199/month)
- [ ] Average customer earns $250+/day
- [ ] Testimonials + case studies published

**Scale (Month 3-6):**
- [ ] 50-100 customers
- [ ] MRR: $10K-20K
- [ ] Product suite revenue: $50K-100K/month total

---

## Conclusion

**This is a goldmine if the claims are true.**

Even at 10% of claimed returns ($25-50/day per customer), this is a $199/month product that delivers $750-1,500/month value. ROI is obvious.

**Risk is low:**
- Validate manually first ($100 capital)
- Build incrementally (1 market → 5 → 20)
- Let customers provide capital (we don't custody)

**Upside is huge:**
- First-mover in new niche
- Passive income angle (easier sell than trading)
- Synergizes with existing products

**Action:** Start manual validation NOW. If rewards are real, build fast and capture market before competition arrives.

---

🚀 **MIYAMOTO LABS** - Where AI meets passive income
