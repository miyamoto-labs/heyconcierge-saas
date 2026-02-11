# Testing Twitter OAuth 2.0 Integration

## Quick Test Steps

### 1. Start the Development Server
```bash
cd /Users/erik/.openclaw/workspace/trading-terminal
npm run dev
```

### 2. Test OAuth 2.0 Flow

1. **Open your browser:** http://localhost:3000

2. **Click "Connect X"** button in the top-right corner

3. **Expected behavior:**
   - ✅ Redirects to Twitter authorization page
   - ✅ Shows scopes: Read tweets, Write tweets, Read profile, Offline access
   - ✅ After clicking "Authorize app", redirects back to dashboard
   - ✅ Header shows "✓ Connected" with Logout button
   - ✅ Twitter tab loads your feed

4. **Test posting a tweet:**
   - Go to "Twitter" tab
   - Type a message in the composer
   - Click "Post" button
   - ✅ Tweet should post successfully
   - ✅ Feed should refresh and show your new tweet

### 3. Test Token Refresh (Optional)

After successful authentication, wait for token to expire (Twitter tokens last ~2 hours), then:
1. Try posting another tweet
2. The app should automatically refresh the token
3. Tweet should post without requiring re-authentication

### 4. Test Error Handling

**Test 1: Deny Access**
1. Click "Connect X"
2. On Twitter auth page, click "Cancel"
3. ✅ Should redirect to `/auth/error` with clear error message

**Test 2: Invalid Credentials** (Don't do this unless testing)
1. Temporarily modify `.env.local` with invalid credentials
2. Try to connect
3. ✅ Should show error page with troubleshooting tips

## Debugging OAuth Issues

### Enable Debug Mode
The auth is already configured with `debug: true`. Check server console for detailed logs:

```bash
# Watch server logs while testing
npm run dev
```

Look for:
- `[auth][debug]` messages showing OAuth flow
- Token exchange details
- Any error messages

### Common Issues

#### Issue: "Callback loop" - keeps redirecting
**Cause:** PKCE verification failing or callback URL mismatch

**Fix:**
1. Check `.env.local` has correct `NEXTAUTH_URL`
2. Verify Twitter app callback URL matches exactly: `http://localhost:3000/api/auth/callback/twitter`
3. Clear browser cookies and try again

#### Issue: 403 Forbidden when posting tweet
**Cause:** Missing `tweet.write` scope

**Fix:**
1. Sign out completely
2. Go to Twitter Developer Portal → Your App → Settings
3. Ensure "Read and Write" permissions are enabled (not just "Read")
4. Regenerate credentials if needed
5. Update `.env.local` with new credentials
6. Sign in again to re-authorize

#### Issue: "RefreshAccessTokenError"
**Cause:** Token refresh failed (network issue or invalid refresh token)

**Fix:**
1. Sign out and sign in again
2. Check network connection
3. Verify Twitter API is accessible

### Test OAuth 1.0a Fallback

If OAuth 2.0 continues to fail, test the fallback endpoint:

**Option 1: Manual API Test**
```bash
curl -X POST http://localhost:3000/api/tweet-direct \
  -H "Content-Type: application/json" \
  -d '{"text":"Testing OAuth 1.0a fallback endpoint! 🚀"}'
```

**Expected response:**
```json
{
  "success": true,
  "tweet": {
    "id": "...",
    "text": "Testing OAuth 1.0a fallback endpoint! 🚀"
  }
}
```

**Option 2: Modify Frontend (if needed)**

If OAuth 2.0 completely fails, you can modify the tweet posting to use the fallback:

Edit `/app/page.tsx`, find the `postTweet` function and change:
```typescript
// FROM:
const res = await fetch("/api/tweet", {

// TO:
const res = await fetch("/api/tweet-direct", {
```

This bypasses user authentication and uses app-level OAuth 1.0a credentials.

## Verification Checklist

Before considering OAuth "fixed", verify:

- [ ] ✅ Build completes without TypeScript errors
- [ ] ✅ Dev server starts without errors
- [ ] ✅ "Connect X" redirects to Twitter (no loop)
- [ ] ✅ Authorization shows all 4 scopes requested
- [ ] ✅ After auth, session has `accessToken` populated
- [ ] ✅ Tweet feed loads in sidebar
- [ ] ✅ Can post tweet without 403 error
- [ ] ✅ Error page displays properly if auth fails
- [ ] ✅ Logout works correctly
- [ ] ✅ Re-login works after logout

## Advanced Testing

### Test Token Storage

In browser console after successful login:
```javascript
// Check session storage
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('Session:', session)
    console.log('Has access token:', !!session.accessToken)
  })
```

### Test API Call Directly

After authentication, test the Twitter API v2 endpoint directly:
```javascript
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    // Try to fetch your profile
    fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })
    .then(r => r.json())
    .then(data => console.log('Twitter API response:', data))
  })
```

## Success Criteria

✅ **OAuth 2.0 is working** when:
1. No callback loops
2. Can authenticate successfully  
3. Session contains `accessToken`
4. Can post tweets via `/api/tweet`
5. Token auto-refreshes when expired
6. Error handling works gracefully

## Files to Monitor

Watch these files for errors during testing:

1. **Server console** - Shows auth debug logs
2. **Browser console** - Shows client-side errors
3. **Network tab** - Shows API requests/responses
4. **Application tab → Cookies** - Shows auth cookies

## Need Help?

If OAuth still doesn't work after following this guide:

1. Check `OAUTH_FIX.md` for configuration details
2. Verify Twitter Developer Portal settings
3. Try the OAuth 1.0a fallback as temporary solution
4. Check that NextAuth v5 beta is compatible with current Next.js version
