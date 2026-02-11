# Discord Agent Swarm Guide (JUMPERZ)

**Source:** Notion memo (via @jumperz on X)
**Date:** 2026-02-09
**Tags:** #agents #architecture #coordination #discord #openclaw

## Summary
Guide for building a multi-agent swarm in Discord using OpenClaw. 5 persistent named agents (Find, Build, Track, Watch, Create) coordinated by a "Brain" agent. Uses Discord channels as database/memory. Model tiering: Opus for complex work, Haiku/Sonnet for everything else.

## Key Takeaways
1. **Named agents > anonymous sub-agents** — easier to reference and remember
2. **Discord channels as persistence layer** — no database needed, already searchable and threaded
3. **Interns pattern** — spawn temporary workers for parallel tasks, pay only for what you use
4. **Drop-links auto-research** — paste a link, system auto-summarizes and archives
5. **Model tiering saves 80% costs** — only coordinator and builder need Opus

## Applicable to Miyamoto Labs
- We already have most of this (sub-agents, heartbeats, crons, memory files)
- Could adopt: named agents, drop-link auto-summarize, agent-to-agent handoff
- Our advantage: Telegram (lighter), real trading bots, Twilio/email/browser automation, x402 payments, self-healing Janitor
