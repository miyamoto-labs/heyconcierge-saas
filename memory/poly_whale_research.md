# Polymarket Whale Research & Copy Trading Analysis
**Date:** 2026-02-08
**Status:** Bot deployed in paper mode, monitoring continuously

## Key Findings

### The Polymarket Landscape (Feb 2026)
- **Only 0.51% of Polymarket wallets have profits >$1,000** — this is a winner-take-most market
- Top 10 traders have **$157M+ combined lifetime P&L**
- Average top-100 win rate: **58.3%**
- Arbitrageurs extracted **$40M+ in "risk-free" profits** between April 2024-2025
- Top 3 arb wallets alone made **$4.2M**

### Top Whale Profiles

| Rank | Username | Est. P&L | Win Rate | Strategy |
|------|----------|----------|----------|----------|
| 1 | Theo4 (French Whale) | $22M ($85M cluster) | 67% | Private polls, political bets |
| 2 | Fredi9999 | $16.6M | 67% | Same cluster as Theo4 |
| 3 | kch123 | $9.4M | 52% | Market making ($229M vol) |
| 4 | Len9311238 | $8.7M | 65% | Political concentrated |
| 5 | zxgngl | $7.8M | 67% | Theo cluster account 3 |
| 6 | RepTrump | $7.5M | 70% | Political conviction |
| 7 | Beachboy4 | $6.1M (1 day!) | 54% | Sports (NFL, NBA, EPL) |
| 8 | ImJustKen | $2.4M | 72% | Political specialist |
| 9 | fengdubiying | $2.9M | 61% | Esports specialist |
| 10 | Walrus | $1.3M | 65% | Crypto prices |
| 11 | Domer | $1.2M | 69% | Political specialist |
| 12 | Axios | $200K | 96% | Mentions markets (incredible WR) |

### The French Whale (Théo) — The Greatest Polymarket Trade Ever
- **Made ~$85M** betting on Trump winning 2024 election
- Used **11+ accounts**: Theo4, Fredi9999, PrincessCaro, Michie, zxgngl, and more
- **Strategy**: Commissioned private YouGov polls in PA, MI, WI
  - Asked "who do you think your *neighbors* are voting for?" instead of direct voting intention
  - This captured "shy Trump voters" that standard polls missed
- **Entry**: Bought Trump YES at ~40¢ ($30-40M total invested)
- **Exit**: All positions settled at $1.00 after Trump won
- Liquidated stocks, bonds, savings to raise the capital
- French national, worked as trader in the US previously

### Profitable Strategy Archetypes
1. **Information Edge** (highest alpha) — Private polling, expert networks, insider knowledge
2. **Market Making** — Liquidity provision, capturing bid-ask spreads (~0.5-2%)
3. **Cross-Platform Arbitrage** — Polymarket vs Kalshi price discrepancies
4. **Settlement Arbitrage** — Buying near-certain outcomes below $1.00
5. **Whale Copy Trading** — Following proven wallets with >70% win rate

### Copy Trading Speed Requirements
- Most markets: **30-60 seconds is sufficient**
- Political/major events: Minutes is fine (positions held for days/weeks)
- Sports: Need to be faster (minutes), but markets are more liquid
- Only news-scalping needs sub-10s speed

## Bot Architecture

### polymarket_whale_copier.py
**5 strategies in one bot:**
1. **Whale Copy** (35% weight) — Monitors 6 whale wallets with known addresses via Data API
2. **Smart Money** (25%) — Finds consensus among 3+ wallets with >70% win rate
3. **Contrarian** (15%) — Detects whale vs retail divergence on high-volume markets
4. **Event-Driven** (15%) — Volume spike detection (3x daily average = signal)
5. **Market Making** (10%) — Bid-ask spread capture on >5% spread markets

### Position Sizing: Quarter-Kelly Criterion
- Uses whale's historical win rate + trust score
- Capped at 10% per trade, 30% total exposure
- Conservative: actually uses 5% max per trade

### APIs Used
- **Gamma API**: Market discovery and metadata
- **CLOB API**: Prices, orderbooks, spreads, trading
- **Data API**: User positions, activity, trade history
- **WebSocket**: Real-time orderbook updates (available but not yet implemented)

### Risk Management
- Paper trading by default (PAPER_TRADING = True)
- Max 10% bankroll per trade
- Max 30% total exposure
- Max 20 trades per day
- Stop-loss at 5% daily drawdown
- 1 request/second rate limiting on API calls

## Known Wallet Addresses

| Username | Proxy Wallet Address |
|----------|---------------------|
| Theo4 | 0x56687bf447db6ffa42ffe2204a05edaa20f55839 |
| Fredi9999 | 0x3b90fb6b60c8e8f57f9e0a8d35fe4f7c30c07e91 |
| ImJustKen | 0x9d84ce0306f8551e02efef1680475fc0f1dc1344 |
| fengdubiying | 0x17db3fcd93ba12d38382a0cade24b200185c5f6d |
| Walrus | 0xfde62dd29574bab38f9f3e4f1da3c1b98c67dfb8 |
| Domer | 0x7bce56c30bb2e09c33ed0b4a68a5c0b6e8c6dc97 |

## Current Bot Status
- **Deployed**: 2026-02-08 17:20 CET
- **Mode**: Paper trading, $1,000 bankroll
- **Poll interval**: 120 seconds
- **Active strategies**: All 5
- **Initial scan results**: Successfully detected whale activity from Theo4, ImJustKen, fengdubiying
- **Issue**: Data API rate limiting at ~1 req/s — added backoff handling

## Next Steps
- [ ] Resolve more wallet addresses (kch123, Len9311238, RepTrump, Beachboy4, Axios)
- [ ] Implement WebSocket monitoring for lower latency
- [ ] Add on-chain monitoring via Polygon RPC as backup
- [ ] Track bot paper P&L over 48 hours before considering live
- [ ] Research PolyTrack API for automated whale discovery
- [ ] Consider using Allium on-chain data API for historical whale analysis
