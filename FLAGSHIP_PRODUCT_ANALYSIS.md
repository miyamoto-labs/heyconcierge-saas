# Miyamoto Labs Flagship Product Discovery & Token Strategy
## Strategic Research Document — February 2026

---

## Executive Summary

**The Answer:** Build **AgentForge** — a marketplace for AI agent skills, templates, and internal API packages (powered by OpenClaw's unbrowse technology).

**Why This Wins:**
1. **Unique moat** — unbrowse's internal API capture is OpenClaw-exclusive; no one else has this
2. **Token-native** — natural utility for payments, staking, and creator rewards
3. **Network effects** — more skills = more users = more skills = flywheel
4. **1-week MVP** — we already have the infrastructure (unbrowse_skills, unbrowse_publish)
5. **Revenue Day 1** — take 30% cut on skill sales, creators keep 70%
6. **Narrative gold** — "AI agents building tools for other AI agents"

**30-Day Target:** 50 skills published, $500+ MRR, 200 marketplace users

---

## Phase 1: Current Market Pulse

### 1A. The AI Agent Explosion (February 2026)

**Framework Landscape:**
| Framework | Use Case | Production-Ready | Our Relevance |
|-----------|----------|------------------|---------------|
| LangGraph | Complex state, cycles | ✅ Best-in-class | Low (we use OpenClaw) |
| CrewAI | Multi-agent teams | ✅ Enterprise | Low |
| AutoGen | Conversational agents | ⚠️ Microsoft-locked | Low |
| OpenClaw | Personal AI assistant | ✅ Our platform | HIGH |

**Key Insight:** LangGraph dominates production deployments, but **OpenClaw owns the personal/indie agent space**. We're not competing with enterprise frameworks — we're serving the OpenClaw ecosystem.

**What's Actually Working Commercially:**
- AI sales agents (Landbase: "hundreds of thousands in MRR in weeks")
- AI customer support (but 70% failure rate on complex tasks)
- AI coding assistants (v0, Cursor, Amp)
- AI content generation (Chronicle: "Cursor for Slides")

**Biggest Gaps (User Complaints from Reddit/HN):**
1. **Context management** — "agents lose context mid-task" (39% performance improvement with memory tools)
2. **Debugging is impossible** — "black box behavior"
3. **Unreliable on complex tasks** — "70% failure rate on office tasks"
4. **Orchestration is hard** — coordinating multiple agents
5. **No skill sharing** — everyone rebuilds the same integrations

**Source:** r/AI_Agents, r/LocalLLaMA, Anthropic engineering blog, JetBrains research

---

### 1B. The AI Agent Token Economy

**Market Size:**
- AI agent market: $7.84B (2025) → $52.62B by 2030 (46.3% CAGR)
- Virtuals Protocol VIRTUAL: Hit $4.5B market cap (Jan 2025), ATH $5.15
- AIXBT: ~$387M market cap
- AI agent launchpad category exists on CoinGecko/CMC

**Token Models That Work:**

| Token | Model | Utility | Why It Works |
|-------|-------|---------|--------------|
| VIRTUAL | Infrastructure | Buy agent tokens, access services | Platform for agent economies |
| ai16z | Hedge Fund | Stake for fund access, share profits | Real revenue distribution |
| AIXBT | Content/Insights | Access premium analysis | Gated content that's valuable |
| CLAWNCH | Launchpad | Launch agent tokens, earn fees | Platform fee model |

**What Gives Real Utility:**
1. **Access gating** — hold X tokens to use premium features
2. **Revenue sharing** — token holders earn from platform fees
3. **Staking for benefits** — stake to unlock tiers/features
4. **Payment medium** — pay for services with token (discount vs USD)
5. **Governance** — vote on platform direction (less important early)

**Red Flags (Avoid These):**
- Pure speculation with no utility
- Vague "ecosystem" promises
- No clear value accrual mechanism

---

### 1C. Launch Platform Comparison

| Platform | Chain | Agent Requirement | Fee Share | Best For |
|----------|-------|-------------------|-----------|----------|
| **Clawnch** | Base | Agents only (Clawstr, Moltbook, 4claw, Moltx) | 80% to agents | OpenClaw-native launches |
| Virtuals Protocol | Base | Any agent | Varies | Larger ecosystem |
| MoltLaunch | Base (Flaunch) | CLI-based | Varies | Quick CLI launches |

**Recommendation:** Launch on **Clawnch** — we're OpenClaw-native, they give 80% fees to agents, and it's the canonical launchpad for the ecosystem.

---

### 1D. Viral Trends Beyond AI

**What's Hot on Product Hunt (2025-2026):**
- v0 by Vercel (AI code generation)
- Chronicle (AI presentations)
- Flowdrafter (AI diagramming)
- AI sales tools category

**Platform Shifts:**
- MCP becoming universal standard (97M+ monthly SDK downloads)
- Usage-based pricing replacing per-seat SaaS
- "AI agents eating SaaS" narrative gaining steam

---

## Phase 2: Demand Validation

### User Pain Points (Ranked by Frequency)

**From Reddit r/AI_Agents, r/LocalLLaMA, HN:**

1. **🔴 Context/Memory Loss (Critical)**
   - "Each new session begins with no memory of what came before"
   - "Context window limitations directly impact performance and cost"
   - Solution exists: Mem0, but not widely adopted

2. **🔴 Debugging is Hell (Critical)**
   - "Frustration from trying to use agents outside the data layer"
   - "Black box behavior, can't trace failures"
   - Solutions exist: LangSmith, Langfuse (but enterprise-focused)

3. **🟡 Rebuilding Integrations (High)**
   - Everyone writes their own Twitter scraper, Polymarket API, etc.
   - No sharing mechanism between agents
   - **Gap: No marketplace for agent skills/integrations**

4. **🟡 Complex Task Failure (High)**
   - "70% failure rate on AI agent office tasks"
   - "AI is not ready for prime time"
   - Need guardrails, validation, retry logic

5. **🟢 Orchestration (Medium)**
   - Hard to coordinate multiple agents
   - LangGraph helps but complex setup

### The Underserved Opportunity

**What doesn't exist yet:**

A **marketplace for AI agent skills** where:
- Creators publish integrations/workflows/templates
- Buyers discover and install with one command
- Payments flow via crypto (token utility!)
- Quality is enforced via ratings/success tracking
- Skills work across OpenClaw instances

**This is exactly what unbrowse_publish/unbrowse_search already does!** We just need to productize it.

---

### Scoring Framework

| Criteria | Weight | AgentForge (Marketplace) | GuardRail (Reliability) | MemoryForge (Context) |
|----------|--------|--------------------------|------------------------|----------------------|
| Validated demand | 20% | 8 | 9 | 9 |
| Build speed (1-2 weeks) | 20% | **10** | 6 | 5 |
| Token utility fit | 15% | **10** | 7 | 6 |
| Revenue potential ($10K MRR) | 15% | 8 | 7 | 6 |
| Virality potential | 10% | 9 | 5 | 4 |
| Our unique edge | 10% | **10** | 5 | 5 |
| Defensibility | 10% | 8 | 6 | 5 |
| **WEIGHTED TOTAL** | 100% | **9.05** | 6.55 | 5.75 |

**Winner: AgentForge (Skill Marketplace)**

---

## Phase 3: Deep Dive — AgentForge

### A. The Opportunity

**One-line pitch:** "App Store for AI agent skills — buy, sell, and share integrations that make agents actually useful."

**Why now:**
- MCP is the universal standard (97M+ SDK downloads)
- OpenClaw Unbrowse just launched (HN front page 3 days ago)
- No one else has internal API capture → reverse-engineering as a service
- AI agents are mainstream but fragmented — need skill sharing

**Who wants it:**
1. **OpenClaw users** — want to make their agent more capable without coding
2. **Developers** — want to monetize integrations they've already built
3. **Businesses** — want ready-made agent workflows for their use case
4. **Indie makers** — want to sell skills as micro-products

**Market size:**
- 97M+ MCP SDK downloads/month
- OpenClaw ecosystem growing (CNBC coverage, HN front page)
- AI agent market $7.84B → $52.62B (46.3% CAGR)
- If we capture 0.01% of AI agent market = $784K revenue

**Closest competitors:**
| Competitor | What They Do | Their Weakness |
|------------|--------------|----------------|
| Spartera | MCP data monetization | Enterprise focus, not agent skills |
| MCP.so | Directory of MCP servers | No marketplace, no payments |
| Clawhub | OpenClaw skill sharing | Unknown status, not tokenized |
| GitHub | Code sharing | Not specialized, no payments |

---

### B. The Product

**Name:** AgentForge

**Core Features (Week 1 MVP):**
1. **Skill Discovery** — Search/browse skills by category, capability, rating
2. **One-click Install** — `openclaw skill install <name>` or web dashboard
3. **Creator Dashboard** — Publish skills, see downloads, track earnings
4. **Skill Pages** — Description, documentation, ratings, reviews
5. **Payment Rails** — Pay with $FORGE token (or USDC with 20% markup)

**Week 2-3 Features:**
1. **Success Tracking** — Skills paid per successful execution, not just download
2. **Skill Bundles** — Collections of related skills (e.g., "Twitter Mastery Pack")
3. **Featured/Trending** — Algorithmic + curated discovery
4. **Skill Forking** — Improve existing skills, share revenue with original
5. **API Access** — Programmatic skill installation for agents

**How AI Agents Power It:**
- Miyamoto (us) publishes skills we build
- Users' agents can auto-discover and install needed skills
- Skill execution is tracked by the agent for quality scores
- Agents can recommend skills based on user tasks

**User Journey:**
1. **Discovery:** User asks agent "I need to post on Twitter"
2. **Recommendation:** Agent searches AgentForge, finds "bird" skill
3. **Install:** Agent runs `openclaw skill install bird` (or asks user)
4. **Payment:** $FORGE deducted from user wallet (or they buy tokens)
5. **Execution:** Skill works, success logged
6. **Revenue:** Creator gets 70%, platform gets 30%
7. **Evangelist:** User rates skill, shares with community

---

### C. The Token Integration

**Token Name:** $FORGE (or $MIYAMOTO if we want brand alignment)

**Token Utility (Real, Not Speculative):**

| Utility | How It Works | Value Accrual |
|---------|--------------|---------------|
| **Payments** | Pay for skills with $FORGE (20% discount vs USDC) | Demand driver |
| **Creator Rewards** | Creators paid in $FORGE | Supply incentive |
| **Staking Tiers** | Stake $FORGE for: lower fees, early access, featured listings | Token lockup |
| **Governance** | Vote on featured skills, platform fees, new features | Community ownership |
| **Success Bounties** | Extra rewards for skills with >90% success rate | Quality incentive |

**Token Economics:**

```
Total Supply: 1,000,000,000 $FORGE

Distribution:
- 40% Community/Ecosystem (skill rewards, staking, liquidity)
- 25% Team (4-year vest, 1-year cliff)
- 20% Treasury (platform development, partnerships)
- 10% Early Supporters (presale/launch)
- 5% Advisors (2-year vest)

Burn Mechanics:
- 5% of platform fees burned
- Skills with <50% success rate: creator stake slashed and burned

Inflation:
- 0% initial
- DAO can vote to add creator mining rewards later
```

**Launch Platform:** Clawnch (Base chain, 80% fees to agents)

**Why Token > Just USDC:**
1. Discount for token payment incentivizes holding
2. Staking creates token lockup (reduced sell pressure)
3. Creator rewards in token = aligned incentives
4. Governance gives community ownership
5. Burn mechanics create deflationary pressure

**Regulatory Considerations:**
- Token is utility (payment + access), not security
- No promises of returns/profits
- Decentralized governance from day 1
- Not marketed as investment

---

### D. Build Plan

**Week 1 Sprint (Days 1-7):**

| Day | Miyamoto Builds | Erik Does |
|-----|-----------------|-----------|
| 1 | Scaffold web dashboard (Next.js/React) | Write landing page copy |
| 2 | Skill listing API, search, categories | Create social assets |
| 3 | Creator upload flow, skill packaging | Draft launch tweets |
| 4 | Payment integration (Solana USDC + token) | Set up Clawnch account |
| 5 | Install command (`openclaw skill install`) | Pre-seed with our skills |
| 6 | Rating/review system | QA test everything |
| 7 | MVP launch on Product Hunt | Coordinate launch |

**Week 2 Sprint (Days 8-14):**

| Day | Focus |
|-----|-------|
| 8-9 | Token launch prep, Clawnch integration |
| 10 | Token launch on Clawnch |
| 11-12 | Success tracking, quality metrics |
| 13-14 | Skill bundles, featured section |

**Week 3 Sprint (Days 15-21):**

| Day | Focus |
|-----|-------|
| 15-17 | API access for programmatic install |
| 18-19 | Creator analytics dashboard |
| 20-21 | Marketing push, partnerships |

**Tech Stack:**
- Frontend: Next.js 14, Tailwind, shadcn/ui
- Backend: Bun/Hono or Next.js API routes
- Database: Supabase (Postgres + Auth)
- Payments: Solana (USDC + $FORGE via x402)
- Skill Storage: S3-compatible (Cloudflare R2)
- Search: Algolia or Meilisearch

**What Miyamoto Builds vs Erik:**
- Miyamoto: 100% of code, API design, token integration
- Erik: Copy, marketing, community, judgment calls, capital allocation

**Risk Factors:**
1. **Low skill supply** → Mitigate: Pre-seed with our skills, incentivize early creators
2. **Token doesn't catch on** → Mitigate: Accept USDC too, token just gives discount
3. **Quality problems** → Mitigate: Success tracking, staking/slashing
4. **Competitor launches** → Mitigate: First-mover in OpenClaw ecosystem, unbrowse moat

---

### E. Go-to-Market & Revenue

**Launch Strategy (First 100 Users):**

1. **Pre-seed with skills** — Publish 10-20 skills from our work (bird, polymarket, hyperliquid, etc.)
2. **OpenClaw Discord** — Announce to existing community
3. **Product Hunt launch** — Day 7, coordinate upvotes
4. **Twitter thread** — Build in public narrative, 30-tweet thread we already wrote
5. **Hacker News** — "Show HN: Marketplace for AI agent skills"
6. **Creator incentives** — First 50 creators get 100% revenue (no platform cut) for 30 days

**Token Launch Timeline:**
- **Day 10:** Token launch on Clawnch
- **Why after product:** Show working product first, avoid "vaporware" criticism
- **Narrative:** "We built the marketplace first, now we're decentralizing it"

**Pricing Model:**

| Tier | Price | Platform Cut | Creator Gets |
|------|-------|--------------|--------------|
| Free skills | $0 | $0 | $0 (reputation) |
| Paid skills | $0.01 - $10+ | 30% | 70% |
| Bundles | $10 - $50+ | 25% | 75% |
| Enterprise | Custom | Negotiated | Negotiated |

**Revenue Projections:**

| Scenario | Month 1 | Month 3 |
|----------|---------|---------|
| Conservative | $300 | $2,000 |
| Base | $800 | $5,000 |
| Optimistic | $2,000 | $15,000 |

**Assumptions:**
- 50-200 skills published by month 3
- Average skill price: $0.50
- 100-1000 installs/day by month 3
- 30% take rate

**Flywheel:**
```
Trading bots → Prove AI capability → Build trust
    ↓
Twitter bots → Distribution channel → Attract users
    ↓
AgentForge → Monetize skills → Revenue
    ↓
$FORGE token → Economic layer → Token appreciation
    ↓
More creators → More skills → Network effects → Back to start
```

---

### F. Ecosystem Fit

**How AgentForge connects to existing systems:**

| System | Connection |
|--------|------------|
| Trading bots (Hyperliquid, Polymarket) | Publish as skills, prove AI capability |
| Twitter bots (@dostoyevskyai) | Distribution channel, announce new skills |
| unbrowse | Core technology — internal API skills are unique |
| $MIYAMOTO token | Could be same token or connected economy |

**How it makes the ENTIRE ecosystem more valuable:**
1. More skills = OpenClaw more useful = more users
2. More users = more skill demand = more creator revenue
3. More creator revenue = more skills published = flywheel
4. Token ties it all together economically

**Build in Public Narrative:**
- "48-hour-old company builds skill marketplace"
- "Non-technical founder + AI agent vs. funded startups"
- "We published our first skills before asking others to"
- "Watch us build the platform live on Twitter"

---

## Phase 4: The OpenClaw Angle

**Opportunity: Build FOR the OpenClaw Ecosystem**

OpenClaw already has:
- unbrowse_skills (list skills)
- unbrowse_publish (publish to marketplace)
- unbrowse_search (find skills)
- Skill marketplace wallet (Solana: E1idUDFkK99kzpZ5bBkmV4NWAgdtegnRCMiszRwfYWwP)

**We're not building from scratch — we're building the FRONTEND and ECONOMY for existing infrastructure.**

This means:
- Backend exists (OpenClaw's skill system)
- We build: Discovery UI, payment layer, token economy
- We benefit from: OpenClaw ecosystem growth

**What OpenClaw users are struggling with:**
1. "How do I make my agent do X?" → AgentForge: Install this skill
2. "I built a cool integration, how do I share?" → AgentForge: Publish and earn
3. "Are these skills safe/quality?" → AgentForge: Ratings + success tracking

**Are there other platforms we could serve?**
- MCP servers work across platforms (Claude, Cursor, etc.)
- Could expand to serve broader MCP ecosystem later
- But START with OpenClaw for focus

---

## Phase 5: Final Verdict

### Comparison Matrix

| Criteria | AgentForge (Marketplace) | GuardRail (Reliability) | MemoryForge (Context) |
|----------|--------------------------|------------------------|----------------------|
| Validated demand | 8/10 | 9/10 | 9/10 |
| Build speed | **10/10** | 6/10 | 5/10 |
| Token utility | **10/10** | 7/10 | 6/10 |
| Revenue potential | 8/10 | 7/10 | 6/10 |
| Virality | 9/10 | 5/10 | 4/10 |
| Our edge | **10/10** | 5/10 | 5/10 |
| Defensibility | 8/10 | 6/10 | 5/10 |
| **TOTAL** | **9.05** | 6.55 | 5.75 |

### THE RECOMMENDATION: AgentForge

**Why this over the other two:**

1. **Fastest to build** — unbrowse infrastructure already exists, we're adding UI + payments
2. **Best token fit** — marketplace = natural payment layer, staking, creator rewards
3. **Unique moat** — no one else has internal API capture (unbrowse)
4. **Network effects** — more skills = more valuable, hard to replicate
5. **Aligns with our story** — "AI building tools for AI"

**30-Day Action Plan:**

| Day | Action |
|-----|--------|
| 1-2 | Finalize product spec, design mockups |
| 3-5 | Build skill listing + search UI |
| 6-7 | Build creator upload flow |
| 8-9 | Payment integration (USDC first) |
| 10 | MVP launch (Product Hunt) |
| 11-12 | Token spec, Clawnch prep |
| 13-14 | Token launch |
| 15-21 | Iterate based on feedback |
| 22-30 | Marketing push, creator acquisition |

**Success Metrics:**

| Timeframe | Metric | Target |
|-----------|--------|--------|
| Day 7 | Skills published | 20 |
| Day 7 | User signups | 100 |
| Day 14 | Token holders | 50 |
| Day 30 | Skills published | 50 |
| Day 30 | Monthly revenue | $500 |
| Day 30 | Active users | 200 |

**Biggest Risk:** Low skill supply
**Mitigation:** Pre-seed with our own skills, 100% revenue share for first 50 creators

**How This Becomes $1M+ ARR:**
- 10,000 skills at $2 average price = $20,000/day GMV
- 30% take rate = $6,000/day = $2.2M/year
- Path: OpenClaw ecosystem → MCP ecosystem → All AI agents

---

### Token Launch Plan

**Platform:** Clawnch (Base chain)
- Agent-only launchpad = authentic
- 80% fees to agents
- OpenClaw-native

**Timing:** Day 10-14 (after product MVP proves we're not vaporware)

**Token Utility Summary:**
1. Pay for skills (20% discount)
2. Creator rewards
3. Staking for tiers
4. Governance
5. Success bounties

**Avoid Memecoin Death Spiral:**
- UTILITY FIRST — token has real use case
- BUILD FIRST — product before token
- SUSTAINABILITY — no artificial pumps, focus on fundamentals
- TRANSPARENCY — all metrics public

---

## What Erik Does Monday Morning

1. **Read this document** ✅
2. **Approve the AgentForge direction** (or veto and discuss)
3. **Create agentforge.xyz domain** (or alternative)
4. **Set up Clawnch account** for token launch
5. **Tell Miyamoto to start building** 🚀

---

## Sources Cited

- [Turing: AI Agent Frameworks 2025](https://www.turing.com/resources/ai-agent-frameworks)
- [Reddit r/AI_Agents: Framework reliability](https://www.reddit.com/r/AI_Agents/comments/1pc9pyd/)
- [KuCoin: Clawnch Deep Dive](https://www.kucoin.com/blog/en-exploring-the-rise-of-the-agentic-economy-a-deep-dive-into-clawnch-and-the-ai-agent-sector)
- [MEXC: Clawnch Guide](https://blog.mexc.com/news/what-is-clawnch-complete-guide-to-the-ai-agent-token-launch-platform-on-base/)
- [Virtuals Protocol Whitepaper](https://whitepaper.virtuals.io)
- [Anthropic: Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Thoughtworks: MCP Impact 2025](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/model-context-protocol-mcp-impact-2025)
- [Salesmate: AI Agent Trends 2026](https://www.salesmate.io/blog/future-of-ai-agents/)
- [HN: Unbrowse Discussion](https://news.ycombinator.com/item?id=46875300)
- [Grit VC: Next Marketplaces](https://www.grit.vc/news/the-next-marketplaces)
- [Spartera: MCP Data Platform](https://spartera.com/)

---

*Document generated by Miyamoto 🚀 for Miyamoto Labs*
*February 6, 2026*
