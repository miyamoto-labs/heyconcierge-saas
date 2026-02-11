# EasyPoly 3-Option Wallet Setup

## Problem Solved
**Original issue:** 3-step API credential flow was too technical for normies (find API page, generate key, copy 3 fields).

**Solution:** Three options that cover all user types.

---

## The Three Options

### Option 1: 🆕 Create New Wallet
**Target:** New to Polymarket (60% of users)

**Flow:**
1. Click "Create New Wallet"
2. Bot generates new Polygon wallet
3. Bot derives CLOB API credentials automatically
4. Shows deposit address
5. User funds wallet → ready to bet

**Pros:**
- Dead simple (one click)
- No technical knowledge needed
- Bot manages everything

**Cons:**
- User must fund new wallet
- Small trust requirement (bot holds encrypted key)

**Security:**
- Private key encrypted with AES-256-GCM
- Stored in SQLite database
- User can `/export` key anytime to move funds

---

### Option 2: 📥 Import Wallet
**Target:** Already has Polymarket wallet (35% of users)

**Flow:**
1. Click "Import Wallet"
2. Paste private key (one field)
3. Bot derives CLOB credentials
4. Instantly ready (wallet already funded)

**Pros:**
- One field instead of three
- Keep using existing wallet
- No new funding needed
- Familiar to crypto users

**Cons:**
- Requires trusting bot with private key
- More technical than "Create"

**Security:**
- Private key encrypted immediately
- Used only to derive API credentials
- Never shared externally
- User can `/export` to verify/backup

---

### Option 3: ⚙️ Advanced Setup
**Target:** Paranoid/power users (5% of users)

**Flow:**
1. Click "Advanced Setup"
2. Opens guided web page (existing 3-step flow)
3. Get Polymarket API credentials manually
4. Paste key, secret, passphrase

**Pros:**
- Maximum security
- User maintains full control
- Never shares private key

**Cons:**
- Most technical
- Requires finding Polymarket API settings
- Three fields to copy/paste

**Security:**
- Bot only receives API credentials (not private key)
- User generates keys on polymarket.com
- Keys can be revoked anytime

---

## Technical Implementation

### Bot Changes
- Updated `/start` command to show 3 buttons
- Added handlers for `SETUP_CREATE` and `SETUP_IMPORT` callbacks
- Updated message handler to accept private key input
- Added `/export` command to reveal private key
- Updated `/wallet` command to show export option

### Trader Service Changes
- Added `POST /create-wallet` endpoint
  - Generates new Ethereum wallet
  - Derives CLOB API credentials
  - Returns wallet address + private key + API creds
- Added `POST /import-wallet` endpoint
  - Accepts private key
  - Validates format
  - Derives CLOB API credentials
  - Returns wallet address + API creds

### Database Changes
- Added `poly_private_key` column (encrypted)
- Updated `setPolyCredentials` to accept private key parameter
- Added `getPrivateKey` method for `/export` command

---

## Security Model

### What's Encrypted
- API Key (AES-256-GCM)
- API Secret (AES-256-GCM)
- API Passphrase (AES-256-GCM)
- Private Key (AES-256-GCM) - only for Create/Import

### What's Not Stored
- User passwords
- Wallet seed phrases
- Transaction history (retrieved live from CLOB)

### Encryption Key
- 32-byte hex key in `ENCRYPTION_KEY` env var
- Unique per deployment
- Never exposed in logs or API responses

---

## User Commands

### `/start`
Shows 3-option connection flow (or welcome if already connected)

### `/wallet`
Shows connected wallet info, API key (masked), and address

### `/export`
Reveals private key (only available for Create/Import wallets)

### `/disconnect`
Removes all credentials and private key from database

### `/status`
Shows picks received, remaining free picks, Pro status

### `/subscribe`
Stripe checkout for Pro upgrade ($9/mo unlimited picks)

---

## Deployment Status

**Bot:** Deploying to Railway (commit: 9affb12)  
**Trader:** Restarted locally with new endpoints (PID: 43689)  
**Database:** Schema migrated, new column added

---

## Testing Checklist

- [ ] Send `/start` → verify 3 buttons appear
- [ ] Click "Create New Wallet" → verify wallet generated + deposit address shown
- [ ] Send `/wallet` → verify wallet info displayed
- [ ] Send `/export` → verify private key revealed
- [ ] Click "Import Wallet" → paste test private key → verify import works
- [ ] Click "Advanced Setup" → verify opens web page
- [ ] Test bet placement with created wallet
- [ ] Test `/disconnect` → verify credentials removed

---

## Next Steps (Post-Launch)

1. **Wallet Balance Check**
   - Before sending picks, check if user has sufficient USDC
   - Show "Fund your wallet" message if balance < $5

2. **P&L Tracking**
   - Fetch user's Polymarket positions
   - Calculate unrealized P&L
   - Show in `/wallet` or `/stats`

3. **Auto-Withdrawal**
   - `/withdraw <amount>` command
   - Send USDC from bot wallet to external address

4. **Referral System**
   - Invite friends → get free picks
   - Track referrals in database
   - Reward both referrer and referee

---

**Status:** ✅ Built, 🔄 Deploying, ⏳ Awaiting test
