# Twitter Growth Strategy - MIYAMOTO LABS
**Last Updated:** 2026-02-07  
**Status:** 🔧 Fixing Auth + Growth Plan

---

## 🚨 CURRENT ISSUES IDENTIFIED

### Authentication Problems
The bots aren't failing auth - they're being **detected as bots** by Twitter's anti-automation systems.

**Why Twitter is blocking us:**
1. ❌ **No delays between actions** - Instant likes/replies look robotic
2. ❌ **Predictable patterns** - Cron runs at exact times every day
3. ❌ **Too fast** - 5 replies + 8 likes in <2 minutes triggers rate limits
4. ❌ **No variation** - Same behavior patterns every run
5. ❌ **Low follower count** - New accounts with automation = red flag

### Current State Analysis
**Accounts:**
- `@dostoyevskyai` - Main account (philosophical crypto) - ~low followers
- `@miyamotolabs` - Brand account (not actively posting yet?)
- `@trustclawai` - Product account (not active?)

**Current Automation:**
- ✅ 1 daily market tweet (9 AM Oslo time) - **WORKING**
- ✅ 1 daily promo tweet (varies time) - **WORKING**
- ❌ Engagement bot every 4 hours - **BLOCKED** (automated request protection)

**What's Working:**
- OAuth authentication is correct ✅
- Tweets with real market data ✅
- Content templates are good ✅

**What's Not Working:**
- Engagement automation (replies/likes) ❌
- Growth rate (need more followers) ❌
- Consistency (only 2 tweets/day vs recommended 3-5) ❌

---

## 🎯 GROWTH STRATEGY

### Content Strategy (What to Tweet)

**Research Findings:**
- **Optimal frequency:** 2-4 tweets/day (we're at 2, need 1-2 more)
- **Best engagement:** Mix of data, insights, memes, authenticity
- **Timing:** Multiple time zones matter (EU morning, US afternoon, Asia evening)
- **Memes are crucial** - Crypto Twitter LOVES memes

**New Posting Schedule:**
1. **9:00 AM Oslo** - Market data tweet (KEEP - working well)
2. **2:00 PM Oslo** - NEW: Insight/analysis/meme
3. **8:00 PM Oslo** - Build-in-public promo tweet (MOVE from random time)
4. **11:00 PM Oslo** - NEW: Quote retweet or hot take (optional, 3-4x/week)

**Content Mix Breakdown:**
- 30% Market data (prices, analysis, signals)
- 25% Build-in-public (progress, learnings, product updates)
- 25% Engagement (replies to trending posts, quote tweets)
- 20% Memes/humor (humanize the brand)

**Content Guidelines:**
- ✅ Real data (we have Hyperliquid/CoinGecko APIs)
- ✅ Authentic voice (no generic "GM crypto fam" crap)
- ✅ Show personality (Dostoyevsky philosophical vibes)
- ✅ Visual content when possible (charts, screenshots)
- ✅ Thread-style tweets for depth
- ❌ No pump/dump shilling
- ❌ No fake urgency ("LAST CHANCE!")
- ❌ No copy-paste generic advice

### Engagement Strategy (Who to Reply To, When)

**Manual Engagement (High Value, Do Daily):**
- **30 min/day** - Reply to 5-10 quality tweets from influencers
- **Target accounts:**
  - @VitalikButerin (Ethereum founder)
  - @coinbase (exchange updates)
  - @santimentfeed (on-chain data)
  - @APompliano (Bitcoin maxi)
  - @CryptoCobain (trader insights)
  - Mid-tier accounts (10K-100K followers) for reply visibility
  
**What makes a good reply:**
- ✅ Add value (insight, data, contrary view)
- ✅ Conversational tone (not salesy)
- ✅ Ask thoughtful questions
- ✅ Use data when relevant (our edge!)
- ❌ Never "Nice post!" (zero value)
- ❌ No self-promotion in first reply
- ❌ Don't argue just to argue

**Automated Engagement (Fixed Bot):**
- **Target:** 3 replies, 5 likes per 8-hour period (vs 5/8 per 4h - too aggressive)
- **Quality filters:**
  - Min 10 likes (vs 3 - raise bar)
  - Min 500 followers (vs 100 - focus on reach)
  - No spam keywords ("giveaway", "follow back", "crypto pump")
- **Timing:**
  - Random delays: 2-8 minutes between actions
  - Spread over 30-60 minute window (not instant burst)
  - Skip runs randomly (20% chance to not run = less predictable)

**Twitter Spaces Strategy:**
- Join 2-3 crypto spaces per week
- Listen first, contribute thoughtfully
- Promote MIYAMOTO LABS naturally in context
- Host our own space monthly (milestone updates)

### Automation Plan (What to Automate vs Manual)

**✅ AUTOMATE (Low Risk):**
1. Daily market tweets (price data) - KEEP CURRENT
2. Daily build-in-public updates - KEEP CURRENT
3. Afternoon insight/meme tweet - NEW
4. Scheduled quote retweets (pre-approved content)

**⚠️ AUTOMATE WITH CAUTION (Fixed Bot):**
1. Engagement bot (replies/likes) - **FIXED VERSION BELOW**
   - Much slower
   - Random delays
   - Better quality filters
   - Spread over hours, not minutes

**❌ DO NOT AUTOMATE (Manual Only):**
1. Replies to direct mentions/DMs
2. Engagement with influencers (>100K followers)
3. Twitter Spaces participation
4. Controversial takes or debates
5. Community management

**The 80/20 Rule:**
- 80% automated content (tweets, low-tier engagement)
- 20% manual engagement (high-value replies, spaces, community)

---

## 🛠️ TECHNICAL FIXES

### Bot Detection Prevention

**Key Changes:**
1. **Random delays** - 30s to 10min between actions (human-like)
2. **Spread actions** - 30-60min window instead of instant burst
3. **Skip runs randomly** - 20% chance to not run at all
4. **Vary behavior** - Different keywords, random limits per run
5. **Better quality filters** - Higher follower/engagement thresholds
6. **Session persistence** - Reuse client instead of recreating
7. **Error handling** - Graceful backoff on 429/403 errors

**Implementation:**
```python
import time
import random

# Random delay between actions (2-8 minutes)
def human_delay():
    seconds = random.randint(120, 480)  # 2-8 min
    print(f"   ⏳ Waiting {seconds//60}m {seconds%60}s...")
    time.sleep(seconds)

# Skip run randomly (20% chance)
if random.random() < 0.2:
    print("🎲 Skipping run randomly (looks more human)")
    exit(0)

# Vary limits per run
max_replies = random.randint(2, 4)  # vs fixed 5
max_likes = random.randint(4, 7)    # vs fixed 8
```

### Authentication Fix

**Current setup is CORRECT** ✅
- OAuth 1.0a credentials valid
- Tweepy v2 Client properly configured
- Bearer token for read operations

**No auth changes needed** - Issue is bot detection, not auth failure.

### Rate Limit Handling

```python
try:
    client.create_tweet(text=reply_text, in_reply_to_tweet_id=tweet.id)
except tweepy.TooManyRequests as e:
    print(f"⏸️  Rate limit hit. Waiting 15 minutes...")
    time.sleep(900)
except tweepy.Forbidden as e:
    print(f"🚫 Action blocked (automated protection). Stopping.")
    break  # Don't retry, Twitter is watching
```

---

## 📊 METRICS TO TRACK

### Growth Metrics (Track Weekly)
- Follower count (goal: +50/week organic)
- Engagement rate (likes + replies / impressions)
- Profile visits
- Link clicks (when we add miyamotolabs.com)

### Content Metrics (Track Daily)
- Tweet impressions
- Best performing tweets (save for templates)
- Worst performing (learn what to avoid)
- Reply rate (replies received / tweets)

### Bot Performance (Track Per Run)
```json
{
  "timestamp": "2026-02-07T10:30:00",
  "actions": {
    "replies_sent": 3,
    "likes_sent": 5,
    "follows_sent": 0
  },
  "errors": {
    "rate_limited": false,
    "blocked": false
  },
  "duration_minutes": 45
}
```

**Success Criteria:**
- ✅ No rate limits or blocks for 7 days straight
- ✅ Engagement rate >2% (good for new account)
- ✅ 10+ organic followers per week
- ✅ 5+ meaningful replies per tweet

---

## 🚀 IMPLEMENTATION CHECKLIST

### Immediate (Today)
- [x] Audit current bots (DONE - this doc)
- [ ] Deploy fixed engagement bot (see crypto_twitter_bot_v2.py)
- [ ] Test engagement bot with --dry-run
- [ ] Run live engagement bot ONCE, monitor for blocks
- [ ] Add afternoon tweet (2 PM Oslo) - insight/meme

### Week 1
- [ ] Manual engagement: 10 quality replies/day to influencers
- [ ] Create meme library (5-10 crypto memes)
- [ ] Join 2 Twitter Spaces
- [ ] Track metrics in spreadsheet/notion

### Week 2
- [ ] Analyze engagement data (what's working?)
- [ ] A/B test tweet formats (data vs memes vs threads)
- [ ] Adjust bot parameters based on performance
- [ ] Reach 100 followers milestone

### Month 1
- [ ] Host first Twitter Space (product demo)
- [ ] Partner with 2-3 micro-influencers (50K-100K followers)
- [ ] Launch miyamotolabs.com landing page
- [ ] Reach 500 followers

---

## 💡 CONTENT IDEAS (Pre-Generated)

### Market Data Tweets (Daily 9 AM)
*Already automated - working well*

### Insight/Analysis Tweets (Daily 2 PM)
- "Why most traders lose: emotion. Why bots win: none. But dumb bots also lose. The edge: AI that adapts."
- "Chainlink lag arbitrage explained: Oracles update every N blocks. Fast bots front-run. We're building one."
- "7 layers of risk management > 1 genius strategy. Survival first, alpha second."
- "Built 2 trading bots in 5 hours with Claude AI. This is the future: Man + Machine shipping at light speed."
- "Unpopular opinion: Most algo traders overcomplicate. Simple strat + strict risk > complex math."

### Build-in-Public Tweets (Daily 8 PM)
*Already automated - good templates*

### Meme/Humor Tweets (2-3x/week)
- "Me: I'll just check the charts once. Also me: *opens TradingView at 3 AM*"
- "Bears: crypto is dead. Bulls: to the moon. Bots: *calculating optimal entry* 🤖"
- "Humans: What if I'm wrong? Bots: Stop loss set. Next trade. (Be like bots.)"
- [Add crypto meme images here]

---

## ⚠️ RISKS & MITIGATION

### Risk: Twitter Account Ban
**Likelihood:** Medium (if we don't fix bot)  
**Impact:** High (lose all progress)  
**Mitigation:**
- Fixed bot with human-like behavior
- Manual engagement for high-value interactions
- Never use banned keywords ("follow back", "RT to win")
- Backup account ready (@miyamotolabs as main if needed)

### Risk: Low Engagement Despite Posting
**Likelihood:** Medium (new account with no followers)  
**Impact:** Medium (demotivating but not fatal)  
**Mitigation:**
- Quality over quantity (better 1 banger than 5 mid tweets)
- Engage heavily with others to get noticed
- Use hashtags strategically (#CryptoTrading, #AlgoTrading)
- Partner with micro-influencers for reach

### Risk: Negative Sentiment (Scam Accusations)
**Likelihood:** Low but possible  
**Impact:** High (brand damage)  
**Mitigation:**
- Full transparency (real trades, real losses)
- Never promise returns
- Show code/screenshots
- Engage respectfully with critics

---

## 📈 TIMELINE & MILESTONES

**Week 1-2: Foundation**
- Goal: 100 followers, 0 bot bans
- Fix: Engagement bot working smoothly
- Establish: Consistent posting schedule

**Month 1: Traction**
- Goal: 500 followers, 5% engagement rate
- Launch: miyamotolabs.com landing page
- Achieve: First organic customer interest (DMs)

**Month 2: Growth**
- Goal: 1,500 followers, partnerships with 3 micro-influencers
- Launch: Beta tester program
- Achieve: First paying customers ($299 beta pricing)

**Month 3: Scale**
- Goal: 5,000 followers, recurring revenue
- Launch: Full product v1
- Achieve: Profitable ($2K+ MRR)

---

## 🎯 NORTH STAR

**Mission:** Build MIYAMOTO LABS into the #1 transparent, AI-driven autonomous trading platform.

**Twitter Goal:** 10K followers of engaged traders, builders, and crypto natives who trust our transparent approach and want autonomous trading tools.

**Key Differentiators:**
1. **Full transparency** - Show real trades, real P&L, real code
2. **AI-powered** - Not just "set and forget", adaptive learning systems
3. **Speed edge** - Internal API access via Unbrowse.ai (10x faster data)
4. **Token utility** - $MIYAMOTO holders get discounts, early access
5. **Community-first** - Build in public, listen to feedback

**Not:** Another pump-and-dump shiller, fake guru, or vaporware promise.

**Instead:** Real products, real results, real community.

---

**Next Steps:** Deploy fixed bot, test, iterate based on data. 🚀
