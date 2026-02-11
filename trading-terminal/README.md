# 🚀 Miyamoto Labs Trading Terminal

A **pixel-perfect** trading dashboard combining Hyperliquid perpetual futures with Twitter integration, built with Next.js 14.

![Trading Terminal](https://img.shields.io/badge/Next.js-14-black) ![Twitter OAuth](https://img.shields.io/badge/Twitter-OAuth%202.0-1DA1F2) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

### 📊 Trading Dashboard
- **TradingView Charts** - Professional charting with RSI indicators
- **Live Price Feed** - Animated ticker tape with all Hyperliquid assets
- **Portfolio Tracking** - Real-time account value, positions, and P&L
- **Funding Rates** - Live funding countdown and rates heatmap
- **Fear & Greed Index** - Market sentiment gauge
- **P&L Visualization** - 7-day profit/loss chart

### ⚡ Quick Trading
- **One-Click Trading** - LONG/SHORT buttons with confirmation
- **Keyboard Shortcuts** - L for Long, S for Short
- **Configurable Size & Leverage** - Quick trade setup
- **Trading Journal** - Document your trade thesis

### 🤖 Bot Integration
- **Live Bot Status** - Monitor your trading bots
- **Paper Trading Mode** - Test strategies safely

### 🐦 Twitter Integration
- **OAuth 2.0 Authentication** - Secure Twitter login
- **Home Timeline** - View your Twitter feed in-dashboard
- **Auto-Refresh** - Updates every 5 minutes

### 📰 Market Intelligence
- **Crypto News Feed** - Latest crypto news from CryptoCompare
- **Whale Alerts** - Monitor large trades (>$100k)

### 🎮 Keyboard Shortcuts
- `1-4` - Switch assets (BTC, ETH, SOL, HYPE)
- `L` - Open LONG trade modal
- `S` - Open SHORT trade modal
- `Esc` - Close modals
- `Enter` - Confirm trade

## 🔧 Setup

### Prerequisites
- Node.js 18+ 
- Twitter Developer Account (for OAuth)

### 1. Clone & Install
```bash
git clone <your-repo>
cd trading-terminal
npm install
```

### 2. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.x.com)
2. Create a new app
3. Enable **OAuth 2.0**
4. Set **Type of App**: Web App
5. Set **Callback URL**: `http://localhost:3000/api/auth/callback/twitter`
6. Set **Website URL**: `http://localhost:3000`
7. Enable **Read** permissions (users.read, tweet.read, offline.access)
8. Copy your **Client ID** and **Client Secret**

### 3. Configure Environment

Create `.env.local`:

```env
# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `TWITTER_CLIENT_ID`
   - `TWITTER_CLIENT_SECRET`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
4. Update Twitter app callback URL to production URL

### Other Platforms

Works on any Next.js hosting platform (Netlify, Railway, etc.)

## 🎯 Usage

### First Time Setup

1. **Launch Dashboard**
   - Navigate to http://localhost:3000
   - Dashboard loads with default Hyperliquid wallet

2. **Connect Twitter**
   - Click "Connect X" button
   - Authorize the app
   - Your home timeline appears in the Twitter tab

3. **Start Trading**
   - Use keyboard shortcuts (L/S) or click buttons
   - View positions in Portfolio tab
   - Track P&L in the chart

### Customize Your Wallet

Edit the wallet address in the sidebar to track your own Hyperliquid account.

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js (Twitter OAuth 2.0)
- **Styling**: Tailwind CSS
- **Charts**: TradingView, Chart.js
- **APIs**: 
  - Hyperliquid (trading data)
  - Twitter API v2 (timeline)
  - CryptoCompare (news)
  - Alternative.me (Fear & Greed)

## 📁 Project Structure

```
trading-terminal/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   └── tweets/              # Twitter timeline API
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main dashboard
├── auth.ts                      # NextAuth config
├── .env.local                   # Environment variables
└── README.md
```

## 🔐 Security

- OAuth tokens stored server-side in encrypted sessions
- No API keys exposed to client
- CSRF protection via NextAuth
- Secure HTTP-only cookies

## 🐛 Troubleshooting

### Twitter Authentication Issues

**Error: "Not authenticated"**
- Verify `.env.local` has correct credentials
- Check Twitter app callback URL matches `NEXTAUTH_URL`
- Ensure OAuth 2.0 is enabled (not OAuth 1.0a)

**Error: "Failed to fetch tweets"**
- Verify Twitter app has Read permissions
- Check scopes: users.read, tweet.read, offline.access
- Ensure access token hasn't expired

### Chart Not Loading

**TradingView chart blank**
- Check browser console for errors
- Verify internet connection (TradingView loads from CDN)
- Try different browser (some ad blockers block TradingView)

### API Rate Limits

- Hyperliquid: No rate limit
- Twitter: 15 requests per 15 minutes (home timeline)
- CryptoCompare: 50,000 requests/month (free tier)

## 📊 API Endpoints

### `/api/auth/[...nextauth]`
NextAuth handler for Twitter OAuth

### `/api/tweets`
**Protected** - Requires authentication

Returns home timeline:
```json
[
  {
    "id": "123...",
    "text": "Tweet content",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "likeCount": 42,
    "retweetCount": 10,
    "author": {
      "name": "User Name",
      "username": "username",
      "avatar": "https://..."
    }
  }
]
```

## 🎨 Customization

### Change Default Wallet
Edit `app/page.tsx`:
```tsx
const [wallet, setWallet] = useState("your_wallet_address")
```

### Modify Trade Defaults
```tsx
const [tradeSize, setTradeSize] = useState("100")  // Default $100
const [tradeLeverage, setTradeLeverage] = useState("10")  // Default 10x
```

### Adjust Data Refresh Rates
```tsx
// Prices refresh: change 15000 (15s)
setInterval(fetchPrices, 15000)

// Twitter refresh: change 300000 (5min)
setInterval(fetchTweets, 300000)
```

## 🚀 Roadmap

- [ ] Real-time WebSocket price updates
- [ ] Actual bot integration for trade execution
- [ ] Position management (close, edit SL/TP)
- [ ] Mobile responsive design
- [ ] Whale alert sound notifications
- [ ] Historical P&L data
- [ ] Multiple wallet support
- [ ] Dark/light mode toggle

## 📝 License

MIT License - Feel free to use for personal or commercial projects

## 🙏 Credits

- **TradingView** - Professional charting
- **Hyperliquid** - Perpetual futures exchange
- **CryptoCompare** - Crypto news API
- **Alternative.me** - Fear & Greed Index

---

Built with ❤️ by **Miyamoto Labs**

Questions? Open an issue or reach out on Twitter!
