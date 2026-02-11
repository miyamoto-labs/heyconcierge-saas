# EasyPoly Launch Checklist

## Status: 🟡 TESTING

### Pre-Launch Checklist

#### ✅ Infrastructure
- [x] Landing page deployed (easypoly.lol)
- [x] Bot deployed (Railway)
- [x] Trader running (Mac mini, port 3001)
- [x] Cloudflare tunnel active
- [x] Database setup (SQLite with encrypted credentials)
- [x] Stripe payments live ($9/mo Pro)

#### 🟡 Testing In Progress
- [ ] Landing page `/connect` flow works
- [ ] Bot `/start` shows "Connect Wallet" button
- [ ] Callback endpoint receives credentials
- [ ] Credentials stored encrypted in database
- [ ] `/wallet` command shows connected wallet
- [ ] BET button triggers with user credentials
- [ ] Order placed in USER's Polymarket account (not Erik's)
- [ ] Pick generator runs 2x daily
- [ ] Paywall kicks in after 5 free picks

#### 📋 Pre-Launch Tasks
- [ ] Add WELCOME_LANDING_URL env var to Railway bot
- [ ] Test full user journey start-to-finish
- [ ] Test with real Polymarket account (non-Erik)
- [ ] Verify order execution on Polymarket CLOB
- [ ] Test error handling (wrong credentials, insufficient balance)

### Launch Sequence

#### Phase 1: Soft Launch (Friends & Family)
- [ ] Invite 5-10 beta testers
- [ ] Collect feedback on onboarding flow
- [ ] Monitor first 24h of picks/bets
- [ ] Fix any critical bugs

#### Phase 2: Public Launch
- [ ] Twitter announcement (@miyamotolabs)
- [ ] Post in r/Polymarket, r/CryptoMarkets
- [ ] Product Hunt submission
- [ ] Farcaster post (via Neynar)
- [ ] Discord announcements (crypto trading servers)

#### Phase 3: Growth
- [ ] Referral system (invite friends, get free picks)
- [ ] Add more strategies (whale following, news trading)
- [ ] Auto-position tracking (show user P&L)
- [ ] Mobile app wrapper (Telegram Mini App)

---

## Test Plan

### Test 1: New User Onboarding
1. Send `/start` to @EasyPolyBot
2. Click "🔗 Connect Wallet" button
3. Opens easypoly.lol/connect?user_id=XXXX
4. Follow 3-step guide to get Polymarket API keys
5. Paste credentials
6. Click "Connect Account"
7. Bot confirms: "✅ Connected! [wallet]"
8. Send `/wallet` → should show connected credentials

**Expected:** Smooth flow, clear instructions, success confirmation

### Test 2: Bet Placement
1. Trigger test pick broadcast (or wait for real pick)
2. User receives pick with BET buttons
3. Click "🎯 $5" button
4. Bot confirms: "🎯 Placing $5 bet..."
5. Trader receives request with user's API credentials
6. Order placed on Polymarket CLOB
7. Bot confirms: "✅ Bet placed! Order: XXXXX"
8. Verify order exists in user's Polymarket account (not Erik's)

**Expected:** Bet placed in user's wallet, not fallback wallet

### Test 3: Error Handling
1. User with no credentials clicks BET
2. Should see: "🔗 Connect Your Wallet" with button
3. User with wrong credentials clicks BET
4. Should see: "❌ Your API credentials may be expired. Use /disconnect then /connect"
5. User with insufficient balance clicks BET
6. Should see: "❌ Insufficient balance. Deposit at polymarket.com"

**Expected:** Helpful error messages, no crashes

### Test 4: Paywall
1. Free user receives 5 picks
2. On 6th pick, sees paywall instead of pick
3. Paywall shows: "🔒 You've used your 5 free picks! Upgrade to Pro ($9/mo)"
4. Click upgrade → Stripe checkout
5. Complete payment
6. Bot confirms Pro status
7. User now receives unlimited picks

**Expected:** Smooth upgrade flow, Pro unlocked immediately

---

## Deployment URLs

- **Landing:** https://easypoly.lol
- **Connect:** https://easypoly.lol/connect
- **Bot:** @EasyPolyBot (Railway)
- **Trader:** http://localhost:3001 (Mac mini)
- **Cloudflare Tunnel:** (ephemeral, needs permanent)

---

## Environment Variables

### Bot (Railway)
```
BOT_TOKEN=<telegram_bot_token>
TRADER_URL=<cloudflare_tunnel_url>
TRADER_KEY=pm-trader-erik-2026
API_SECRET=easypoly-2026
ENCRYPTION_KEY=<32_byte_hex>
DB_FILE=/data/easypoly.db
FREE_PICKS=5
STRIPE_SECRET_KEY=<live_secret>
STRIPE_WEBHOOK_SECRET=<webhook_secret>
WELCOME_LANDING_URL=https://easypoly.lol  # ← ADD THIS
```

### Landing (Vercel)
```
NEXT_PUBLIC_BOT_CALLBACK_URL=https://easypoly-bot-production.up.railway.app/callback/wallet
```

---

## Known Issues

- [ ] Cloudflare tunnel is ephemeral (needs named tunnel + DNS)
- [ ] Domain easypoly.bet pending on Porkbun (use .lol for now)
- [ ] No wallet balance check before showing picks
- [ ] No P&L tracking yet

---

## Success Metrics (Week 1)

- **Signups:** 50+ users
- **Connections:** 30+ wallets connected (60% conversion)
- **Bets Placed:** 100+ real bets
- **Pro Conversions:** 5+ paying subscribers ($45 MRR)
- **Pick Accuracy:** >55% win rate

---

**Next Step:** Add WELCOME_LANDING_URL to Railway, then test full flow end-to-end.
