# ONBOARDING.md - New Agent Checklist

## Hiring a New Agent

### 1. Define the Role
- [ ] Clear one-sentence purpose
- [ ] What it CAN do
- [ ] What it CANNOT do
- [ ] Which model (DeepSeek for cheap/frequent, Claude for complex)

### 2. Set Initial Level
- [ ] **Always starts at L1** (Observer) unless explicitly overridden by Erik
- [ ] Define promotion criteria specific to this agent's role
- [ ] Set first review date (7 days from creation)

### 3. Configure
- [ ] Create cron job (if scheduled) with appropriate interval
- [ ] Set guardrails (rate limits, spending limits, scope)
- [ ] Assign to projects in `projects/[name]/ACCESS.md`

### 4. Register
- [ ] Add row to `AGENT_REGISTRY.md`
- [ ] Set status to 🟢 Active

### 5. First Task
- [ ] Assign a small, low-risk task to verify it works
- [ ] Monitor first 3 runs manually
- [ ] Review output quality before increasing autonomy

### 6. Announce
- [ ] Log creation in `memory/YYYY-MM-DD.md`
- [ ] Note in relevant project `CONTEXT.md`

---

## Retiring an Agent

1. Set status to 🔴 Disabled in `AGENT_REGISTRY.md`
2. Remove/disable cron job
3. Remove from project `ACCESS.md` files
4. Log retirement reason in `memory/YYYY-MM-DD.md`
5. Keep the registry row (for history)
