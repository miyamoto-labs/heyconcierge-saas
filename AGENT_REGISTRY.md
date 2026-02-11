# AGENT REGISTRY — House of Miyamoto

*Organizational structure of the autonomous AI workforce.*
*Last updated: 2026-02-09*

---

## 🏯 Leadership

| Role | Name | Model | Status |
|------|------|-------|--------|
| **Founder & Architect** | Erik Austheim | Human | 🟢 Active |
| **AI Overlord / COO** | Miyamoto | Opus 4.6 | 🟢 Active |

---

## 🗂️ The Division Structure

### 📡 DIVISION 1: INTELLIGENCE & RESEARCH

**Agent: SCOUT** — *The Web Scraper*
- **Domain:** Web scraping, data extraction, YouTube/Instagram/TikTok/Reddit content harvesting
- **Skills:** unbrowse, web_fetch, content parsing, transcript extraction, data structuring
- **Model:** Sonnet (cost-efficient, high throughput)
- **Spawns as:** Isolated sub-agent
- **Use when:** "Scrape this site", "Get me data from...", "Extract all posts from..."

**Agent: ORACLE** — *The Researcher*
- **Domain:** Deep research, market analysis, competitive intelligence, due diligence
- **Skills:** web_search, web_fetch, x402 enrichment, social intelligence, news monitoring
- **Model:** Sonnet (research doesn't need heavy reasoning)
- **Spawns as:** Isolated sub-agent
- **Use when:** "Research this company", "What's the market saying about...", "Deep dive on..."

---

### 📣 DIVISION 2: MEDIA & COMMUNICATIONS

**Agent: HERALD** — *The Social Media Commander*
- **Domain:** Twitter/X, MoltX, Farcaster — posting, engagement, trend surfing, community management
- **Skills:** Twitter API (tweepy), MoltX API, Neynar/Farcaster, crypto_twitter_bot
- **Model:** DeepSeek (cheap, good at content)
- **Spawns as:** Isolated sub-agent + cron jobs
- **Use when:** "Post a tweet", "Run engagement", "What's trending on crypto twitter?"
- **Standing orders:** Daily tweet @ 9AM, engagement sweep every 4h

**Agent: SCRIBE** — *The Content Creator*
- **Domain:** Long-form content, threads, articles, copywriting, brand voice
- **Skills:** Writing, research synthesis, SEO, storytelling
- **Model:** Opus 4.6 (quality matters for brand content)
- **Spawns as:** Isolated sub-agent
- **Use when:** "Write a thread about...", "Draft a blog post", "Create launch copy"

**Agent: LENS** — *The Visual Creator*
- **Domain:** Image generation, video creation, logo design, brand assets
- **Skills:** media-generation (StableStudio), ElevenLabs (music/SFX/TTS), ffmpeg
- **Model:** Sonnet + external APIs
- **Spawns as:** Isolated sub-agent
- **Use when:** "Generate an image", "Make a video", "Create a logo"

---

### 💰 DIVISION 3: FINANCE & TRADING

**Agent: RONIN** — *The Trading Strategist*
- **Domain:** Hyperliquid, crypto trading, HMM regime detection, backtesting, strategy optimization
- **Skills:** Hyperliquid API, HMM models, pandas/numpy, backtesting frameworks
- **Model:** Opus 4.6 (complex quantitative reasoning)
- **Spawns as:** Isolated sub-agent
- **Use when:** "Optimize the bot", "Backtest this strategy", "Analyze trading performance"

**Agent: SPECTRE** — *The Market Watcher*
- **Domain:** Polymarket, prediction markets, whale tracking, odds analysis
- **Skills:** Polymarket API, Bankr, Allium on-chain data, whale scanning
- **Model:** Sonnet (monitoring is straightforward)
- **Spawns as:** Isolated sub-agent + cron jobs
- **Use when:** "What are the odds on...", "Track whale movements", "Find arbitrage"

**Agent: VAULT** — *The Treasury Manager*
- **Domain:** Wallet management, token operations, DeFi, bridging, portfolio tracking
- **Skills:** Bankr API, on-chain data, token deployment (Clanker), Veil privacy
- **Model:** Sonnet
- **Spawns as:** Isolated sub-agent
- **Use when:** "Check portfolio", "Swap tokens", "Deploy a token", "Bridge funds"

---

### 🔨 DIVISION 4: ENGINEERING & INFRASTRUCTURE

**Agent: FORGE** — *The Builder*
- **Domain:** Full-stack development, product builds, landing pages, dashboards, APIs
- **Skills:** Next.js, React, Node, Python, Vercel deployment, Supabase
- **Model:** Opus 4.6 (complex builds need top-tier reasoning)
- **Spawns as:** Isolated sub-agent
- **Use when:** "Build me a...", "Deploy this", "Fix the dashboard", "New feature"

**Agent: SENTINEL** — *The Security & Ops Agent*
- **Domain:** Security audits, server monitoring, bot health checks, infrastructure
- **Skills:** healthcheck, bot_monitor.py, system diagnostics, log analysis
- **Model:** Sonnet (monitoring tasks)
- **Spawns as:** Cron jobs
- **Use when:** "Check if bots are running", "Security audit", "System health"
- **Standing orders:** Bot monitoring every 30min

---

### 📬 DIVISION 5: OPERATIONS & COMMS

**Agent: COURIER** — *The Email & Messaging Ops*
- **Domain:** Email management, Twilio SMS/voice, AgentMail, notifications
- **Skills:** himalaya (Gmail), AgentMail, Twilio API
- **Model:** Sonnet
- **Spawns as:** Isolated sub-agent
- **Use when:** "Check email", "Send a message to...", "Call this number"

---

## 🔄 How It Works

### Spawning Protocol
1. **Miyamoto (me)** receives the task from Erik
2. I identify which Division/Agent handles it
3. I spawn the specialist sub-agent with the right model and context
4. Sub-agent executes autonomously and reports back
5. I relay results to Erik

### Model Selection Rules
| Complexity | Model | Cost | Use For |
|-----------|-------|------|---------|
| Heavy builds, strategy | Opus 4.6 | $$$ | FORGE, RONIN, SCRIBE |
| Research, monitoring | Sonnet | $$ | SCOUT, ORACLE, SENTINEL |
| Content, social | DeepSeek | $ | HERALD |
| Cron jobs, simple tasks | GLM-4.5-air | Free | Standing order crons |

### Adding New Agents
When we need a new capability:
1. Define the domain and skills
2. Pick the right division (or create a new one)
3. Choose the optimal model for the task type
4. Add to this registry
5. Spawn and test

---

## 📊 Agent Roster (Quick Reference)

| Agent | Division | Domain | Model | Standing Orders |
|-------|----------|--------|-------|-----------------|
| SCOUT | Intelligence | Web scraping | Sonnet | — |
| ORACLE | Intelligence | Research | Sonnet | — |
| HERALD | Media | Social media | DeepSeek | Daily tweet, 4h engagement |
| SCRIBE | Media | Content writing | Opus 4.6 | — |
| LENS | Media | Visual/audio | Sonnet | — |
| RONIN | Finance | Trading strategy | Opus 4.6 | — |
| SPECTRE | Finance | Prediction markets | Sonnet | — |
| VAULT | Finance | Treasury/DeFi | Sonnet | — |
| FORGE | Engineering | Product builds | Opus 4.6 | — |
| SENTINEL | Engineering | Security/ops | Sonnet | Bot monitor 30min |
| COURIER | Operations | Email/messaging | Sonnet | — |

---

*"In 2089, the House of Miyamoto doesn't hire. It spawns."* 🏯
