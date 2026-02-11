# I built a visual AI agent builder that exports to Python/Docker — roast my landing page

Hey r/SaaS! 👋

Last week I challenged myself to build 4 AI products in 4 days using AI agents to help with the coding. One of those products was... a tool to build AI agents. Meta, I know.

**The problem I kept running into:** Every time I wanted to build an agent, I'd either:
- Spend hours writing boilerplate (tool definitions, error handling, context management)
- Use Langflow/Flowise and get locked into their runtime (can't deploy standalone)

So I built **AgentForge** — a visual builder where you drag-and-drop tools, set up workflows, and it exports clean Python code you actually own. Plus Docker configs and OpenClaw integration files.

🔗 https://agent-builder-gamma.vercel.app

**The stack:**
- Visual canvas for designing agent flows
- Python code generator (not JSON configs)
- Pre-built templates (customer support, research, data processing)
- Free tier + $29/mo Pro (removes export limits, adds custom tools)

**What I learned building this:**
1. AI is incredible at generating boilerplate but terrible at architecture
2. People don't want "no-code" — they want "less code"
3. Vendor lock-in is a real concern (everyone's been burned by platform risk)

**My honest take:** I'm not sure if the pricing is right. $29/mo feels low for business value but high for indie hackers. I'm also worried the landing page doesn't communicate the "no vendor lock-in" angle clearly enough.

**I need your help:**
- Does the value prop make sense from the landing page alone?
- What would make you pay $29/mo for this vs just writing Python?
- Is "exports to code" compelling, or do people actually prefer hosted solutions?

Roast away. I can take it. 🔥

---

**Edit:** Not looking for users (yet), genuinely want feedback on positioning and pricing before I push this harder.