# EasyPoly Chrome Extension

**One-click Polymarket connection for EasyPoly**

## What It Does

Captures Polymarket authentication (cookies, localStorage, session tokens) and sends it to EasyPoly backend so users can receive bet alerts on Telegram and execute trades with one tap.

## User Flow

1. User signs up at easypoly.bet (gets Telegram bot link)
2. User installs EasyPoly Chrome Extension
3. User opens Polymarket and logs in
4. User clicks extension icon → "Connect Polymarket"
5. Extension captures auth and sends to backend
6. ✓ Connected! User now receives bet alerts on Telegram

## Development

### Build & Load

```bash
cd easypoly-extension

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select easypoly-extension folder
```

### Test Locally

1. Update `background.js` to use local API:
   ```javascript
   const EASYPOLY_API = 'http://localhost:3000/api/capture-auth';
   ```

2. Load extension in Chrome
3. Navigate to polymarket.com and log in
4. Click extension icon → Connect
5. Check Network tab for POST to `/api/capture-auth`

### Production

1. Build icons (16x16, 48x48, 128x128 PNG)
2. Update manifest version for Chrome Web Store
3. Test end-to-end flow
4. Submit to Chrome Web Store

## Security

- Extension only activates on polymarket.com domain
- Auth capture requires explicit user action (no background sniffing)
- Auth data encrypted in transit (HTTPS)
- Backend encrypts auth before storing in Supabase

## Files

- `manifest.json` - Extension config (permissions, scripts)
- `background.js` - Service worker (handles cookies, backend communication)
- `content.js` - Injected into Polymarket (captures localStorage/sessionStorage)
- `popup.html` - User interface
- `popup.js` - Popup logic
- `icons/` - Extension icons (16, 48, 128)

## Permissions

- `activeTab` - Access current tab URL
- `cookies` - Read Polymarket cookies
- `storage` - Save connection status locally
- `host_permissions` - Access polymarket.com and easypoly.bet

## TODO

- [ ] Create actual PNG icons (currently placeholders)
- [ ] Add analytics (connection success rate, errors)
- [ ] Handle auth expiration (re-capture flow)
- [ ] Add "Disconnect" button in popup
- [ ] Settings page (select backend URL, user preferences)
- [ ] Chrome Web Store listing (screenshots, description)
