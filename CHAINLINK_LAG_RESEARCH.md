# Polymarket Chainlink Lag Arbitrage - Research Document

**Date:** February 5, 2026  
**Mission:** Exploit Chainlink oracle lag vs Binance real-time prices on Polymarket 15-min markets

---

## 🎯 EXECUTIVE SUMMARY

**The Opportunity:**
- Polymarket's 15-minute BTC/ETH markets settle based on **Chainlink Data Streams**, not spot prices
- Binance provides **real-time prices** with ~350ms latency
- When Binance shows significant price movement, there's a window to trade BEFORE the market fully adjusts
- The edge comes from knowing Chainlink will eventually reflect Binance's move at settlement

**Expected Edge:**
- **Information advantage:** 5-60 seconds ahead of market consensus
- **Target win rate:** 65-75% (if lag exploit works consistently)
- **Risk:** Fees (0.2-1.6%), slippage, fast market adjustments

---

## 📊 MARKET MECHANICS

### How Polymarket 15-Min Markets Work

**Market Type:** Binary prediction - "Will {ASSET} go UP or DOWN in next 15 minutes?"

**Time Windows:** Markets created every 15 minutes at :00, :15, :30, :45

**Settlement Logic:**
```
IF Chainlink_Price_at_END >= Chainlink_Price_at_START:
    Outcome = "UP" ✅
ELSE:
    Outcome = "DOWN" ✅
```

**Resolution Source:** 
- **BTC:** https://data.chain.link/streams/btc-usd (Chainlink Data Streams)
- **ETH:** https://data.chain.link/streams/eth-usd (Chainlink Data Streams)

**Key Insight:** Market settles based on **Chainlink data**, NOT Binance/Coinbase/spot markets!

---

## ⏱️ CHAINLINK DATA STREAMS - LAG ANALYSIS

### What Are Data Streams?

Chainlink Data Streams are **pull-based, low-latency oracle feeds**:
- **Traditional Feeds:** Push-based, update every ~30-60s or on 0.5% deviation
- **Data Streams:** Pull-based, sub-second updates, premium product

### Expected Update Frequency

**Data Streams (Premium):**
- **Latency:** 1-2 seconds typical
- **Update trigger:** Price deviation OR time threshold
- **Aggregation:** 16 oracle nodes must reach consensus

**Critical Question:** Does Polymarket pull continuously or at specific times?
- If **start/end snapshots:** Small lag window (~2-5 seconds)
- If **continuous monitoring:** Lag advantage minimal

### Historical Lag Patterns (Research Needed)

**To validate this strategy, we need:**
1. ✅ Confirmed Chainlink is used (DONE - verified in market rules)
2. ⏳ Measure actual lag between Binance move → Chainlink update
3. ⏳ Measure lag between Chainlink update → Polymarket odds adjustment
4. ⏳ Test if START/END prices are snapshots or rolling averages

**Hypothesis:** 
- Binance moves first (spot market)
- Chainlink updates 1-5 seconds later (oracle consensus)
- Polymarket odds adjust 5-30 seconds later (market participants)
- **Trading window:** 5-30 seconds after Binance move

---

## 📈 BINANCE VS CHAINLINK COMPARISON

### Binance (Real-Time Source)

**Advantages:**
- ✅ Ultra-low latency (~350ms REST, <100ms WebSocket)
- ✅ High liquidity, true spot price
- ✅ 24/7 continuous updates

**Data Source:**
- WebSocket: `wss://stream.binance.com:9443/ws/btcusdt@trade`
- REST: `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`

### Chainlink Data Streams

**Characteristics:**
- ⏱️ 1-2 second latency (oracle aggregation)
- 🔐 Requires authentication (premium)
- 📊 Aggregates from multiple CEXs (Binance, Coinbase, Kraken, etc.)

**Oracle Network (BTC/USD):**
- 16 oracle nodes
- Includes: Chainlink Labs, LinkPool, Fiews, Galaxy, etc.

### Price Divergence Examples

**Scenario 1: BTC Flash Move**
- **T+0s:** Breaking news → BTC spikes +0.8% on Binance
- **T+2s:** Chainlink oracles begin aggregating
- **T+5s:** Chainlink Data Stream updates
- **T+10s:** Polymarket market makers adjust odds
- **Trade window:** 0-10s to get favorable odds

**Scenario 2: Gradual Trend**
- **T+0-60s:** BTC gradually rises +0.4% on Binance
- **T+30s:** Chainlink updates reflect +0.2%
- **T+60s:** Chainlink catches up to +0.4%
- **Trade window:** Less exploitable (market adjusts smoothly)

---

## 🎲 STRATEGY BREAKDOWN

### Entry Conditions

**Minimum Requirements:**
1. ✅ Within first 5 minutes of 15-min window
2. ✅ Binance price moved ±0.3% or more from window START
3. ✅ Price momentum confirms direction (not just noise)
4. ✅ Market odds haven't fully adjusted yet

**Confidence Scoring:**
- **Magnitude:** Larger moves = higher confidence (max 1% = 100%)
- **Timing:** Earlier in window = better (5min window)
- **Momentum:** Sustained move vs spike

### Position Sizing

**Base Position:** $15 per trade

**Risk Management:**
- Stop trading after **3 consecutive losses**
- Maximum 1 trade per asset per 15-min window
- No martingale or position scaling

### Exit Strategy

**Paper Trading Mode:**
- Hold until settlement (end of 15-min window)
- Calculate P&L based on entry odds vs actual outcome

**Live Trading Mode (Future):**
- Monitor odds movement
- Consider early exit if odds move against us significantly
- Primary strategy: Hold to settlement

---

## 💰 PROFITABILITY ANALYSIS

### Fee Structure

**Polymarket 15-Min Markets:**
- **Taker fees:** 0.2% - 1.6% (varies by entry price/probability)
- **Gas fees:** ~$0.10-0.50 per trade (Polygon network)

**Break-Even Math:**
- For $15 trade at 50% odds (0.50 entry):
  - Max fee: 1.6% × $15 = $0.24
  - Gas: ~$0.20
  - **Total cost:** $0.44
  - **Need to win:** 50% + ($0.44/$15) = 52.9%

### Expected Value Calculation

**Scenario: 70% Win Rate (Optimistic)**
```
Expected value per trade:
  Win: $15 × 1.0 × 0.70 = $10.50
  Lose: $15 × 1.0 × 0.30 = -$4.50
  Fees: -$0.44
  EV = $10.50 - $4.50 - $0.44 = $5.56 per trade
  ROI = $5.56 / $15 = 37% per trade
```

**Scenario: 60% Win Rate (Realistic)**
```
Expected value per trade:
  Win: $15 × 1.0 × 0.60 = $9.00
  Lose: $15 × 1.0 × 0.40 = -$6.00
  Fees: -$0.44
  EV = $9.00 - $6.00 - $0.44 = $2.56 per trade
  ROI = $2.56 / $15 = 17% per trade
```

**Scenario: 55% Win Rate (Conservative)**
```
Expected value per trade:
  Win: $15 × 1.0 × 0.55 = $8.25
  Lose: $15 × 1.0 × 0.45 = -$6.75
  Fees: -$0.44
  EV = $8.25 - $6.75 - $0.44 = $1.06 per trade
  ROI = $1.06 / $15 = 7% per trade
```

**Breakeven:** 52.9% win rate

### Volume Potential

**Opportunities per day:**
- 15-min windows: 96 per day (24h × 4)
- Assets: BTC + ETH = 2
- Max theoretical: 192 trades/day
- **Realistic (±0.3% moves):** 10-20 trades/day
- **Daily P&L (60% WR):** 15 trades × $2.56 = $38.40

---

## ⚠️ RISKS & MITIGATIONS

### Key Risks

**1. Chainlink Updates Too Fast**
- **Risk:** Data Streams update in <1s, no exploitable lag
- **Mitigation:** Test in paper mode first, measure actual lag
- **Fallback:** Focus on market participant lag, not oracle lag

**2. Market Efficiency**
- **Risk:** Professional market makers already price in expected moves
- **Mitigation:** Only trade when odds haven't fully adjusted
- **Indicator:** Check order book depth

**3. Fee Erosion**
- **Risk:** 1.6% fees on thin edges = negative EV
- **Mitigation:** Only enter at favorable odds (<0.45 or >0.55)

**4. Binance as Single Source**
- **Risk:** Binance flash crashes or bad data
- **Mitigation:** Cross-check with Coinbase/Kraken
- **Implementation:** Add sanity checks (max 2% moves/minute)

**5. Whale Manipulation**
- **Risk:** Large orders moving Polymarket odds artificially
- **Mitigation:** Monitor order flow, avoid illiquid windows

---

## 🧪 TESTING PLAN

### Phase 1: Paper Trading (1-2 hours)

**Goals:**
1. ✅ Verify Binance WebSocket works
2. ✅ Confirm 15-min window tracking
3. ✅ Test signal generation
4. ⏳ Measure actual win rate on paper trades

**Success Criteria:**
- 50+ paper trades executed
- Win rate >55%
- No technical errors

### Phase 2: Lag Measurement (Parallel)

**Data to collect:**
1. Binance price at START of each 15-min window
2. Estimated Chainlink price at START (via API or on-chain)
3. Binance price at END
4. Chainlink settlement price (from Polymarket resolution)

**Analysis:**
- Correlation between Binance START/END and outcomes
- Lag quantification

### Phase 3: Micro-Position Testing ($5 trades)

**Before going live with $15:**
- Execute 10-20 real trades at $5 each
- Validate wallet/API integration
- Confirm actual fees match expectations

---

## 🔧 TECHNICAL IMPLEMENTATION

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CHAINLINK LAG BOT                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Binance WebSocket] ──► [Price Monitor]               │
│         ▼                       │                       │
│  [15-Min Window Tracker] ◄──────┘                      │
│         │                                               │
│         ▼                                               │
│  [Signal Generator]                                     │
│         │                                               │
│         ├──► Confidence > 60% ──► [Trade Executor]     │
│         │                               │               │
│         └──► [Risk Manager] ◄───────────┘              │
│                   │                                     │
│                   ▼                                     │
│         [Telegram Alerts] ◄─── [Trade Logger]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components Built

1. ✅ **Binance WebSocket Monitor** - Real-time price tracking
2. ✅ **Window Tracker** - 15-min market windows
3. ✅ **Signal Generator** - Confidence-based signals
4. ✅ **Risk Manager** - Stop-loss, position limits
5. ✅ **Telegram Alerts** - Trade notifications
6. ⏳ **Polymarket Executor** - Trade execution (TODO)

---

## 📋 NEXT STEPS

### To Complete Before Midnight

1. ✅ Core bot logic (DONE)
2. ⏳ Add Polymarket CLOB API integration
3. ⏳ Add wallet integration (Phantom/private key)
4. ⏳ Run 1 hour of paper trading
5. ⏳ Analyze results
6. ⏳ Write deployment guide

### Future Enhancements

- **Multi-asset support:** Add SOL, XRP
- **Advanced signals:** Order flow analysis, whale detection
- **Dynamic position sizing:** Based on confidence score
- **Early exit:** Sell position before settlement if profitable

---

## 🎯 CONCLUSION

**The Edge:**
- Information asymmetry: Binance → Chainlink → Market
- Timing advantage: 5-30 seconds
- Target: 60-70% win rate

**Viability:**
- ✅ Theoretical: Strong (if lag exists)
- ⏳ Practical: Testing required (paper trading validation)
- ⚠️ Fee-sensitive: Need >53% win rate to profit

**Recommendation:**
1. Run paper trading for 1-2 hours
2. Measure actual win rate
3. If >58%, deploy with $5 positions
4. If >65% after 20 trades, scale to $15

**Risk Level:** MEDIUM (paper trading first, small positions initially)
