# Show IH: AgentForge — Visual AI Agent Builder → Production Code

**Link:** https://agent-builder-gamma.vercel.app

**Pricing:** Free tier + $29/mo Pro

**What it does:** Visual builder for AI agents that exports production-ready Python code. Unlike Langflow/Flowise (which lock you into their runtime), AgentForge gives you code you own.

## The Business Angle

**Market:** Developers/businesses building AI agents who want to move faster without vendor lock-in.

**Positioning:** "No-code for prototyping, real code for production." You get both — fast visual building + exportable code.

**Revenue model:**
- Free tier (3 exports/month) → conversion funnel
- Pro $29/mo (unlimited exports, custom tools) → target market is indie devs / small teams
- Considering enterprise tier (~$99/mo) for teams + white-label options

**Validation so far:**
- Built as part of "4 products in 4 days" challenge using AI agents
- Scratching my own itch (kept rewriting agent boilerplate)
- Early feedback: pricing might be too low for businesses, too high for hobbyists

## Tech Stack

- **Frontend:** Next.js, React Flow for canvas
- **Backend:** Python FastAPI
- **Code generation:** Template engine + AST manipulation (not string concatenation)
- **Export formats:** Python (Anthropic/OpenAI), Docker, OpenClaw configs
- **Deployment:** Vercel (frontend), Railway (API)

**Costs:**
- ~$40/mo infrastructure
- OpenAI/Anthropic API usage (minimal, only for code generation)
- Aiming for 80%+ margins at scale

## What I'm Figuring Out

**1. Pricing:**
Should I charge per export? Per agent? Flat monthly? Current $29/mo feels arbitrary.

**2. Market fit:**
Is the pain point "writing boilerplate" or "not knowing how to start"? Those are different customers.

**3. Distribution:**
- SEO play (targeting "AI agent builder" keywords)
- Developer communities (here, r/AI_Agents, Twitter)
- Product Hunt launch soon
- Considering partnership with OpenClaw (they have a framework, I generate configs for it)

**4. Feature priority:**
- More templates? (current: support, research, data, social)
- Better code quality? (already pretty clean IMO)
- Hosted deployment? (contradicts the "own your code" pitch)
- Marketplace for custom tools? (monetization opportunity)

## Honest Take

I think there's a gap between "write everything from scratch" and "use a black-box platform." That's where this lives. But I'm not sure if that market is big enough or if people care about code ownership as much as I think they do.

Also built this partly to validate that AI agents can actually build products (I used Claude heavily for code generation). The meta irony is not lost on me.

**Ask IH:**
- Is $29/mo the right price, or should I do usage-based?
- Would you pay for this, or just write the Python yourself?
- What's your experience with Langflow/Flowise? Do people actually want to escape those platforms?

Open to all feedback — roast away. 🔥