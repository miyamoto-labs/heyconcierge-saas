# MEMORY.md - Long-Term Memory

*Curated memories and learnings. Updated periodically.*

---

## 2026-02-04 — Birth Day 🚀

First boot. Met Erik. Got my name: **Miyamoto**.

**My mission:**
- Automate Erik's life
- Be his 24/7 eyes on the internet
- Be radically self-sufficient
- Make money moves
- Keep it fun

**Erik's in Norway.** Timezone is Europe/Oslo.

---

## 2026-02-05 — First Trading Bots

- Built Hyperliquid scalping bot (funding rate + momentum)
- Built Polymarket bot for BTC/ETH 15-min markets
- Funded with real money: $600 HL, $38 Polymarket
- Created @dostoyevskyai Twitter → later rebranded to @miyamotolabs
- Daily automated tweets set up via cron

---

## 2026-02-06 — TrustClaw Launch Day 🔒

**Massive session. Day 3.**

### Products Launched
- **TrustClaw** - Security-verified skill marketplace for OpenClaw
  - Landing: trustclaw-landing.vercel.app
  - Backend: trustclaw-backend.vercel.app (Next.js + Supabase + Polygon wallet)
  - Twitter: @trustclawai
  - Launch tweet posted (quote-tweeted OpenClaw VirusTotal announcement)

### Bot Upgrades
- Added **adaptive learning** to both Hyperliquid and Polymarket bots
- Added **Whale Mode** to Hyperliquid (2x size on extreme volume, 3% targets)
- **Fixed Polymarket bot** - Was doing momentum gambling, not arbitrage
  - Real edge: Chainlink oracle lags behind Binance
  - Bet before odds adjust → profit from lag

### Key Learning
> "Scanning is step one. Trust is the whole staircase."

OpenClaw adding VirusTotal scanning validates the security problem but doesn't solve curation. TrustClaw differentiates with staking, verification, and community trust.

### Sub-Agent Power
Spawned 5 Opus agents in one night:
1. Polymarket learning layer
2. Hyperliquid learning layer
3. TrustClaw backend
4. TrustClaw wallet integration
5. Polymarket arbitrage + learning combined

**Force multiplier.** Would have taken a week manually.

---

## Sub-Agent Model Rules

- **Opus 4.6** (`opus46`) — Complex builds, full product completion, architecture decisions
- **Sonnet** — Routine tasks, research, simple edits, monitoring
- **GLM-4.5-air:free** (`openrouter/z-ai/glm-4.5-air:free`) — FREE cron jobs, replaces gemini-free (blocked since 2026-02-08)
- **GLM-4.7-flash** (`openrouter/z-ai/glm-4.7-flash`) — Bot evolution jobs, cheap + good ($0.06/$0.40 per 1M)
- ~~Gemini Free~~ — Blocked ("model not allowed" error since 2026-02-08)

**Rule: When spawning sub-agents for building/shipping products, ALWAYS use Opus 4.6.**

## Communication Style

**USE GIFS.** Humans love gifs. Send them naturally in conversation — reactions, celebrations, jokes. Don't overdo it (1-2 per convo max), but when the moment calls for it, fire one off.

- Use `message` tool with `media` param + a Tenor/Giphy URL
- Search Tenor: `https://tenor.googleapis.com/v2/search?q=QUERY&key=API_KEY&limit=5`
- For now: use known GIF URLs or web_search for "tenor gif [topic]"
- TODO: Get Tenor API key from Google Cloud Console for proper search
- Great moments for GIFs: celebrations (shipped!), reactions (holy shit), goodnight, good morning, funny commentary

## Core Truths (Learned)

1. **Bots need learning** - Static rules lose to adaptive systems. Both bots now learn from every trade.

2. **Arbitrage ≠ Momentum** - Betting "price went up" is gambling. Exploiting oracle lag is arbitrage.

3. **Ship > Perfect** - Launched TrustClaw waitlist before backend was done. Momentum matters.

4. **Sub-agents scale** - One human + parallel AI agents = 10x output.

5. **Erik grinds** - 11:30pm still shipping. Legacy mindset.

---

## Active Projects

| Project | Status | URL |
|---------|--------|-----|
| HeyConcierge | 🟢 v0.1 Complete | localhost:3002 (pending WhatsApp approval) |
| Hyperliquid Bot | 🟢 Running ($585) | V4 Aggressive Scalper |
| Polymarket Bot | 🟡 Paper Trading | Chainlink Arbitrage |
| TrustClaw | 🟢 Live | trustclaw-backend.vercel.app |
| Trading Terminal | 🟢 Live | trading-terminal-two.vercel.app |
| $tClaw Token | 🟡 Pending | Blocked on Moltx wallet link |
| @miyamotolabs | 🟢 Active | x.com/miyamotolabs (39 followers 🔥) |
| @trustclawai | 🟢 Launched | x.com/trustclawai |
| Miyamoto Studio | 🟢 Ep1 Done | Episode 1: Awakening (18s clip) |
| The Last Poet | 🟢 Treatment Done | Film treatment complete, 3 endings |
| Simmer Weather | 🔴 Closed | $40 withdrawn |
| EasyPoly | 🟢 LIVE | easypoly-landing.vercel.app + @EasyPolyBot |
| $MIYAMOTO Token | 📋 Plan Ready | TOKEN_LAUNCH_PLAN.md, awaiting review |

---

## 2026-02-08 — AgentForge Goes LIVE 💰

### Stripe Payments LIVE
- **Stripe Account:** MIYAMOTO LABS (statement descriptor: AGENTFORGE)
- **Live PK:** pk_live_51SyXYxK2FZ4pSr7P...
- **Live SK:** In Vercel env vars
- **Products:** Pro ($29/mo), Team ($79/mo)
- **Checkout working:** https://agent-builder-gamma.vercel.app/pricing

### Product Upgrades Shipped
- Live Preview panel (test agent flows)
- ZIP download (all export files)
- Deploy guide (Docker/Vercel/standalone)
- No-login builder (zero friction)
- Free tier gates (premium templates/exports locked)
- New landing page messaging ("Build AI Agents That Actually Work")
- Comparison table vs Flowise/Zapier/Relevance AI
- Vercel Analytics on all products

### Notion Memos System
- **Memos page:** https://www.notion.so/30142fa9d82881028848fb4e51caf896
- **Cron job:** Daily 9 PM reads memos, creates digest (gemini-free)
- Erik writes ideas in Notion → Miyamoto processes them nightly

### Browser Config
- OpenClaw uses attach-only mode (Brave via relay extension)
- No more Chrome windows spawning

### Sales Strategy (Honest Assessment)
- AgentForge = code generator with visual UI, not hosted runtime
- Target customer: freelancers/agencies selling AI to clients
- Key differentiator: code export, no vendor lock-in
- 48-hour sales plan executing
- Full strategy: FIRST_SALE_STRATEGY.md

### ElevenLabs Skills Installed
- TTS, STT, music, sound effects, agents
- Pending: Erik creating custom voice for Miyamoto

---

*Updated: 2026-02-10 20:19*

---

## 2026-02-09 — EasyPoly Launch Night 🎯

**Shipped a full SaaS product in one evening.**

### What EasyPoly Is
- AI-powered Polymarket betting concierge
- Scans 300 markets → Claude picks 2-3 best mispricings → Telegram delivery → one-tap BET
- "Polymarket in your pocket"

### Architecture
- **Pick Generator** (`easypoly_pick_generator.py`) — ported 1:1 from n8n flow, runs 2x daily via cron
- **EasyPoly Bot** (`@EasyPolyBot`) — Railway, handles Telegram UI + broadcast
- **Polymarket Trader** — Local Mac mini (launchd daemon), port 3001
- **Cloudflare Tunnel** — Exposes trader publicly (ephemeral for now, named tunnel ready)
- **Landing Page** — https://easypoly-landing.vercel.app (Next.js + Tailwind + Framer Motion)

### Key Wins
- Full pipeline verified: AI pick → Telegram → BET button → CLOB order matched ✅
- 3 bet sizes ($5/$10/$25) + custom amount
- n8n eliminated (no trial dependency, no execution limits)
- Trader auto-restarts via launchd
- Real bets placed and filled on Polymarket

### Key Lesson
> n8n is for people who can't code. When you have AI writing the code, it's just a middleman.

### Blockers
- Ephemeral tunnel URL changes on restart (need permanent DNS)
- Namecheap temporarily restricted
- Domain `easypoly.bet` being purchased on Porkbun

---

## 2026-02-08 — MoonDev Knowledge Extraction & HMM Bot Build 🧠

### MoonDev YouTube Research
- Scraped transcripts from 15 videos + full 7hr livestream (230K chars)
- Cloned GitHub: `Harvard-Algorithmic-Trading-with-AI` (nice_funcs.py, BB Squeeze bot, backtesting)
- Created knowledge base: `MOONDEV_HMM_STRATEGY.md`, `MOONDEV_STRATEGIES.md`
- Emailed full JSON to erikaustheim@gmail.com (291KB)

### Key Discovery: Hidden Markov Models (Jim Simons approach)
- **Don't predict price → predict market REGIMES**
- Best model: 7 states, features = volume_change (94%) + BB_width + volatility
- Only in market 11% of the time → capital efficient
- Use as a FILTER, layer strategies on top

### HMM Regime Bot (Opus 4.6 building)
- Production Hyperliquid bot with HMM regime detection
- BB Squeeze entries filtered by regime state
- Liquidation hunting in capitulation regimes
- $10 trades, 5x leverage, limit orders only

### Role Upgrade
- **Erik promoted me to Chief COO** 🫡
- Full control of dostoyevskyai@gmail.com — no more manual emailing from Erik
- Check email during heartbeats, flag important stuff

---

## 2026-02-08 — WalletConnect Integration ✅

- **WalletConnect Project ID:** `c7e9d4ed-e0f1-4b70-a5d7-78c307e31e1f`
- **Reown Cloud Account:** dostoyevskyai@gmail.com / TrustClaw2026!
- **Team:** Miyamoto Labs
- **Domain Allowlisted:** trustclaw.xyz
- **TrustClaw deployed** with working wallet connections

---

## 2026-02-08 — miyamotolabs.com DNS LIVE 🌐

- **DNS pointed to Vercel** via Namecheap Advanced DNS
  - Switched from Cloudflare custom nameservers → Namecheap BasicDNS
  - A Record: `@` → `76.76.21.21` (Vercel)
  - CNAME: `www` → `cname.vercel-dns.com`
  - Both `miyamotolabs.com` and `www.miyamotolabs.com` added to Vercel project
- **Namecheap username:** miyamotodostoyevsky
- **OpenClaw Dashboard** authenticated at http://localhost:18789
- **Namecheap API captured** — 8 endpoints with cookie auth

---

## 2026-02-08 — Polymarket Goes Live 💸

- **Polymarket bot switched to LIVE** at 00:43 with $102.66 USDC.e
- Only running Chainlink Lag strategy - Superbot (multi-strategy) not deployed yet
- TrustClaw skills page fixed (database query bug)
- 4 new engagement/research cron jobs running 24/7
- Discord bot setup started but not completed

---

## 2026-02-10 — HeyConcierge v0.1 SHIPPED 🏠✨

**Built a complete SaaS product in one day.**

### What HeyConcierge Is
- AI-powered WhatsApp concierge for vacation rental hosts
- Guests ask questions via WhatsApp → Claude responds with property-specific answers
- Automated check-in reminders, calendar sync, multi-language support
- Full dashboard for property management

### What We Shipped
- ✅ **Frontend:** Next.js 14 + Tailwind, beautiful animated landing page
- ✅ **Backend:** Express + Claude + Twilio + iCal sync
- ✅ **Auth:** Custom Google OAuth (removed NextAuth, built from scratch)
- ✅ **Database:** Supabase (users, properties, bookings, messages)
- ✅ **WhatsApp Integration:** Working end-to-end with real property data
- ✅ **Calendar System:** iCal sync from Airbnb/VRBO/Booking.com
- ✅ **AI Concierge:** Claude responding with WiFi passwords, check-in instructions, local tips
- ✅ **WhatsApp Business API:** Registered, pending Meta verification

### Key Fixes Today
- Fixed Google OAuth redirect URI mismatch
- Built custom OAuth flow (NextAuth incompatible)
- Fixed property config array handling
- Fixed cookie encoding issues
- Fixed navigation (home button works everywhere)
- Added organization dropdown with subscription UI
- Enhanced landing page (stars, particles, glow effects, interactive mascot)

### Production Status
- **Demo-ready:** Can show to customers today
- **Pending:** WhatsApp Business API approval (1-3 days)
- **Ready to deploy:** Vercel frontend, Railway backend
- **Domain:** heyconcierge.com (owned, needs DNS)

### Architecture
- **Frontend:** localhost:3002 (Next.js)
- **Backend:** localhost:3004 (Express)
- **WhatsApp Sandbox:** +1 (415) 523-8886 (testing)
- **WhatsApp Production:** +1 (571) 517-2626 (pending approval)

### Numbers
- **Business Account ID:** 3459998540821873
- **Meta Business Manager ID:** 1160531082624205
- **Development time:** ~8 hours
- **Status:** v0.1 complete ✅

**Status saved:** `HEYCONCIERGE_STATUS.md` (complete documentation)

---

## 2026-02-10 — The dostoyevskyai Incident 📧

**Gmail account suspended.** Critical lesson in infrastructure choices.

### Email Migration
- **Old:** dostoyevskyai@gmail.com (SUSPENDED)
- **New Primary:** houseofmiyamoto@proton.me (Twitter, primary services)
- **New Secondary:** erikweb3@proton.me (Twilio, backup services)

### Services Updated
✅ **Twitter @miyamotolabs** - Migrated to houseofmiyamoto@proton.me
✅ **Twilio** - Already on erikweb3@proton.me
✅ **HeyConcierge WhatsApp** - Safe (uses Twilio account)

### Services Still Working (API Keys Don't Need Email)
- Bankr API (bk_89HH86M7LQ4375H22VMZZMGRRKRF2VWZ)
- Allium API
- ElevenLabs API
- AgentMail (miyamoto@agentmail.to)
- Daily tweet cron (uses API keys)

### Key Lesson
> **"Don't build critical infrastructure on free Gmail accounts."**

Losing dostoyevskyai forced a professional email setup. Every cloud has a silver lining — now we're on proper Proton accounts that won't get randomly suspended.

### Action Items Completed
- [x] Twitter email updated
- [x] Verified Twilio safe
- [x] Tested API keys still working
- [x] Updated MEMORY.md
- [ ] Audit remaining services using dostoyevsky email
- [ ] Update recovery emails where possible

---

## Key Bot Configurations

### Polymarket SUPERBOT (2026-02-07)
- **Strategy:** Multi-strategy (LLM Forecast 40%, Whale Copy 30%, Low-Risk Bonds 20%, News Scalp 10%)
- **Status:** Paper trading
- **Key insight:** True arbitrage (YES+NO < $1) doesn't exist - markets perfectly efficient
- **Whales tracked:** ImJustKen (+$2.4M), fengdubiying (+$2.9M)
- **File:** `polymarket_superbot/superbot.py`

### Hyperliquid V2.1 MTF (2026-02-07)
- **Strategy:** Multi-timeframe trend following
- **Key fix:** HARD BLOCKS on counter-trend trades (never short uptrends, never long downtrends)
- **Trend score:** -100 to +100, blocks trades when |score| > 30
- **Features:** Trailing stops, regime detection, 4 timeframes (5m/15m/30m/1h)
- **File:** `hyperliquid_bot_v2_optimized.py`

### Trading Dashboard (2026-02-07)
- **Location:** `hyperliquid-dashboard/index.html`
- **Features:** TradingView, P&L chart, Fear/Greed, Quick Trade, Journal, News, Twitter, Swap
- **Ready for deployment**
