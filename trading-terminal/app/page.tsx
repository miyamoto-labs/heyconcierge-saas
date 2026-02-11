"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Script from "next/script"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

declare global {
  interface Window {
    TradingView: any
    Chart: any
    Jupiter: any
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { address, isConnected } = useAccount()
  const [wallet, setWallet] = useState("0xF1CcD889c2b340636A567DfF3f1d157f7FFD00dB")
  
  // Use connected wallet for Hyperliquid when available
  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected:', address)
      setWallet(address)
    }
  }, [isConnected, address])
  
  // Manual wallet input for non-connected viewing
  const [showWalletInput, setShowWalletInput] = useState(false)
  const [walletInput, setWalletInput] = useState("")
  const [tweets, setTweets] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])
  const [newsSource, setNewsSource] = useState("crypto")
  const [portfolio, setPortfolio] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [prices, setPrices] = useState<any>({})
  const [fundingRates, setFundingRates] = useState<any>({})
  const [fearGreed, setFearGreed] = useState({ value: 50, label: "Neutral" })
  const [activeTab, setActiveTab] = useState("portfolio")
  const [currentAsset, setCurrentAsset] = useState("BTC")
  const [currentInterval, setCurrentInterval] = useState("15")
  const [fundingCountdown, setFundingCountdown] = useState("--:--:--")
  const [whaleAlerts, setWhaleAlerts] = useState<any[]>([])
  const [clock, setClock] = useState("")
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [journalText, setJournalText] = useState("")
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [pendingTrade, setPendingTrade] = useState<any>(null)
  const [tradeSize, setTradeSize] = useState("75")
  const [tradeLeverage, setTradeLeverage] = useState("8")
  const [tweetText, setTweetText] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [youtubeVideo, setYoutubeVideo] = useState("jfKfPfyJRdk") // Default: Lofi beats
  const [youtubeLabel, setYoutubeLabel] = useState("Lofi Trading Beats")
  const [newTokens, setNewTokens] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [polymarketData, setPolymarketData] = useState<any>({
    balance: '81.66',
    botStatus: 'stopped',
    trades: [],
    pnl: -21.00,
    winRate: 0,
    totalTrades: 37
  })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soundEnabled') === 'true'
    }
    return false
  })
  const prevTokensRef = useRef<string[]>([])
  
  // Play sound on new token using Web Audio API
  const playNewTokenSound = () => {
    if (!soundEnabled) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 880 // A5 note
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.15) // Short beep
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.value = 1100 // Higher note
        osc2.type = 'sine'
        gain2.gain.value = 0.3
        osc2.start()
        osc2.stop(audioContext.currentTime + 0.15)
      }, 150)
    } catch (e) {}
  }
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('sidebarWidth') || '384')
    }
    return 384
  })
  const [isResizing, setIsResizing] = useState(false)
  
  // Chart height resize (percentage)
  const [chartHeight, setChartHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('chartHeight') || '45')
    }
    return 45
  })
  const [isResizingChart, setIsResizingChart] = useState(false)
  
  const chartRef = useRef<HTMLDivElement>(null)
  const pnlChartRef = useRef<HTMLCanvasElement>(null)
  const [tvLoaded, setTvLoaded] = useState(false)
  const [chartJsLoaded, setChartJsLoaded] = useState(false)

  const ASSETS: Record<string, string> = {
    'BTC': 'BYBIT:BTCUSDT.P',
    'ETH': 'BYBIT:ETHUSDT.P',
    'SOL': 'BYBIT:SOLUSDT.P',
    'HYPE': 'MEXC:HYPEUSDT'
  }

  // Load journal from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tradingJournal')
    if (saved) setJournalEntries(JSON.parse(saved))
  }, [])

  // Load chat from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tradingChat')
    if (saved) setChatMessages(JSON.parse(saved))
  }, [])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Resizable sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 280 && newWidth <= 800) {
        setSidebarWidth(newWidth)
        localStorage.setItem('sidebarWidth', String(newWidth))
      }
    }
    const handleMouseUp = () => setIsResizing(false)
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Resizable chart height - simple pixel-based approach (lower default = taller bottom panels)
  const [chartHeightPx, setChartHeightPx] = useState(220)
  const leftColumnRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingChart) return
      e.preventDefault()
      
      // Simple: chart height = mouse Y position minus header (76px) minus chart controls (36px)
      const newHeight = e.clientY - 76 - 36
      
      if (newHeight >= 150 && newHeight <= 600) {
        setChartHeightPx(newHeight)
        localStorage.setItem('chartHeightPx', String(newHeight))
      }
    }
    const handleMouseUp = () => {
      setIsResizingChart(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingChart])
  
  // Apply cursor style when resizing
  useEffect(() => {
    if (isResizingChart) {
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingChart])
  
  // Load saved height
  useEffect(() => {
    const saved = localStorage.getItem('chartHeightPx')
    if (saved) setChartHeightPx(parseInt(saved))
  }, [])

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Europe/Oslo' }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Funding countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const utcHours = now.getUTCHours()
      const utcMinutes = now.getUTCMinutes()
      const utcSeconds = now.getUTCSeconds()
      let nextFunding = Math.ceil(utcHours / 8) * 8
      if (nextFunding >= 24) nextFunding = 0
      let hoursLeft = nextFunding - utcHours
      if (hoursLeft <= 0) hoursLeft += 8
      if (utcMinutes > 0 || utcSeconds > 0) hoursLeft--
      const minutesLeft = 59 - utcMinutes
      const secondsLeft = 59 - utcSeconds
      setFundingCountdown(`${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize TradingView chart
  useEffect(() => {
    if (tvLoaded && chartRef.current) {
      chartRef.current.innerHTML = ''
      new window.TradingView.widget({
        width: "100%",
        height: "100%",
        symbol: ASSETS[currentAsset],
        interval: currentInterval,
        timezone: "Europe/Oslo",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0c0c10",
        enable_publishing: false,
        container_id: "tv-chart",
        backgroundColor: "#050508",
        hide_legend: true,
        studies: ["RSI@tv-basicstudies"]
      })
    }
  }, [tvLoaded, currentAsset, currentInterval])

  // Initialize P&L Chart
  useEffect(() => {
    if (chartJsLoaded && pnlChartRef.current) {
      const ctx = pnlChartRef.current.getContext('2d')
      if (!ctx) return
      
      const data = [-12, 8, 15, -5, 22, 18, 25]
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointBackgroundColor: '#00ff88'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { 
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { color: '#666', font: { size: 9 } }
            },
            y: { 
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { 
                color: '#666', 
                font: { size: 9 },
                callback: (v: any) => '$' + v
              }
            }
          }
        }
      })
    }
  }, [chartJsLoaded])

  // Fetch data
  useEffect(() => {
    fetchPrices()
    fetchPortfolio()
    fetchFearGreed()
    fetchNews()
    fetchNewTokens()
    fetchPolymarketData()
    const interval = setInterval(() => {
      fetchPrices()
      fetchPortfolio()
    }, 15000)
    const tokenInterval = setInterval(fetchNewTokens, 30000) // Every 30s
    const polyInterval = setInterval(fetchPolymarketData, 30000) // Every 30s
    return () => {
      clearInterval(interval)
      clearInterval(tokenInterval)
      clearInterval(polyInterval)
    }
  }, [wallet])

  // Fetch tweets when authenticated
  useEffect(() => {
    if (session?.accessToken) {
      fetchTweets()
      const interval = setInterval(fetchTweets, 300000) // Every 5 min
      return () => clearInterval(interval)
    }
  }, [session])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch(e.key.toLowerCase()) {
        case '1': setCurrentAsset('BTC'); break
        case '2': setCurrentAsset('ETH'); break
        case '3': setCurrentAsset('SOL'); break
        case '4': setCurrentAsset('HYPE'); break
        case 'l': quickTrade('LONG'); break
        case 's': quickTrade('SHORT'); break
        case 'escape':
          setShowJournalModal(false)
          setShowTradeModal(false)
          setSelectedToken(null)
          setPendingTrade(null)
          break
        case 'enter':
          if (pendingTrade) confirmTrade()
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pendingTrade])

  async function fetchPrices() {
    try {
      // Fetch both meta (for asset names) and prices
      const [metaRes, pricesRes] = await Promise.all([
        fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "meta" })
        }),
        fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "allMids" })
        })
      ])
      
      const meta = await metaRes.json()
      const mids = await pricesRes.json()
      
      // Map index to proper names
      const priceMap: Record<string, string> = {}
      const universe = meta.universe || []
      
      // Top coins we want to show
      const topCoins = ['BTC', 'ETH', 'SOL', 'HYPE', 'SUI', 'AVAX', 'DOGE', 'XRP', 'ADA', 'LINK', 'DOT', 'MATIC', 'ARB', 'OP', 'APT']
      
      universe.forEach((asset: any, index: number) => {
        if (topCoins.includes(asset.name) && mids[asset.name]) {
          priceMap[asset.name] = mids[asset.name]
        }
      })
      
      // Also check direct name keys in mids
      topCoins.forEach(coin => {
        if (mids[coin] && !priceMap[coin]) {
          priceMap[coin] = mids[coin]
        }
      })
      
      setPrices(priceMap)
    } catch (e) {
      console.error("Failed to fetch prices:", e)
    }
  }

  async function fetchPortfolio() {
    if (!wallet) return
    try {
      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clearinghouseState", user: wallet })
      })
      const data = await res.json()
      setPortfolio(data)
      setPositions(data.assetPositions || [])
      
      // Fetch trades
      const tradesRes = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "userFills", user: wallet })
      })
      const tradesData = await tradesRes.json()
      setTrades(tradesData.slice(-5).reverse())

      // Fetch funding rates from metaAndAssetCtxs
      const metaRes = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "metaAndAssetCtxs" })
      })
      const metaData = await metaRes.json()
      const rates: any = {}
      if (metaData.length >= 2) {
        const universe = metaData[0].universe || []
        const contexts = metaData[1] || []
        universe.forEach((u: any, i: number) => {
          if (i < contexts.length) {
            // Funding is per-hour rate, multiply by 100 for percentage
            rates[u.name] = parseFloat(contexts[i].funding || 0) * 100
          }
        })
      }
      setFundingRates(rates)
    } catch (e) {}
  }

  async function fetchFearGreed() {
    try {
      const res = await fetch("https://api.alternative.me/fng/")
      const data = await res.json()
      setFearGreed({
        value: parseInt(data.data[0].value),
        label: data.data[0].value_classification
      })
    } catch (e) {}
  }

  async function fetchPolymarketData() {
    try {
      const res = await fetch('/api/polymarket')
      if (res.ok) {
        const data = await res.json()
        if (!data.error) {
          setPolymarketData((prev: any) => ({
            ...prev,
            balance: data.balance || prev.balance,
            trades: data.trades || [],
          }))
        }
      }
    } catch (e) {
      console.error('Failed to fetch Polymarket data:', e)
    }
  }

  async function fetchNewTokens() {
    try {
      const res = await fetch("https://api.dexscreener.com/token-boosts/latest/v1")
      const data = await res.json()
      // Filter to Solana tokens and get top 8
      const tokens = (data || [])
        .filter((t: any) => t.chainId === 'solana')
        .slice(0, 8)
        .map((t: any) => ({
          address: t.tokenAddress,
          name: t.description?.split('\n')[0]?.slice(0, 20) || t.tokenAddress.slice(0, 6),
          url: t.url,
          amount: t.totalAmount || t.amount,
          icon: t.icon ? `https://cdn.dexscreener.com/cms/${t.icon}` : null
        }))
      
      // Check for new tokens and play sound
      const newAddresses = tokens.map((t: any) => t.address)
      const prevAddresses = prevTokensRef.current
      if (prevAddresses.length > 0) {
        const hasNew = newAddresses.some((addr: string) => !prevAddresses.includes(addr))
        if (hasNew) playNewTokenSound()
      }
      prevTokensRef.current = newAddresses
      
      setNewTokens(tokens)
    } catch (e) {
      console.error("Failed to fetch new tokens:", e)
    }
  }

  async function fetchNews(source?: string) {
    const src = source || newsSource
    try {
      let newsData: any[] = []
      
      if (src === "crypto") {
        const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Trading")
        const data = await res.json()
        newsData = (data.Data || []).slice(0, 15).map((item: any) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          source: item.source_info?.name || "Crypto",
          time: item.published_on * 1000
        }))
      } else {
        // Use RSS2JSON for other sources
        const rssFeeds: Record<string, string> = {
          "bloomberg": "https://feeds.bloomberg.com/markets/news.rss",
          "reuters": "https://www.reutersagency.com/feed/?best-topics=business-finance",
          "wsj": "https://feeds.a]content.wsj.com/rss/markets/main.xml",
          "cnbc": "https://www.cnbc.com/id/100003114/device/rss/rss.html",
          "ft": "https://www.ft.com/rss/home",
          "cointelegraph": "https://cointelegraph.com/rss",
          "theblock": "https://www.theblock.co/rss.xml",
          "decrypt": "https://decrypt.co/feed"
        }
        
        const feedUrl = rssFeeds[src]
        if (feedUrl) {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`)
          const data = await res.json()
          newsData = (data.items || []).slice(0, 15).map((item: any) => ({
            id: item.guid || item.link,
            title: item.title,
            url: item.link,
            source: data.feed?.title || src,
            time: new Date(item.pubDate).getTime()
          }))
        }
      }
      
      setNews(newsData)
    } catch (e) {
      console.error("News fetch error:", e)
    }
  }

  async function fetchTweets() {
    try {
      const res = await fetch("/api/tweets")
      if (res.ok) {
        const data = await res.json()
        setTweets(data)
      }
    } catch (e) {
      console.error("Failed to fetch tweets:", e)
    }
  }

  async function postTweet() {
    if (!tweetText.trim() || isPosting) return
    setIsPosting(true)
    try {
      const res = await fetch("/api/tweet-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tweetText })
      })
      if (res.ok) {
        setTweetText("")
        fetchTweets() // Refresh feed
      } else {
        const error = await res.json()
        alert(error.error || "Failed to post tweet")
      }
    } catch (e) {
      console.error("Failed to post tweet:", e)
      alert("Failed to post tweet")
    }
    setIsPosting(false)
  }

  function quickTrade(direction: 'LONG' | 'SHORT') {
    setPendingTrade({ direction, size: tradeSize, leverage: tradeLeverage, asset: currentAsset })
    setShowTradeModal(true)
  }

  async function confirmTrade() {
    if (!pendingTrade) return
    
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingTrade)
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Add to chat as trade log
        const msg = {
          id: Date.now(),
          text: `📊 ${pendingTrade.direction} ${pendingTrade.asset} $${pendingTrade.size} @ ${pendingTrade.leverage}x | Price: $${data.trade.price.toLocaleString()}`,
          time: Date.now(),
          sender: 'system'
        }
        setChatMessages(prev => {
          const updated = [...prev, msg]
          localStorage.setItem('tradingChat', JSON.stringify(updated))
          return updated
        })
        
        setShowTradeModal(false)
        setPendingTrade(null)
      } else {
        alert(`Trade failed: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Trade error: ${error.message}`)
    }
  }

  function saveJournalEntry() {
    if (!journalText.trim()) return
    const entry = { time: Date.now(), text: journalText }
    const updated = [...journalEntries, entry]
    setJournalEntries(updated)
    localStorage.setItem('tradingJournal', JSON.stringify(updated))
    setJournalText("")
    setShowJournalModal(false)
  }

  function deleteJournalEntry(index: number) {
    const updated = journalEntries.filter((_, i) => i !== index)
    setJournalEntries(updated)
    localStorage.setItem('tradingJournal', JSON.stringify(updated))
  }

  function sendChatMessage() {
    if (!chatInput.trim()) return
    const msg = {
      id: Date.now(),
      text: chatInput,
      time: Date.now(),
      sender: 'user'
    }
    const updated = [...chatMessages, msg]
    setChatMessages(updated)
    localStorage.setItem('tradingChat', JSON.stringify(updated))
    setChatInput("")
  }

  function clearChat() {
    setChatMessages([])
    localStorage.removeItem('tradingChat')
  }

  const accountValue = parseFloat(portfolio?.marginSummary?.accountValue || "0")
  const btcPrice = prices.BTC ? parseFloat(prices.BTC).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"
  const ethPrice = prices.ETH ? parseFloat(prices.ETH).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "--"

  return (
    <>
      <Script src="https://s3.tradingview.com/tv.js" onLoad={() => setTvLoaded(true)} />
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" onLoad={() => setChartJsLoaded(true)} />
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glass { background: rgba(12, 12, 16, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .gradient-text { background: linear-gradient(135deg, #00ff88, #00ccff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-green { box-shadow: 0 0 40px rgba(0, 255, 136, 0.15); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-tape { animation: scroll 40s linear infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff88; }
        .chart-btn { transition: all 0.2s; }
        .chart-btn:hover { background: rgba(0, 255, 136, 0.1); border-color: rgba(0, 255, 136, 0.3); }
        .trade-btn { transition: all 0.15s; }
        .trade-btn:hover { transform: scale(1.02); }
        .trade-btn:active { transform: scale(0.98); }
        .slide-panel { box-shadow: -10px 0 40px rgba(0,0,0,0.5); }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-b from-[#050508] to-[#0a0a12] text-white">
        {/* Ticker */}
        <div className="bg-[#0c0c10] border-b border-white/10 overflow-hidden py-1.5">
          <div className="ticker-tape flex gap-8 whitespace-nowrap text-xs">
            {Object.entries(prices).slice(0, 15).concat(Object.entries(prices).slice(0, 15)).map(([sym, price], i) => (
              <span key={`${sym}-${i}`}><span className="text-gray-500">{sym}</span> <span className="mono text-emerald-400">${parseFloat(price as string).toLocaleString(undefined, {maximumFractionDigits: 2})}</span></span>
            ))}
          </div>
        </div>

        {/* Header */}
        <header className="border-b border-white/10 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-black text-sm">M</div>
                <div>
                  <div className="font-semibold text-sm">MIYAMOTO TERMINAL</div>
                  <div className="text-[10px] text-gray-500">by Miyamoto Labs</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <div><span className="text-gray-500">BTC</span> <span className="mono text-emerald-400">${btcPrice}</span></div>
                <div><span className="text-gray-500">ETH</span> <span className="mono text-emerald-400">${ethPrice}</span></div>
              </div>
              
              {/* Wallet Connect Button */}
              <ConnectButton 
                chainStatus="icon"
                accountStatus="address"
                showBalance={false}
              />
              
              {/* Sound Toggle */}
              <button 
                onClick={() => {
                  const newVal = !soundEnabled
                  setSoundEnabled(newVal)
                  localStorage.setItem('soundEnabled', String(newVal))
                  if (newVal) {
                    // Play test beep
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                      const osc = ctx.createOscillator()
                      const gain = ctx.createGain()
                      osc.connect(gain)
                      gain.connect(ctx.destination)
                      osc.frequency.value = 880
                      gain.gain.value = 0.2
                      osc.start()
                      osc.stop(ctx.currentTime + 0.1)
                    } catch (e) {}
                  }
                }}
                className={`px-2 py-1 rounded text-xs transition ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}
                title={soundEnabled ? 'Sound ON - Click to mute' : 'Sound OFF - Click for alerts'}
              >
                {soundEnabled ? '🔔' : '🔕'}
              </button>
              
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse"></span>
                <span className="text-xs text-gray-400">Live</span>
              </div>
              <div className="mono text-xs text-gray-500">{clock}</div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex h-[calc(100vh-76px)]">
          {/* Left: Chart + Bottom Panels */}
          <div ref={leftColumnRef} className="flex-1 flex flex-col border-r border-white/10">
            {/* Chart Controls */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#0c0c10]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {['BTC', 'ETH', 'SOL', 'HYPE'].map(a => (
                    <button key={a} onClick={() => setCurrentAsset(a)} className={`chart-btn px-2 py-0.5 text-xs rounded border ${currentAsset === a ? 'border-emerald-400 bg-emerald-400/15 text-emerald-400' : 'border-white/10'}`}>{a}</button>
                  ))}
                </div>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="flex gap-1">
                  {[['5', '5m'], ['15', '15m'], ['60', '1H'], ['240', '4H']].map(([v, l]) => (
                    <button key={v} onClick={() => setCurrentInterval(v)} className={`chart-btn px-2 py-0.5 text-xs rounded border ${currentInterval === v ? 'border-emerald-400 bg-emerald-400/15 text-emerald-400' : 'border-white/10'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Funding: <span className={`mono ${(fundingRates.BTC || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(fundingRates.BTC || 0).toFixed(4)}%</span></span>
                <span className="text-gray-500">Next: <span className="mono text-yellow-400">{fundingCountdown}</span></span>
              </div>
              <div className="text-xs text-gray-600">⌨️ L=Long S=Short Esc=Close</div>
            </div>
            
            {/* Chart */}
            <div style={{ height: chartHeightPx }} className="bg-[#050508] flex-shrink-0">
              <div id="tv-chart" ref={chartRef} className="w-full h-full"></div>
            </div>

            {/* Resize Handle */}
            <div 
              className="h-2 bg-white/5 hover:bg-emerald-500/30 cursor-row-resize transition-colors flex items-center justify-center group"
              onMouseDown={(e) => { e.preventDefault(); setIsResizingChart(true) }}
            >
              <div className="w-12 h-1 bg-white/30 group-hover:bg-emerald-400 rounded transition-colors"></div>
            </div>

            {/* Bottom Panels */}
            <div className="flex-1 grid grid-cols-3 gap-px bg-white/10">
              {/* Trading Journal - Bottom Left */}
              <div className="bg-[#0c0c10] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">📓 TRADING JOURNAL</span>
                  <button onClick={() => setShowJournalModal(true)} className="text-xs text-emerald-400 hover:text-white">+ Add</button>
                </div>
                <div className="space-y-2 overflow-y-auto h-[calc(100%-28px)] text-xs">
                  {journalEntries.length === 0 ? (
                    <div className="text-gray-500">No entries yet. Click + to add.</div>
                  ) : (
                    journalEntries.slice(-10).reverse().map((e, i) => (
                      <div key={i} className="glass rounded p-2">
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>{new Date(e.time).toLocaleDateString('en-GB')}</span>
                          <button onClick={() => deleteJournalEntry(journalEntries.length - 1 - i)} className="hover:text-red-400">×</button>
                        </div>
                        <div className="text-gray-300">{e.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fear & Greed + Quick Trade */}
              <div className="bg-[#0c0c10] p-3 space-y-3">
                {/* Fear & Greed */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">FEAR & GREED INDEX</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold mono">{fearGreed.value}</div>
                    <div>
                      <div className={`text-sm font-medium ${fearGreed.value < 25 ? 'text-red-400' : fearGreed.value < 45 ? 'text-orange-400' : fearGreed.value < 55 ? 'text-yellow-400' : fearGreed.value < 75 ? 'text-lime-400' : 'text-emerald-400'}`}>{fearGreed.label}</div>
                      <div className="h-2 w-24 rounded-full mt-1 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 relative">
                        <div className="absolute top-0 w-1 h-2 bg-white rounded" style={{left: `${fearGreed.value}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Polymarket Live */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">🎰 POLYMARKET LIVE</div>
                    <button onClick={fetchPolymarketData} className="text-[10px] text-emerald-400 hover:text-white">⟳</button>
                  </div>
                  
                  {/* Balance & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold mono text-emerald-400">${polymarketData.balance}</div>
                    <div className={`flex items-center gap-1 text-xs ${polymarketData.botStatus === 'running' ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${polymarketData.botStatus === 'running' ? 'bg-emerald-400 pulse' : 'bg-red-400'}`}></span>
                      {polymarketData.botStatus === 'running' ? 'Running' : 'Stopped'}
                    </div>
                  </div>

                  {/* P&L Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="glass rounded p-1.5 text-center">
                      <div className="text-[9px] text-gray-500">P&L</div>
                      <div className={`text-xs mono ${polymarketData.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {polymarketData.pnl >= 0 ? '+' : ''}${polymarketData.pnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="glass rounded p-1.5 text-center">
                      <div className="text-[9px] text-gray-500">Win%</div>
                      <div className="text-xs mono text-gray-300">{polymarketData.winRate}%</div>
                    </div>
                    <div className="glass rounded p-1.5 text-center">
                      <div className="text-[9px] text-gray-500">Trades</div>
                      <div className="text-xs mono text-gray-300">{polymarketData.totalTrades}</div>
                    </div>
                  </div>

                  {/* Recent Trades */}
                  <div className="space-y-1 max-h-[60px] overflow-y-auto">
                    {polymarketData.trades.length === 0 ? (
                      <div className="text-[10px] text-gray-500 text-center py-1">No recent trades</div>
                    ) : polymarketData.trades.slice(0, 3).map((trade: any, i: number) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className={trade.outcome === 'win' ? 'text-emerald-400' : 'text-red-400'}>
                          {trade.outcome === 'win' ? '✓' : '✗'} {trade.side} @ {trade.odds}
                        </span>
                        <span className="mono text-gray-400">${trade.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat - Bottom Right */}
              <div className="bg-[#0c0c10] p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">💬 TRADE CHAT</span>
                  <button onClick={clearChat} className="text-xs text-gray-500 hover:text-red-400">Clear</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 min-h-[60px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 text-[10px] py-2">Log trades & thoughts here</div>
                  ) : chatMessages.slice(-8).map((msg) => (
                    <div key={msg.id} className="glass rounded p-1.5">
                      <div className="text-[11px] text-gray-300">{msg.text}</div>
                      <div className="text-[9px] text-gray-600">{new Date(msg.time).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef}></div>
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type..."
                    className="flex-1 bg-[#050508] border border-white/10 rounded px-2 py-1 text-xs focus:border-emerald-500/50 focus:outline-none"
                  />
                  <button onClick={sendChatMessage} disabled={!chatInput.trim()} className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 rounded text-xs font-medium">→</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          {/* Resize Handle */}
          <div 
            className="w-1 bg-white/5 hover:bg-emerald-500/50 cursor-col-resize transition-colors"
            onMouseDown={() => setIsResizing(true)}
          />
          
          {/* Right Sidebar - Resizable */}
          <div style={{ width: sidebarWidth }} className="flex flex-col bg-[#0c0c10]">
            {/* Tabs */}
            <div className="flex border-b border-white/10 text-xs">
              {['portfolio', 'twitter', 'news', 'youtube', 'swap'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-2 py-2 font-medium border-b-2 capitalize ${activeTab === tab ? 'text-emerald-400 border-emerald-400' : 'text-gray-400 border-transparent'}`}>{tab}</button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'portfolio' && (
                <div className="space-y-3">
                  {/* Account Value */}
                  <div className="glass rounded-xl p-3 glow-green">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-gray-500">ACCOUNT VALUE</div>
                      <button 
                        onClick={() => setShowWalletInput(!showWalletInput)}
                        className="text-[10px] text-gray-500 hover:text-emerald-400"
                      >
                        {isConnected ? `${wallet.slice(0,6)}...${wallet.slice(-4)}` : 'Set Wallet'}
                      </button>
                    </div>
                    {showWalletInput && (
                      <div className="flex gap-1 mb-2">
                        <input
                          type="text"
                          value={walletInput}
                          onChange={(e) => setWalletInput(e.target.value)}
                          placeholder="0x..."
                          className="flex-1 bg-[#050508] border border-white/10 rounded px-2 py-1 text-xs mono"
                        />
                        <button
                          onClick={() => { if (walletInput.startsWith('0x')) { setWallet(walletInput); setShowWalletInput(false) }}}
                          className="px-2 bg-emerald-500 text-black rounded text-xs"
                        >
                          Load
                        </button>
                      </div>
                    )}
                    <div className="text-2xl font-bold mono gradient-text">${accountValue.toFixed(2)}</div>
                  </div>

                  {/* Positions */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">POSITIONS</div>
                    {positions.length > 0 ? positions.map((pos: any) => {
                      const p = pos.position
                      const size = parseFloat(p.szi)
                      const pnl = parseFloat(p.unrealizedPnl || 0)
                      return (
                        <div key={p.coin} className="glass rounded px-2 py-1.5 flex justify-between text-xs mb-1">
                          <span className="font-medium">{p.coin} <span className={size > 0 ? 'text-emerald-400' : 'text-red-400'}>{size > 0 ? 'LONG' : 'SHORT'}</span></span>
                          <span className={`mono ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${pnl.toFixed(2)}</span>
                        </div>
                      )
                    }) : <div className="text-gray-500 text-xs">No positions</div>}
                  </div>

                  {/* Bots */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">BOTS</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between glass rounded px-2 py-1.5 text-xs">
                        <span>HL V2.1</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse"></span><span className="text-emerald-400">Live</span></span>
                      </div>
                      <div className="flex items-center justify-between glass rounded px-2 py-1.5 text-xs">
                        <span>Polymarket</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full pulse"></span><span className="text-yellow-500">Paper</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Trades */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">RECENT TRADES</div>
                    <div className="space-y-0.5 text-xs">
                      {trades.map((f: any, i: number) => (
                        <div key={i} className="flex justify-between py-0.5">
                          <span className={f.side === 'B' ? 'text-emerald-400' : 'text-red-400'}>{f.side === 'B' ? 'BUY' : 'SELL'} {f.coin}</span>
                          <span className="mono text-gray-400">{parseFloat(f.sz).toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funding Rates */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">FUNDING RATES</div>
                    <div className="grid grid-cols-5 gap-1">
                      {['BTC', 'ETH', 'SOL', 'HYPE', 'DOGE', 'ARB', 'OP', 'AVAX', 'LINK', 'SUI'].map(sym => {
                        const rate = fundingRates[sym] || 0
                        return (
                          <div key={sym} className={`rounded p-1 text-center ${rate > 0.01 ? 'bg-emerald-900/30' : rate < -0.01 ? 'bg-red-900/30' : 'bg-white/5'}`}>
                            <div className="text-[10px] text-gray-500">{sym}</div>
                            <div className={`mono text-[10px] ${rate > 0 ? 'text-emerald-400' : rate < 0 ? 'text-red-400' : 'text-gray-500'}`}>{rate.toFixed(3)}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Whale Alerts */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">🐋 WHALE ALERTS</div>
                    <div className="text-xs text-gray-500">Monitoring for trades &gt;$100k...</div>
                  </div>
                </div>
              )}

              {activeTab === 'twitter' && (
                <div className="space-y-2">
                  {/* Tweet Composer - Always visible, uses OAuth 1.0a */}
                  <div className="glass rounded-lg p-3 mb-3">
                    <div className="text-xs text-emerald-400 mb-2">✓ Posting as @miyamotolabs</div>
                    <textarea
                      value={tweetText}
                      onChange={(e) => setTweetText(e.target.value)}
                      placeholder="What's happening?"
                      className="w-full bg-transparent border-none resize-none text-sm focus:outline-none"
                      rows={3}
                      maxLength={280}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${tweetText.length > 260 ? 'text-orange-400' : 'text-gray-500'}`}>
                        {tweetText.length}/280
                      </span>
                      <button
                        onClick={postTweet}
                        disabled={!tweetText.trim() || isPosting}
                        className="px-3 py-1 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-xs font-medium"
                      >
                        {isPosting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Feed - uses bird CLI, no OAuth needed */}
                  {tweets.length > 0 ? tweets.slice(0, 15).map((tweet: any) => (
                    <a key={tweet.id} href={`https://x.com/${tweet.author?.username}/status/${tweet.id}`} target="_blank" rel="noopener noreferrer" className="block glass rounded-lg p-2 hover:bg-white/5 transition">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black text-xs font-bold">
                          {tweet.author?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-medium truncate">{tweet.author?.name || 'Unknown'}</span>
                            <span className="text-gray-500">@{tweet.author?.username || 'unknown'}</span>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-500">{tweet.createdAt ? new Date(tweet.createdAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}) : ''}</span>
                          </div>
                          <div className="text-xs text-gray-300 mt-1 line-clamp-3">{tweet.text}</div>
                          <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
                            <span>♥ {tweet.likeCount || 0}</span>
                            <span>↻ {tweet.retweetCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  )) : <div className="text-gray-500 text-xs">Loading tweets...</div>}
                </div>
              )}

              {activeTab === 'news' && (
                <div className="space-y-3">
                  {/* News Source Dropdown */}
                  <select 
                    className="w-full bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none cursor-pointer"
                    value={newsSource}
                    onChange={(e) => {
                      setNewsSource(e.target.value)
                      fetchNews(e.target.value)
                    }}
                  >
                    <optgroup label="₿ Crypto">
                      <option value="crypto">CryptoCompare</option>
                      <option value="cointelegraph">Cointelegraph</option>
                      <option value="theblock">The Block</option>
                      <option value="decrypt">Decrypt</option>
                    </optgroup>
                    <optgroup label="📰 Finance">
                      <option value="bloomberg">Bloomberg</option>
                      <option value="reuters">Reuters</option>
                      <option value="wsj">Wall Street Journal</option>
                      <option value="cnbc">CNBC</option>
                      <option value="ft">Financial Times</option>
                    </optgroup>
                  </select>
                  
                  {/* Quick Source Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <button onClick={() => { setNewsSource("crypto"); fetchNews("crypto") }} className={`glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10 ${newsSource === "crypto" ? "border border-emerald-500/50" : ""}`}>Crypto</button>
                    <button onClick={() => { setNewsSource("bloomberg"); fetchNews("bloomberg") }} className={`glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10 ${newsSource === "bloomberg" ? "border border-emerald-500/50" : ""}`}>Bloomberg</button>
                    <button onClick={() => { setNewsSource("reuters"); fetchNews("reuters") }} className={`glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10 ${newsSource === "reuters" ? "border border-emerald-500/50" : ""}`}>Reuters</button>
                    <button onClick={() => { setNewsSource("cointelegraph"); fetchNews("cointelegraph") }} className={`glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10 ${newsSource === "cointelegraph" ? "border border-emerald-500/50" : ""}`}>CT</button>
                  </div>
                  
                  {/* News List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {news.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-4">Loading...</div>
                    ) : news.map((item: any) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded p-2 hover:bg-white/5 transition">
                        <div className="text-xs font-medium line-clamp-2">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.source} • {new Date(item.time).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube - Always mounted to keep audio playing */}
              <div className={`space-y-3 ${activeTab === 'youtube' ? '' : 'hidden'}`}>
                  {/* Channel Dropdown */}
                  <select 
                    className="w-full bg-[#0c0c10] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 focus:outline-none cursor-pointer"
                    value={youtubeVideo}
                    onChange={(e) => {
                      const selected = e.target.selectedOptions[0]
                      setYoutubeVideo(e.target.value)
                      setYoutubeLabel(selected.text)
                    }}
                  >
                    <optgroup label="📺 Live News">
                      <option value="dp8PhLsUcFE">Bloomberg TV Live</option>
                      <option value="9Auq9mYxFEE">CNBC Live</option>
                      <option value="Nq7LnaqSPpc">Yahoo Finance Live</option>
                    </optgroup>
                    <optgroup label="🏛️ Official">
                      <option value="V7lVPAv8Zw0">White House</option>
                      <option value="TBQMnQpjPzo">Federal Reserve</option>
                    </optgroup>
                    <optgroup label="₿ Crypto">
                      <option value="rUcFXFd0rik">Crypto Banter</option>
                      <option value="86g7n0HvcdI">BTC Live Chart</option>
                      <option value="Dc-knZfwCfk">Coin Bureau</option>
                      <option value="eFLPRicLrxE">Ben Cowen</option>
                      <option value="oqcGTDkirUw">Ivan on Tech</option>
                      <option value="VZxNvCKq5XA">Crypto Anup</option>
                    </optgroup>
                    <optgroup label="🎵 Music">
                      <option value="jfKfPfyJRdk">Lofi Trading Beats</option>
                      <option value="4xDzrJKXOOY">Synthwave Radio</option>
                      <option value="5qap5aO4i9A">Chill Beats</option>
                      <option value="36YnV9STBqc">Jazz Radio</option>
                    </optgroup>
                  </select>
                  
                  {/* Embedded Player - starts muted, click to unmute */}
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe 
                      key={youtubeVideo}
                      src={`https://www.youtube.com/embed/${youtubeVideo}?autoplay=1&mute=0`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">{youtubeLabel} (click video to unmute)</div>
                  
                  {/* Quick Access Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <button onClick={() => { setYoutubeVideo("dp8PhLsUcFE"); setYoutubeLabel("Bloomberg") }} className="glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10">Bloomberg</button>
                    <button onClick={() => { setYoutubeVideo("rUcFXFd0rik"); setYoutubeLabel("Banter") }} className="glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10">Banter</button>
                    <button onClick={() => { setYoutubeVideo("jfKfPfyJRdk"); setYoutubeLabel("Lofi") }} className="glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10">Lofi</button>
                    <button onClick={() => { setYoutubeVideo("V7lVPAv8Zw0"); setYoutubeLabel("White House") }} className="glass rounded px-1 py-1 text-[10px] text-center hover:bg-white/10">🏛️ WH</button>
                  </div>
                </div>

              {activeTab === 'swap' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 rounded-lg overflow-hidden bg-[#050508]">
                    <iframe 
                      src="https://liqd.ag/widget?theme=dark"
                      className="w-full h-full min-h-[400px]"
                      allow="clipboard-write"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <a 
                      href="https://liqd.ag" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold rounded-lg text-center text-sm transition"
                    >
                      Open liqd.ag ↗
                    </a>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noopener noreferrer" className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-center text-xs">Hyperliquid</a>
                      <a href="https://app.1inch.io" target="_blank" rel="noopener noreferrer" className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-center text-xs">1inch</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Journal Modal */}
        {showJournalModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="glass rounded-xl p-4 w-80">
              <div className="text-sm font-medium mb-3">Add Journal Entry</div>
              <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} className="w-full bg-[#050508] border border-white/10 rounded p-2 text-sm h-24 resize-none focus:border-emerald-500/50 focus:outline-none" placeholder="What's your trade thesis?"></textarea>
              <div className="flex gap-2 mt-3">
                <button onClick={saveJournalEntry} className="flex-1 bg-emerald-400 text-black rounded py-1.5 text-sm font-medium hover:bg-emerald-500">Save</button>
                <button onClick={() => setShowJournalModal(false)} className="flex-1 bg-white/10 rounded py-1.5 text-sm hover:bg-white/20">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Trade Modal */}
        {showTradeModal && pendingTrade && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="glass rounded-xl p-4 w-72">
              <div className="text-sm font-medium mb-3">Confirm {pendingTrade.direction}</div>
              <div className="text-xs space-y-1 mb-3">
                <div className="flex justify-between"><span className="text-gray-400">Asset:</span><span>{pendingTrade.asset}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Size:</span><span>${pendingTrade.size}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Leverage:</span><span>{pendingTrade.leverage}x</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Direction:</span><span className={pendingTrade.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'}>{pendingTrade.direction}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmTrade} className={`flex-1 rounded py-1.5 text-sm font-medium ${pendingTrade.direction === 'LONG' ? 'bg-emerald-400 text-black hover:bg-emerald-500' : 'bg-red-500 text-white hover:bg-red-600'}`}>Confirm</button>
                <button onClick={() => { setShowTradeModal(false); setPendingTrade(null); }} className="flex-1 bg-white/10 rounded py-1.5 text-sm hover:bg-white/20">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
