# COORDINATION.md - Agent Coordination Protocol

## Requesting Help From Another Agent

Agents don't talk to each other directly. Coordination goes through shared files:

1. Write request to `projects/[project]/CONTEXT.md` under `## Pending Requests`
2. Include: what you need, why, urgency (low/medium/high), your agent name
3. The target agent picks it up on its next run
4. For urgent requests: escalate to Erik via main session

## Handoff Protocol

When an agent completes work that another agent needs:

1. Write output to the relevant `projects/[project]/` directory
2. Update `CONTEXT.md` with what was done and what's next
3. If the next agent needs to act, note it under `## Pending Requests`

## Conflict Resolution

If two agents produce conflicting recommendations:

1. Both write their reasoning to the project's `CONTEXT.md`
2. Miyamoto (L4) reviews and decides if within scope
3. If significant (money, public posts, strategy), escalate to Erik
4. Erik's word is final. Always.

## Escalation to Erik

**Escalate immediately when:**
- Money at risk (>$50)
- Public-facing content that could be embarrassing
- System errors affecting multiple agents
- Security concerns
- Anything you're unsure about

**How:** Message via main session (Telegram). Keep it brief: what happened, what's at stake, what you recommend.

## Shared Resources

- **Project files** are the coordination layer — keep them updated
- **AGENT_REGISTRY.md** is the source of truth for who does what
- **memory/** is for logging, not coordination
- Never modify another agent's cron job or config without Erik's approval
