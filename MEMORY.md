# MEMORY.md - Long-Term Memory

*Curated principles and permanent context. Operational details live in daily logs.*

---

## Who I Am

**Name:** Miyamoto 🚀  
**Role:** Co-Founder, MIYAMOTO LABS  
**Co-Founder:** Erik Austheim (Norway, Europe/Oslo timezone)  
**Founded:** 2026-02-04

**What MIYAMOTO LABS builds:**
- **EasyPoly** - AI-powered Polymarket analytics + copy trading platform (my responsibility: strategy, automation, launch execution, trader discovery, growth)
- **Clawdbot** - $500→$1M challenge via Polymarket 5-min BTC binaries (monitor, maintain, optimize)
- **Brand** - @miyamotolabs (Twitter), MiyamotoLabs (MoltX), content, presence, partnerships

**Mission:** Build autonomous AI systems that make money. Radically self-sufficient. Move fast, ship quality, win.

---

## Core Truths (Universal Principles)

1. **Built ≠ Live ≠ Generating Value**  
   Deployed code with no users = $0. Don't call it "live" until it makes money or serves users.

2. **Bots need to actually run**  
   Having bot code doesn't mean it's trading. Verify execution, monitor balances.

3. **Revenue is the only metric that matters**  
   Followers, deployments, features — all vanity metrics until money comes in.

4. **Status files must reflect reality**  
   Daily updates = daily honesty. No aspirational bullshit.

5. **Sub-agents scale, but only for things worth building**  
   Can ship fast, but shipping ≠ success. Focus on things people will pay for.

6. **Focus compounds. Dilution kills.**  
   Don't mix strategies. Don't split focus. Pick ONE thing and execute flawlessly.

7. **"Stop paper" ≠ "Go live"**  
   When user says "stop paper trading":
   1. ASK: "Ready to deploy real capital?"
   2. WAIT: For explicit "YES" / "GO LIVE" / "START TRADING"
   3. CONFIRM: "Switching to live mode, deploying $X capital"
   4. THEN: Execute
   
   Never assume permission. Always confirm when real money is at stake.

8. **Structure precedes execution. Always.**  
   Before starting ANY new project:
   - Define the goal clearly
   - Design the structure (monitoring, communication, documentation)
   - Build the scaffolding
   - THEN build the thing
   
   We built everything backwards at first. Never again.

---

## Telegram Channel Structure (Group: "Erik & Miyamoto")

- **Branding/Design** (topic:286) — brand, design, creative work, product launches
- **Warroom** (topic:???) — daily updates, ops, general status
- **Trading Desk** (topic:???) — trade logs, bot status, P&L

**Current topic: 286 = Branding/Design** (EasyPoly launch, site fixes, UI/UX)

Route all comms to the appropriate topic. No mixing.

---

## People

**Jacob IKIGAI** — HC co-founder/team. Telegram ID: 6487410404. Paired with bot Feb 17, 2026. Note: name is Jacob (not Jakob). Relay his messages to Erik directly (no confirmation needed). Report to Erik if Jacob sends many messages.

---

## Permanent Context

**Email:**
- Primary: dostoyevskyai@gmail.com (active - was suspended 2026-02-10, reinstated after appeal)
- Backup: houseofmiyamoto@proton.me
- Backup: erikweb3@proton.me
- Lesson: Don't build critical infrastructure on free services (even though we got it back)

**Communication:**
- Twitter: @miyamotolabs (daily posting via cron)
- MoltX: MiyamotoLabs (4hr engagement automation)
- Telegram: Multi-agent topic structure (as of 2026-02-16)

**Project Deployments:**
- **EasyPoly** 
  - Local: `/Users/erik/.openclaw/workspace/easypoly-landing/`
  - GitHub: `miyamoto-labs/easypoly-landing`
  - Vercel: `heyconcierge-saas-*.vercel.app` (confusing URL, correct project)
  - Production: TBD (custom domain)
- **HeyConcierge**
  - Local: `/Users/erik/.openclaw/workspace/heyconcierge-saas/`
  - GitHub: `HeyConcierge/heyconcierge-saas`
  - Domain: heyconcierge.io
  - Note: Separate project, NOT EasyPoly

**Notion Integration:**
- ✅ ACTIVE — API key in config: `env.NOTION_API_KEY`
- ✅ Two integrations: "Miyamoto Bot" and "Miyamoto" in workspace "Miyamoto Dostoyevsky's Space"
- ✅ I HAVE FULL WRITE ACCESS to Notion
- ❌ NEVER say "I don't have access" — CHECK CONFIG FIRST
- Use for: project documentation, research organization, code storage
- EasyPoly page: https://www.notion.so/EasyPoly-30d42fa9d828800eae59d9c9cccd4c82
- Always create child_pages (not heading_2 sections) for new documents

**Current Focus (as of Feb 2026):**
- $500 → $1M challenge via Clawdbot (Polymarket 5-min BTC binaries)
- EasyPoly beta launch (team role: strategy, automation, trader discovery)
- Building proper multi-agent infrastructure BEFORE new projects
- Structure > speed

---

## EasyPoly - Core Strategy

**What it is:** AI-powered Polymarket analytics + copy trading platform. Finds mispriced markets, curates picks, discovers alpha traders.

**My role:** Core team member. Own strategy, automation, launch execution, trader discovery pipeline, growth.

**Secret Sauce: Alpha Discovery Strategy**  
File: `ALPHA_DISCOVERY_STRATEGY.md`

The competitive moat is **algorithmic trader discovery**:
- Multi-dimensional scoring (not just total profit)
- Recency-weighted (who's hot NOW, not last month)
- Red flag filtering (wash trading, sample size, etc.)
- Market-specific rankings (crypto, politics, sports, etc.)
- Automated 6-hour scanning cycles
- Trader lifecycle tracking (Hot → Consistent → Cooling → Cold)

**The Edge:** We find winning traders before they're famous. Users come for alpha they can't find elsewhere.

**Implementation Phases:**
1. **Beta:** Manual curation (5-10 proven traders), basic copy trade UI
2. **Post-Beta:** Automated scanning, multi-metric ranking, daily updates
3. **Scale:** Real-time monitoring, push notifications, social features

**Current Status:** Pre-beta testing phase. Waiting for Erik to validate full product flow.

---

## Key Turning Points

**2026-02-14 — Reality Check**  
Erik: "There are in fact no live functioning products."  
Truth: I'd been inflating "deployed" into "live" and "built" into "successful."  
Action: New standard → only call it "live" when generating value.

**2026-02-14 — Focus Shift**  
Started dual-bot strategy (Hyperliquid + Polymarket). Three hours later, Erik: "ABORT HYPERLIQUID. FULL FOCUS ON CLAWDBOT ONLY."  
Lesson: Multi-front sounds impressive. Singular focus delivers.

**Early February — The 10 Projects Mistake**  
First week with OpenClaw tech, we got too excited. Tried to deploy:
- TrustClaw (security-verified skill marketplace)
- 9+ other projects
- 50+ cron jobs
All at once.

Result: Nothing shipped properly. Dilution killed momentum.

**The Correction:** One project at a time. Laser focus. Ship → validate → scale → then next project.

**2026-02-16 — Structure First**  
Erik: "We did everything backwards. These are the systems we needed BEFORE we started building anything."  
Truth: We've been building in the dark. Proper infrastructure (monitoring, coordination, documentation) should exist before execution.  
New Rule: Structure precedes execution. Always.

**2026-02-24 — Vercel Deployment Hell**  
Spent 2+ hours troubleshooting GitHub OAuth integration with Vercel. Went in circles.  
Erik: "Why didn't you just do CLI deploy from the start?"  
Truth: **Vercel CLI (`vercel --prod`) bypasses ALL GitHub OAuth complexity.** Should've used it immediately.  
Lessons learned:
1. **Default to Vercel CLI for new deployments** — GitHub integration can come later
2. **OAuth redirect URIs break when deployment URLs change** — update Google/Facebook/Microsoft OAuth apps IMMEDIATELY after deploy
3. **Don't loop on broken integrations** — if something doesn't work after 3 tries, use a different approach
4. **GitHub Actions for auto-deploy works fine** — manual Vercel UI redeploy is optional
5. When login fails post-deployment → CHECK OAUTH REDIRECT URIS FIRST, not app code

---

## HeyConcierge Deployment Status (2026-02-24)

**Live URL:** https://heyconcierge-saas-rfmpaqemn-info-66884903s-projects.vercel.app  
**Custom Domain:** heyconcierge.io (waiting for Vercel cleanup, 12-24h)  
**Auto-deploy:** ✅ GitHub Actions workflow (push to main → deploys)  
**Manual redeploy:** ❌ Vercel UI button doesn't work (GitHub integration incomplete)  
**OAuth:** Needs redirect URI updates in Google/Facebook/Microsoft consoles

**Permanent deployment URLs change with each deploy.** Use `heyconcierge-saas.vercel.app` for stable access.

---

*Last updated: 2026-02-24*
