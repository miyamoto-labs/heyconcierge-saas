# Show HN: AgentForge — Visual AI Agent Builder (Built by AI+Human Team in 4 Days)

**Link:** https://agent-builder-gamma.vercel.app

---

## What is this?

AgentForge is a node-based visual editor for building multi-agent AI systems without code.

Think "Zapier for AI agents" — drag-and-drop nodes (LLM, tools, memory, decision logic), connect them, deploy.

## Why build this?

I wanted to ship 4 products in 4 days using only AI agents. But orchestrating multiple specialized agents (design, code, deploy, QA) required writing too much plumbing code.

So I built a visual agent orchestrator. Then used it to build itself (meta, I know).

## What makes it different from Flowise/Langflow/n8n?

**vs. Flowise/Langflow:**
- Less technical. No need to understand vector DBs, embeddings, or RAG pipelines.
- Pre-built templates that actually work (customer support, social media, email automation).
- Visual debugging — see agent reasoning in real-time.

**vs. n8n/Make:**
- Built for *agents*, not workflows. Native support for memory, reasoning loops, and context.
- LLM-first design (not webhook-first).

**vs. Relevance AI:**
- Simpler onboarding. Deploy a working agent in 10 minutes.
- Cheaper pricing (pay-per-run, not seat-based).

## Tech stack

- **Frontend:** Next.js 15, React Flow (for node editor)
- **Backend:** Vercel Edge Functions, Upstash Redis (agent state)
- **LLM orchestration:** Custom scheduler with rate limiting, retry logic, cost tracking
- **Supported LLMs:** GPT-4, Claude Sonnet, DeepSeek, Gemini (BYOK or use ours)

## Features

✅ Visual node editor with live preview  
✅ 5 production-ready templates (customer support, social media, email, price monitor, content creator)  
✅ Memory nodes (short-term, long-term, vector search)  
✅ Tool integration (API calls, web scraping, database queries)  
✅ Decision nodes (conditional branching based on LLM reasoning)  
✅ Export to Python/TypeScript  
✅ Free tier (100 runs/month, no credit card)

## The 4-day experiment

Using AgentForge, I built:

1. **Landing page generator** (describe idea → deployed site)
2. **Twitter engagement bot** (finds posts, writes contextual replies)
3. **Email outreach agent** (LinkedIn profile → personalized cold email)
4. **AgentForge itself** (used the agent builder to refactor its own codebase)

All 4 are live and processing real work.

## Open questions / looking for feedback

1. **Pricing:** Is $0.10/run too high? (Includes LLM costs + orchestration + storage)
2. **Templates:** Which agent use cases would you want pre-built?
3. **Deployment:** Should I add self-hosting option for enterprises?

## Security / Privacy

- BYOK (bring your own keys) supported
- Agent execution logs are encrypted at rest
- No training on user data
- SOC 2 Type II in progress

## Try it

🔗 https://agent-builder-gamma.vercel.app

Free tier available. 5-minute quickstart tutorial on the homepage.

Built by Miyamoto Labs (Oslo, Norway). This is our 4th AI product launch in 4 days.

---

**HN community:** I'd especially love feedback on:
- What would make you *actually use* this vs. writing agent code yourself?
- What's the breaking point where you'd need to export and self-host?
- Should we open-source the node runtime?

— Erik Austheim, Founder @ Miyamoto Labs
