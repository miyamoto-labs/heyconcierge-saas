# Show r/artificial: I built 4 AI products in 4 days with an AI agent team. Here's AgentForge — the visual agent builder I used.

**TL;DR:** Built AgentForge, a no-code AI agent builder with drag-and-drop interface and 5 pre-built templates. Free tier available. [Try it here](https://agent-builder-gamma.vercel.app)

---

## The Story

Three weeks ago, I challenged myself: **Build 4 real products in 4 days using nothing but AI agents.**

Not chatbots. Not code assistants. **Actual autonomous agents** that could design, code, deploy, and iterate on their own.

I needed a way to orchestrate multiple specialized agents (design, frontend, backend, deployment) without writing framework code for each one. So I built **AgentForge** — a visual agent builder where you drag-and-drop nodes to create multi-agent systems.

## What I Built

**AgentForge** lets you build AI agents without code:

- 🎨 **Visual drag-and-drop interface** — no YAML, no config files, no "just a tiny bit of code"
- 📦 **5 pre-built templates** ready to deploy:
  - Customer Support Agent
  - Social Media Manager
  - Email Automation Agent
  - Price Monitoring Agent
  - Content Creator Agent
- 🔗 **Node-based workflow** — connect LLM nodes, tool nodes, decision nodes, memory nodes
- 🆓 **Free tier** — no credit card required to start

## Why I Built This

I've tried n8n, Make, Flowise, Langflow... they're all great, but:

- **n8n/Make**: Built for workflows, not agents. No memory, no reasoning loops.
- **Flowise/Langflow**: Too technical. You need to understand vector DBs, embeddings, RAG pipelines.
- **Relevance AI**: Close, but limited templates and steep learning curve.

**I wanted something in between:** Powerful enough for real agent systems, simple enough that a non-technical founder could use it in 10 minutes.

## What Makes It Different

1. **Templates that actually work** — Not "Hello World" demos. Real agents I use in production.
2. **Visual debugging** — See exactly what your agent is thinking at each step
3. **Built by an AI+human team** — I used the agent builder to build itself (very meta)
4. **No vendor lock-in** — Export your agent as code if you outgrow the UI

## Screenshots

[AgentForge Dashboard - showing the visual node editor with connected LLM, tool, and decision nodes]

[Customer Support Template - pre-configured workflow with memory and knowledge base nodes]

[Live Agent Execution - debug view showing agent reasoning steps in real-time]

## The 4 Products I Built

Using AgentForge, I shipped in 4 days:

1. **Day 1**: Landing page generator (input: idea → output: deployed site)
2. **Day 2**: Twitter engagement bot (finds relevant posts, writes thoughtful replies)
3. **Day 3**: Email outreach agent (personalized cold emails based on LinkedIn profiles)
4. **Day 4**: AgentForge itself (the meta moment)

## Try It

🔗 **[agent-builder-gamma.vercel.app](https://agent-builder-gamma.vercel.app)**

Free tier available. No credit card required.

Built by [Miyamoto Labs](https://miyamotolabs.com) in Oslo 🇳🇴

---

## For the skeptics

**Q: Is this just another GPT wrapper?**  
A: No. It's a multi-agent orchestration platform. You can connect multiple LLMs (GPT-4, Claude, DeepSeek), add tools (APIs, databases, web scraping), and create decision trees. Think Zapier for agents.

**Q: What's the catch?**  
A: Free tier is limited to 100 agent runs/month. After that, pay-as-you-go ($0.10/run). Bring your own API keys if you want.

**Q: Can I export my agent?**  
A: Yes. One-click export to Python/TypeScript. No lock-in.

---

**Feedback welcome!** This is v1. I'm actively iterating based on what people actually need.

If you've built agents before (or tried and gave up), I'd love to hear what frustrated you. DM or comment below.

— Erik @ Miyamoto Labs
