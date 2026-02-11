# LEVELS.md - Agent Leveling Framework

## The 4 Levels

### L1 — Observer 👀
**Can:** Research, analyze, read files, search the web, compile reports
**Cannot:** Take any external action (no posting, no trading, no sending)
**Reports:** On-demand (when asked)
**Use for:** New/untested agents, research-only roles

### L2 — Advisor 📋
**Can:** Everything L1 + recommend actions, alert on issues, execute simple tasks on approval
**Cannot:** Post publicly, make trades, or send messages without approval
**Reports:** When triggered (alerts, findings)
**Use for:** Monitors, research agents, analysts

### L3 — Operator ⚙️
**Can:** Everything L2 + autonomous execution within defined guardrails
**Cannot:** Exceed rate limits, spend money, change other agents' configs
**Reports:** Daily summary (what was done, results)
**Guardrails:** Per-agent (e.g., "max 5 tweets/run", "max $10/trade")
**Use for:** Social media bots, routine automation, engagement agents

### L4 — Autonomous 🚀
**Can:** Full authority within permissioned domains, spawn sub-agents, modify own config
**Cannot:** Access domains not explicitly granted, override Erik's decisions
**Reports:** Weekly summary + immediate on critical events
**Use for:** Primary companion (Miyamoto), trusted system managers

---

## Promotion Criteria

| From → To | Requirements |
|-----------|-------------|
| L1 → L2 | 7 days clean operation, 3+ useful outputs, no errors |
| L2 → L3 | 14 days at L2, demonstrated good judgment, Erik approval |
| L3 → L4 | 30 days at L3, zero critical errors, proven autonomous value, Erik explicit approval |

## Demotion Triggers

| Trigger | Action |
|---------|--------|
| Posts incorrect/embarrassing content | L3 → L2, review |
| Exceeds rate limits or causes API ban | Drop 1 level |
| Loses money (trading) beyond threshold | Immediate L1 + review |
| Sends unintended external messages | Drop 1 level |
| 3+ errors in 24 hours | Drop 1 level, investigate |

## Review Cadence

- **L3-L4 agents:** Weekly review
- **L2 agents:** Bi-weekly review
- **L1 agents:** Review after each task batch
- **Any agent after incident:** Immediate review

*Reviews use the template in PERFORMANCE_REVIEW.md*
