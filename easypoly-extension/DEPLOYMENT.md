# EasyPoly Extension Deployment Guide

## Pre-Deployment Checklist

### 1. Create Extension Icons

Create PNG icons at these sizes:
- 16x16 (toolbar icon)
- 48x48 (extension management)
- 128x128 (Chrome Web Store)

**Quick way using ImageMagick:**

```bash
# Start with a 512x512 source image
convert source.png -resize 16x16 icons/icon16.png
convert source.png -resize 48x48 icons/icon48.png
convert source.png -resize 128x128 icons/icon128.png
```

Or use Figma/Canva and export at exact sizes.

### 2. Set Up Supabase Database

1. Go to Supabase SQL Editor
2. Run `database-schema.sql`
3. Verify table created:
   ```sql
   SELECT * FROM polymarket_auth LIMIT 1;
   ```

### 3. Update Environment Variables

**Landing page `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_service_key
```

**Extension `background.js`:**
```javascript
// For production
const EASYPOLY_API = 'https://easypoly.bet/api/capture-auth';

// For local testing
// const EASYPOLY_API = 'http://localhost:3000/api/capture-auth';
```

### 4. Test Locally

```bash
# 1. Load extension in Chrome
#    - Go to chrome://extensions/
#    - Enable "Developer mode"
#    - Click "Load unpacked"
#    - Select easypoly-extension folder

# 2. Test on Polymarket
#    - Open polymarket.com
#    - Log in to your account
#    - Click extension icon
#    - Click "Connect Polymarket"
#    - Check console for logs

# 3. Verify backend received auth
#    - Check Supabase polymarket_auth table
#    - Verify auth_data is populated
#    - Check bearer_token extracted
```

## Chrome Web Store Submission

### 1. Prepare Assets

**Required files:**
- Extension ZIP (manifest.json, scripts, icons)
- 1280x800 screenshot (at least 1)
- 440x280 small tile icon
- 128x128 store icon
- Detailed description (10,000 char limit)
- Privacy policy URL

**Screenshot tips:**
- Show the popup UI
- Show connection success state
- Show Telegram bot receiving alerts
- Add text overlays explaining flow

### 2. Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay $5 one-time registration fee
3. Fill in publisher info

### 3. Upload Extension

```bash
# Create ZIP file (exclude development files)
cd easypoly-extension
zip -r easypoly-extension.zip . -x "*.git*" "*.DS_Store" "README.md" "DEPLOYMENT.md"
```

1. Click "New Item" in dashboard
2. Upload ZIP file
3. Fill in listing details:
   - **Name:** EasyPoly Connect
   - **Description:** One-click Polymarket connection for EasyPoly bet alerts
   - **Category:** Productivity
   - **Language:** English

### 4. Store Listing Content

**Short description (132 chars):**
```
Connect your Polymarket account to EasyPoly in one click. Get AI-powered bet alerts on Telegram.
```

**Full description:**
```
EasyPoly Connect makes it easy to link your Polymarket account with EasyPoly's AI-powered betting alerts.

🎯 What is EasyPoly?
EasyPoly scans 300+ Polymarket markets daily, identifies the best opportunities, and sends you curated bet alerts on Telegram. One tap to place your bet.

✨ Why this extension?
Instead of manually copying API keys, this extension captures your Polymarket session in one click. Safe, secure, and seamless.

🔒 Privacy & Security
- Only activates when you explicitly click "Connect"
- Only accesses polymarket.com (no other sites)
- Auth data encrypted in transit and at rest
- Open source: [GitHub link]

📱 How it works:
1. Install this extension
2. Visit polymarket.com and log in
3. Click the extension icon
4. Click "Connect Polymarket"
5. Done! Start receiving bet alerts on Telegram

🤝 Support
Questions? Contact us on Telegram: @EasyPolyBot
```

**Privacy policy:**
```
Create a simple privacy policy page on easypoly.bet/privacy

Key points:
- We only store auth data you explicitly provide
- Data is encrypted and used only for placing bets on your behalf
- We never share or sell your data
- You can disconnect anytime
- Auth tokens are refreshed when expired
```

### 5. Submit for Review

1. Upload screenshots
2. Set privacy practices (explain data usage)
3. Set visibility (Public)
4. Set pricing (Free)
5. Submit for review

**Review timeline:** 1-7 days typically

## Post-Launch

### 1. Get Extension ID

After publishing, Chrome assigns an ID like:
```
abcdefghijklmnopqrstuvwxyzabcdef
```

Copy this ID.

### 2. Update Landing Page

**`easypoly-landing/app/connect/extension-flow.tsx`:**

```typescript
const EXTENSION_ID = 'YOUR_ACTUAL_EXTENSION_ID';
```

### 3. Add Install Link

On landing page, link to:
```
https://chrome.google.com/webstore/detail/[EXTENSION_ID]
```

### 4. Analytics

Add to `background.js`:

```javascript
// Track installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    fetch('https://easypoly.bet/api/analytics/extension-install', {
      method: 'POST',
      body: JSON.stringify({ version: chrome.runtime.getManifest().version })
    });
  }
});

// Track successful connections
// (after successful auth capture)
fetch('https://easypoly.bet/api/analytics/connection-success', {
  method: 'POST',
  body: JSON.stringify({ userId })
});
```

### 5. Monitor Errors

Set up error reporting in `background.js`:

```javascript
window.addEventListener('error', (event) => {
  fetch('https://easypoly.bet/api/analytics/extension-error', {
    method: 'POST',
    body: JSON.stringify({
      message: event.message,
      source: event.filename,
      lineno: event.lineno
    })
  });
});
```

## Maintenance

### Update Flow

1. Increment version in `manifest.json`
2. Test locally
3. Create new ZIP
4. Upload to Chrome Web Store dashboard
5. Submit for review

### Monitoring

Check Supabase for:
- Connection success rate
- Auth expiration rate
- Error frequency

## Troubleshooting

**Extension not capturing auth:**
- Check Polymarket is actually logged in
- Verify user clicked extension icon
- Check browser console for errors
- Ensure CORS headers allow extension origin

**Backend not receiving data:**
- Check network tab for failed POST
- Verify EASYPOLY_API URL is correct
- Check CORS configuration on backend
- Verify Supabase credentials

**Auth expiring too quickly:**
- Polymarket sessions typically last 30 days
- Add refresh logic to detect expired auth
- Prompt user to reconnect when auth fails
