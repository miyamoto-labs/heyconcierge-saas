# TrustClaw Growth Features - Deployment Guide

## 🎯 What Was Built

### 1. **External Scan API** ($0.10/scan)
**File:** `src/app/api/scan/external/route.ts`

Monetized API endpoint for developers/services to scan skills programmatically.

**Key Features:**
- Accepts GitHub URL or raw code
- Returns detailed security findings
- $0.10 per scan (billing stub implemented)
- Self-documenting (GET returns API docs)
- Proper error handling + cost tracking

**Status:** ✅ Code complete — needs billing integration before production

---

### 2. **GitHub Skill Crawler**
**File:** `scripts/github-crawler.ts`

Automated skill discovery system that finds OpenClaw/Clawd skills on GitHub.

**Key Features:**
- Searches multiple query patterns
- Extracts skill metadata automatically
- Deduplicates by repo URL
- Respects GitHub rate limits
- Dry-run mode for testing
- Adds skills with `pending` status for review

**Status:** ✅ Ready to run — test with `--dry-run` first

---

### 3. **Discord Outreach Templates**
**File:** `../trustclaw-marketing/discord-outreach.md`

Pre-written, authentic messaging for community growth.

**Includes:**
- Announcement post for Discord channels
- Reply template for security questions
- DM template for skill creators
- FAQ responses
- Usage guidelines (tone, frequency, etc.)

**Status:** ✅ Ready to use — copy/paste and adapt to context

---

## 🚀 Quick Start

### Deploy External Scan API

1. **Complete billing integration:**
   ```typescript
   // TODO in src/app/api/scan/external/route.ts
   // - Create api_keys table
   // - Implement balance checking
   // - Log transactions
   ```

2. **Deploy to production:**
   ```bash
   cd trustclaw-backend
   vercel deploy --prod
   ```

3. **Test it:**
   ```bash
   curl https://trustclaw.xyz/api/scan/external \
     -H "X-API-Key: test-key" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://github.com/openclaw/example-skill"}'
   ```

---

### Run GitHub Crawler

1. **Test with dry run:**
   ```bash
   cd trustclaw-backend
   tsx scripts/github-crawler.ts --dry-run --limit=10
   ```

2. **Run for real:**
   ```bash
   tsx scripts/github-crawler.ts --limit=50
   ```

3. **Set up automation (optional):**
   ```bash
   # Add to crontab (runs daily at 3 AM)
   crontab -e
   # Add this line:
   0 3 * * * cd /path/to/trustclaw-backend && tsx scripts/github-crawler.ts >> logs/crawler.log 2>&1
   ```

4. **Add GitHub token for higher rate limits:**
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   tsx scripts/github-crawler.ts
   ```

---

### Launch Discord Outreach

1. **Post announcement:**
   - Open `trustclaw-marketing/discord-outreach.md`
   - Copy "Announcement Post" template
   - Paste to Clawd Discord #general or #announcements
   - Personalize if needed

2. **Prepare for questions:**
   - Keep "Reply Template" handy
   - Monitor #general for security questions
   - Use template as starting point, adapt to context

3. **Reach out to creators (sparingly):**
   - Find skills on GitHub (use crawler results)
   - Use "DM Template" for top creators
   - Don't spam — max 5-10 DMs to start

---

## 📋 Pre-Launch Checklist

### External Scan API
- [ ] Create `api_keys` table in Supabase
- [ ] Implement API key generation endpoint
- [ ] Add balance checking logic
- [ ] Create `transactions` table for billing
- [ ] Add rate limiting (100/hour per key)
- [ ] Test with real API key
- [ ] Deploy to production
- [ ] Add to TrustClaw homepage/docs
- [ ] Announce to developer community

### GitHub Crawler
- [ ] Test dry run on production database
- [ ] Verify Supabase connection works
- [ ] Run first batch (limit=50)
- [ ] Review pending skills manually
- [ ] Consider auto-triggering scans for new skills
- [ ] Set up daily cron job (optional)
- [ ] Create admin dashboard for pending skills

### Discord Outreach
- [ ] Join Clawd Discord if not already in
- [ ] Read channel rules/guidelines
- [ ] Post announcement (template #1)
- [ ] Monitor for questions
- [ ] Use reply template when relevant
- [ ] Identify top 10 skill creators on GitHub
- [ ] Send DMs to creators (template #3)
- [ ] Track which messages convert

---

## 🗄️ Database Schema Additions

You may need these tables for full functionality:

### `api_keys` table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id),
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'))
);
```

### `transactions` table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id),
  type TEXT NOT NULL CHECK (type IN ('scan', 'topup')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Update `skills` table (if needed)
```sql
-- Add columns for crawler metadata
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS author_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;
```

---

## 🧪 Testing

Run the test script:
```bash
cd trustclaw-backend
./scripts/test-features.sh
```

This will:
1. Test the external scan API documentation endpoint
2. Run the GitHub crawler in dry-run mode
3. Verify all files were created

---

## 📊 Success Metrics

Track these after launch:

### Week 1
- [ ] 50+ skills discovered via crawler
- [ ] 10+ external API scans (paid)
- [ ] 100+ Discord announcement views
- [ ] 5+ skill creators claim listings

### Month 1
- [ ] 200+ skills in database
- [ ] $50+ revenue from external API
- [ ] 20+ verified skill creators
- [ ] 500+ free scans from community

---

## 🐛 Troubleshooting

**GitHub Crawler rate limited:**
- Add `GITHUB_TOKEN` env var
- Increase `RATE_LIMIT_DELAY` in script
- Use `--limit=10` for testing

**External Scan API not working:**
- Check if Next.js dev server is running
- Verify scanner library exists (`src/lib/scanner.ts`)
- Check console for errors

**Discord messages getting flagged:**
- Don't spam channels
- Space out messages (1 announcement max)
- DMs only to skill creators, not random users
- If warned by mods, apologize and adjust

---

## 📞 Support

Questions? Check:
- `GROWTH_FEATURES.md` — Full feature documentation
- Individual files for implementation details
- Supabase dashboard for database issues

---

**Built:** 2026-02-07  
**Status:** Ready for deployment  
**Next Step:** Complete billing integration, then launch! 🚀
