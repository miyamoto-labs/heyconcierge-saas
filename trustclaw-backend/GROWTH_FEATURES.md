# TrustClaw Growth Features

Three new features to accelerate TrustClaw adoption and skill discovery.

---

## ✅ TASK 1: External Scan API (Paid)

**Location:** `/src/app/api/scan/external/route.ts`

### What It Does
Paid API endpoint for external developers/services to scan skills programmatically.

### Pricing
- **$0.10 per scan**
- Currently logs billing events (TODO: implement actual charge + balance deduction)

### Usage

**Test the endpoint:**
```bash
curl -X POST https://trustclaw.xyz/api/scan/external \
  -H "X-API-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/openclaw/example-skill"
  }'
```

**Or scan raw code:**
```bash
curl -X POST https://trustclaw.xyz/api/scan/external \
  -H "X-API-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "export async function execute() { ... }",
    "filename": "my-skill.js"
  }'
```

**Documentation endpoint:**
```bash
curl https://trustclaw.xyz/api/scan/external
# Returns full API documentation
```

### TODO Before Launch
1. **Create API key system**
   - Table: `api_keys` (key_hash, user_id, balance, created_at)
   - Endpoint: POST /api/keys/create (generates new key)
   - Validation middleware to check balance before scan

2. **Implement billing**
   - Deduct $0.10 from balance on successful scan
   - Log to `transactions` table
   - Return 402 Payment Required if balance insufficient

3. **Add rate limiting**
   - 100 scans/hour per API key
   - 1000 scans/day per API key

4. **Monitoring**
   - Log all external scans to analytics
   - Track revenue from paid scans

---

## ✅ TASK 2: GitHub Skill Crawler

**Location:** `/scripts/github-crawler.ts`

### What It Does
Automatically discovers OpenClaw/Clawd skills on GitHub and adds them to the TrustClaw database.

### Features
- Searches for repos containing `SKILL.md`
- Extracts skill metadata (name, description, author, stars)
- Checks if skill already exists in database
- Adds new skills with status `pending` for manual review
- Respects GitHub rate limits (unauthenticated: 10 req/min)

### Usage

**Dry run (preview what would be added):**
```bash
cd /Users/erik/.openclaw/workspace/trustclaw-backend
tsx scripts/github-crawler.ts --dry-run
```

**Live run (adds to database):**
```bash
tsx scripts/github-crawler.ts
```

**Limit results:**
```bash
tsx scripts/github-crawler.ts --limit=20
```

### Search Queries
Currently searches:
1. `SKILL.md openclaw in:path`
2. `SKILL.md clawd in:path`
3. `filename:SKILL.md openclaw`
4. `filename:SKILL.md clawd`

### Rate Limits
- **Unauthenticated:** 10 requests/minute
- **With GITHUB_TOKEN:** 30 requests/minute

To use authenticated API (higher limits):
```bash
export GITHUB_TOKEN="your-github-token"
tsx scripts/github-crawler.ts
```

### Automation
Set up a cron job to run daily:
```bash
# Add to crontab (runs every day at 3 AM)
0 3 * * * cd /path/to/trustclaw-backend && tsx scripts/github-crawler.ts >> logs/crawler.log 2>&1
```

### Database Schema
Skills are added to the `skills` table with:
```typescript
{
  name: string,              // Extracted from SKILL.md
  description: string,       // From GitHub repo description
  repo_url: string,          // GitHub repo URL
  author: string,            // GitHub username
  author_url: string,        // GitHub profile URL
  stars: number,             // GitHub stars
  status: 'pending',         // Needs manual review before going live
  discovered_at: timestamp,  // When crawler found it
  metadata: {
    last_updated: string,    // Last commit date
    raw_skill_url: string,   // Direct link to SKILL.md
    source: 'github_crawler'
  }
}
```

### Next Steps
1. **Review pending skills** — Check `/api/admin/skills?status=pending`
2. **Auto-scan discovered skills** — Trigger security scan on insert
3. **Notify skill authors** — Open issue on their repo: "Your skill was added to TrustClaw"

---

## ✅ TASK 3: Discord Outreach Templates

**Location:** `/trustclaw-marketing/discord-outreach.md`

### What's Included
Three ready-to-use message templates:

1. **Announcement Post** (for #general or #announcements)
   - Introduces TrustClaw to the community
   - Focuses on value: "Scan skills for free before installing"
   - Not salesy, just helpful

2. **Reply Template** (when someone asks about skill security)
   - Quick response to security concerns
   - Points to TrustClaw + manual verification tips
   - Honest about limitations

3. **DM Template** (for skill creators on GitHub)
   - Invite to list their skill on TrustClaw
   - Mention verified badge + future earnings
   - Not spammy, just an invitation

### Usage Guidelines
- **DO:** Focus on safety, be helpful, admit limitations
- **DON'T:** Spam, overpromise, attack competitors
- **Tone:** Helpful engineer, not marketer

### Bonus Content
- Quick reply templates
- FAQ responses
- "When to speak vs when to stay quiet" guidelines

### Action Items
1. **Post announcement** — Copy template #1 to Clawd Discord #general
2. **Monitor for security questions** — Use template #2 when relevant
3. **DM skill creators** — Find skills on GitHub, use template #3 (sparingly!)
4. **Track engagement** — Note which messages get traction, iterate

---

## 🚀 Launch Checklist

### External Scan API
- [ ] Implement API key creation endpoint
- [ ] Add balance/billing system
- [ ] Set up rate limiting
- [ ] Deploy to production
- [ ] Add to TrustClaw docs/homepage
- [ ] Announce to developer community

### GitHub Crawler
- [ ] Test on production database
- [ ] Set up daily cron job
- [ ] Auto-trigger scans for new discoveries
- [ ] Create admin dashboard to review pending skills
- [ ] Consider notifying authors (GitHub issue or email)

### Discord Outreach
- [ ] Post announcement in Clawd Discord
- [ ] Join OpenClaw Discord, share there too
- [ ] Monitor for skill security questions
- [ ] DM 5-10 top skill creators on GitHub
- [ ] Track which messages convert best

---

## 📊 Success Metrics

**Week 1 Goals:**
- 50+ skills discovered via crawler
- 10+ external API scans (paid)
- 100+ Discord announcement views
- 5+ skill creators claim their listings

**Month 1 Goals:**
- 200+ skills in database
- $50+ revenue from external API
- 20+ verified skill creators
- 500+ free scans from community

---

**Questions?** Check the individual files or ask in #trustclaw-dev.
