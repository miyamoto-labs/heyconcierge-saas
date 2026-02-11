# Deploying to Vercel

## 1. Push to GitHub
```bash
cd /Users/erik/.openclaw/workspace/trading-terminal
git init
git add .
git commit -m "Trading Terminal v1.0"
git remote add origin https://github.com/YOUR_USERNAME/trading-terminal.git
git push -u origin main
```

## 2. Deploy on Vercel
1. Go to https://vercel.com/new
2. Import the GitHub repo
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `TWITTER_CLIENT_ID` | `ak15VkJfU1JVTGViNklCNWdZaFY6MTpjaQ` |
| `TWITTER_CLIENT_SECRET` | `VXck0MtEfbtnZnqYbuseE0tBepE3PPdXDe3qTF0qiQb_4KDH67` |
| `AUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `TWITTER_API_KEY` | `8y9S9LjBOHNmXEH0eduHJLckk` |
| `TWITTER_API_SECRET` | `vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm` |
| `TWITTER_ACCESS_TOKEN` | `2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn` |
| `TWITTER_ACCESS_SECRET` | `wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo` |

4. Deploy!

## 3. Update Twitter App Callback URL
After deploying, add the production callback URL to your Twitter app:
1. Go to https://console.x.com/accounts/2018999844732313600/apps
2. Click "Miyamoto Dostoyevsky Bot"
3. Edit OAuth 2.0 settings
4. Add callback URL: `https://your-app.vercel.app/api/auth/callback/twitter`
5. Save

## Features
- ✅ Real-time crypto prices (Hyperliquid API)
- ✅ TradingView charts
- ✅ Tweet posting (OAuth 1.0a fallback for owner, OAuth 2.0 for users)
- ✅ Twitter feed
- ✅ Portfolio tracking
- ✅ Trading journal
