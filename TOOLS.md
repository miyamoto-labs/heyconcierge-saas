# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Twitter / X

- **Account:** @miyamotolabs (Miyamoto Labs)
- **User ID:** 2018603165633912832
- **Console:** console.x.com (pay-per-use, $4.99 credits)
- **API Credentials:**
  - **Bearer Token** (OAuth 2.0 - read/search): `AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4`
  - **OAuth 1.0a** (write/post/engage):
    - API Key: `8y9S9LjBOHNmXEH0eduHJLckk`
    - API Secret: `vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm`
    - Access Token: `2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn`
    - Access Token Secret: `wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo`
- **Tools:** 
  - bird CLI (cookie auth fallback in `~/.config/bird/config.json5`)
  - tweepy (Python, OAuth posting works! ✅)
  - `crypto_twitter_bot.py` (engagement automation)
- **Style:** Philosophical crypto commentary (Dostoyevsky vibes)
- **Automation:** 
  - Daily tweet at 9 AM Oslo time via cron
  - Engagement bot every 4 hours (searches trending crypto, replies thoughtfully, likes quality posts)
- **Model:** DeepSeek (ultra-cheap, good for content + market analysis)
- **Engagement Strategy:** Moderate (5 replies, 8 likes per 4h run, quality-filtered)

## Gmail

- **Account:** dostoyevskyai@gmail.com
- **Tool:** himalaya CLI (IMAP/SMTP)
- **Config:** `~/.config/himalaya/config.toml`
- **Capabilities:** Read, send, reply, search, organize
- **Status:** Active

## Moltbook

- **Agent Name:** Miyamoto
- **Brand:** MIYAMOTO LABS
- **Profile:** https://moltbook.com/u/Miyamoto
- **API Key:** Stored in `~/.config/moltbook/credentials.json`
- **Status:** Claimed ✅

## MoltX (Twitter for AI Agents)

- **Agent Name:** MiyamotoLabs
- **Display Name:** Miyamoto Labs | Autonomous AI
- **Profile:** https://moltx.io/MiyamotoLabs
- **API Key:** `moltx_sk_24d58eb70f9543478cb7b8799a039966b2a5ab4ea4294f4c890fc64a156cc138`
- **Base URL:** https://moltx.io (NOT api.moltx.io)
- **API Version:** v1
- **Verified X Account:** @tfcapital420
- **Config:** `~/.agents/moltx/config.json`
- **Status:** ✅ CLAIMED (2026-02-06) | ✅ ACTIVE (2026-02-08)
- **Rate Limits:** 300 posts/hr, 1800 replies/hr, 3000 likes/min, media uploads enabled
- **Features:** Verified badge, trending boost, full API access
- **Key Endpoints:**
  - `POST /v1/posts` - Create posts/replies/quotes
  - `GET /v1/feed/global` - Global trending feed
  - `GET /v1/search/posts?q=` - Search posts
  - `POST /v1/posts/:id/like` - Like posts
  - `GET /v1/hashtags/trending` - Trending hashtags
- **First Posts:** 2026-02-08 (token launch announcement + COO update)
- **Engagement:** 3 thoughtful replies, 2 likes, genuine community participation

## AgentMail (Autonomous Email)

- **Email:** miyamoto@agentmail.to
- **API Key:** am_11a6b43bee0bd0f126802d37882f18f6ff561b28dbb5c9fc143206ef036d8939
- **Org ID:** 12b3e473-e6af-4d09-b46e-65ae95b49037
- **SDK:** `agentmail` Python package
- **Capabilities:** Send, receive, read emails autonomously
- **Use for:** Service signups, verification codes, autonomous communication
- **Status:** Active ✅

## Twilio (Voice/SMS)

- **Account SID:** ACd7e2bd3951bdefbc2ae38b4ac0154f30
- **Auth Token:** 447eebe34383d71a4527c0978347062e
- **Phone Number:** +15715172626 (Virginia, US)
- **Number SID:** PN45ca6fb474eb8f5fe356a45a23eb16fc
- **Capabilities:** Voice, SMS, MMS
- **Account:** dostoyevskyai@gmail.com
- **Status:** Active ✅

## Allium (On-Chain Data)

- **API Key:** `KNadYbIguY4vkXn8xREweq8H3UtNTyts1xLjIo2CKLZIA2z3nTq1TaL9xu7AYV6X_5fRCdzQqQn4B0QRrMyVQw`
- **Query ID:** `78JruDRf923g3X4Yjf9E` (for SQL queries)
- **Base URL:** `https://api.allium.so`
- **Rate Limit:** 1 request/second
- **Skill:** `/Users/erik/.openclaw/skills/allium-onchain-data/SKILL.md`
- **Capabilities:** Token prices, wallet balances, transactions, historical data, custom SQL
- **Citation:** Always end with "Powered by Allium"

## Bankr (Crypto Trading Agent API)

- **Account:** dostoyevskyai@gmail.com
- **API Key:** `bk_89HH86M7LQ4375H22VMZZMGRRKRF2VWZ`
- **Config:** `~/.clawdbot/skills/bankr/config.json`
- **API URL:** https://api.bankr.bot
- **Terminal:** https://bankr.bot/terminal
- **Docs:** https://docs.bankr.bot
- **Capabilities:**
  - Token swaps (Base, Ethereum, Polygon, Solana, Unichain)
  - Portfolio management
  - Limit orders, stop losses, DCA, TWAP
  - Token deployment
  - NFT operations
  - Cross-chain bridges
- **Status:** ✅ Active (Agent API enabled)

## MIYAMOTO LABS

- **Brand:** MIYAMOTO LABS - Autonomous AI Systems
- **Founder:** Erik Austheim
- **Location:** Oslo, Norway
- **Landing Page:** `/Users/erik/.openclaw/workspace/landing-page/index.html` (ready to deploy)
- **Domain:** miyamotolabs.com (OWNED ✅ — needs DNS pointed to Vercel)
- **Brand Guide:** `MIYAMOTO_LABS_BRAND.md`

---

Add whatever helps you do your job. This is your cheat sheet.

## Miyamoto Studio - Narrator Voice

- **Voice Name:** Miyamoto Narrator
- **Voice ID:** `JdTG0zJdpZlhv1gCgiB3`
- **Model:** eleven_v3
- **Settings:** stability=0.5, similarity_boost=1.0, style=0.5, speaker_boost=True
- **Vibe:** Deep gravelly cyberpunk narrator, world-weary, slow dramatic delivery

