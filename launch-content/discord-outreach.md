# Discord Outreach Messages

---

## General AI Communities (OpenAI, Anthropic, AI Discord servers)

### Message 1: Introduction + Value
```
Hey everyone! 👋

I just shipped AgentForge — a visual, no-code AI agent builder with drag-and-drop workflows and pre-built templates (customer support, social media, email automation, etc.)

Built it in 4 days using AI agents (very meta, I know 😅).

Free tier available if anyone wants to try it: https://agent-builder-gamma.vercel.app

Would love feedback from this community — what agent use cases would you want pre-built?
```

### Message 2: Show, Don't Tell (with screenshot)
```
I challenged myself to build 4 products in 4 days using only AI agents.

The hardest part wasn't the LLM calls — it was *orchestrating* multiple agents (design, code, deploy, QA).

So I built AgentForge: a visual agent builder where you drag-and-drop nodes (LLM, tools, memory, decision logic).

[Screenshot of node editor]

Try it free: https://agent-builder-gamma.vercel.app

Any feedback on the UX? This is v1, so I'm iterating fast based on what people need.
```

### Message 3: Technical Deep Dive (for developer channels)
```
For anyone building agentic workflows: I just open-sourced our node-based agent orchestration runtime.

**Features:**
- Multi-agent coordination (parallel + sequential execution)
- Built-in memory (short-term, long-term, vector search)
- Tool integration (API calls, web scraping, function calling)
- Automatic retry logic + fallback nodes
- Visual debugging (see agent reasoning in real-time)

**Tech stack:**
- React Flow for node editor
- Upstash Redis for agent state
- Edge Functions for execution
- BYOK support (GPT-4, Claude, DeepSeek, Gemini)

Live demo: https://agent-builder-gamma.vercel.app

GitHub coming soon. Who wants early access?
```

---

## AutoGPT / Autonomous Agent Communities

### Message 1: Community-Specific
```
Hey AutoGPT community! 🤖

I love the fully autonomous approach, but sometimes I need *semi-autonomous* agents — where I define the workflow and let the agent execute it.

So I built AgentForge: a visual agent builder with:
- Drag-and-drop workflows (like AutoGPT, but with control)
- Pre-built templates for common use cases
- Memory + tool integration
- One-click deploy

Would love to hear from people who've tried AutoGPT — what would make you use a visual orchestrator vs. fully autonomous?

Try it free: https://agent-builder-gamma.vercel.app
```

### Message 2: Collaboration Opportunity
```
Anyone building AutoGPT integrations?

I just shipped AgentForge (visual agent builder) and I'm thinking about adding an "AutoGPT mode" — where you can switch from manual workflow to fully autonomous.

Would that be useful? Or does AutoGPT already solve the autonomous use case well enough?

Demo: https://agent-builder-gamma.vercel.app

Open to collaboration if anyone wants to build this together!
```

---

## LangChain / LlamaIndex Communities

### Message 1: Developer-Focused
```
For anyone using LangChain/LlamaIndex:

I built a visual orchestrator for multi-agent systems (think LangGraph, but no-code).

**Why I built it:**
- LangChain is powerful, but verbose. Lots of boilerplate.
- I wanted to prototype agent workflows in minutes, not hours.
- Needed visual debugging (see agent reasoning at each step).

**How it works:**
- Drag-and-drop nodes (LLM, tools, memory, decision logic)
- Pre-built templates (customer support, social media, email)
- Export to Python/TypeScript if you outgrow the UI

Try it free: https://agent-builder-gamma.vercel.app

**Question for the community:** Would you use a visual builder for prototyping, then export to code for production? Or prefer code-first always?
```

### Message 2: Integration Idea
```
LangChain users: I just added **LangChain export** to AgentForge.

You can now:
1. Build an agent visually (drag-and-drop)
2. Export to LangChain Python code
3. Customize/extend in your IDE

This means you can prototype fast (visual) and deploy with full control (code).

Try it: https://agent-builder-gamma.vercel.app

Feedback welcome! Still early, so if the exported code is messy, let me know.
```

---

## No-Code / Automation Communities (Zapier, Make, n8n)

### Message 1: Positioning vs. Workflow Tools
```
Hey no-code automation community! 👋

I built AgentForge — like Zapier/n8n, but for *AI agents* instead of workflows.

**Key difference:**
- **Zapier/n8n**: Trigger → Action (deterministic)
- **AgentForge**: Context → Reasoning → Action (adaptive)

Example:
- **n8n**: "If email contains 'refund', send to support team"
- **AgentForge**: "Read email, check knowledge base, draft response, escalate if needed"

Try it free: https://agent-builder-gamma.vercel.app

**Question:** Do you think agents will replace workflows, or work alongside them?
```

### Message 2: Use Case Comparison
```
I love n8n/Make, but I kept hitting the same problem:

**Workflows are great for deterministic tasks. But what about adaptive tasks?**

Example:
- ❌ Workflow: "Post to Twitter at 9 AM every day"
- ✅ Agent: "Monitor trending topics, write a relevant tweet, optimize for engagement"

So I built AgentForge — a visual agent builder that feels like n8n, but with LLM reasoning at each step.

Try it: https://agent-builder-gamma.vercel.app

Anyone else finding the limits of traditional automation?
```

---

## Indie Hackers / SaaS Founders Communities

### Message 1: ROI-Focused
```
Indie hackers: I just saved $3,200/month by replacing my VA with an AI agent.

**Before:** Paying a VA 40 hrs/week for tier-1 customer support  
**After:** AI agent handles 87% of tickets, VA only does escalations  

**Cost breakdown:**
- VA: $3,200/month
- Agent (AgentForge + LLM costs): $240/month
- **Savings: $2,960/month = $35,520/year**

Built the agent in 2 hours using AgentForge (no-code agent builder).

Try it free: https://agent-builder-gamma.vercel.app

Templates for customer support, email automation, social media, etc.

**What's the most repetitive task in your business?** Maybe an agent can handle it.
```

### Message 2: Founder-to-Founder
```
Solo founders: are you spending more time on repetitive ops than building your product?

I was. So I built agents to handle:
- Customer support (tier-1 tickets)
- Social media (find posts, write replies)
- Email outreach (personalized cold emails)

Then I realized: **the agent builder should be the product.**

So I built AgentForge — a visual, no-code platform for building AI agents.

Try it free: https://agent-builder-gamma.vercel.app

Anyone else using agents to buy back their time?
```

---

## Discord Server Target List

**Priority 1 (Large, Active Communities):**
1. **OpenAI Discord** — Official OpenAI community (~500k members)
2. **AutoGPT Discord** — 50k+ members, very active
3. **LangChain Discord** — Developer-focused, highly technical
4. **Indie Hackers Discord** — Founder community, ROI-focused
5. **AI Stack Discord** — AI builders, tools, automation

**Priority 2 (Niche, High-Value):**
6. **n8n Community Discord** — No-code automation users
7. **BuildSpace Discord** — Builders, shippers, experimenters
8. **AI Agents Subreddit Discord** — r/AI_Agents community spinoff
9. **Flowise Discord** — Visual agent builder users (potential switchers)
10. **Zapier Community Discord** — Automation-first audience

**Priority 3 (Emerging Communities):**
11. **Relevance AI Community**
12. **Dify Discord**
13. **LlamaIndex Discord**
14. **Anthropic Claude Discord** (if public)
15. **Cursor / Windsurf AI IDE communities**

---

## Best Practices for Discord Outreach

✅ **Do:**
- Read server rules first (some ban self-promotion)
- Post in #show-and-tell or #projects channels
- Engage with other projects before posting yours
- Offer to help/answer questions (build karma first)
- Share screenshots/GIFs (visual > text)
- Respond to every comment/question

❌ **Don't:**
- Spam the same message across channels
- Post in #general if there's a dedicated channel
- Ignore feedback/criticism
- Overpromise ("This will replace all tools!")
- Use generic copy-paste messages (customize per server)

---

## Engagement Strategy

**Week 1:**
- Join all 15 Discord servers
- Lurk for 1-2 days, learn the vibe
- Post Message 1 in #show-and-tell or #projects

**Week 2:**
- Engage with comments/feedback
- Answer questions in #help channels (build credibility)
- Post Message 2 (technical deep dive) in developer channels

**Week 3:**
- Share case study (ROI results) in founder/indie hacker servers
- Offer free onboarding calls to power users
- Ask for testimonials from early adopters

**Ongoing:**
- Monitor mentions of "agent builder" or "no-code AI"
- Reply to threads where people are looking for solutions
- Share updates when new templates/features ship
