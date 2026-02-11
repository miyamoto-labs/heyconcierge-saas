#!/usr/bin/env python3
"""
Whale Trader Bot - OpenClaw Integration
Monitors Polymarket whale trades and sends Telegram recommendations
Run this via: python3 whale_trader_bot.py
"""
import requests
import json
import time
from datetime import datetime

# Polymarket APIs
GAMMA_API = "https://gamma-api.polymarket.com"
DATA_API = "https://data-api.polymarket.com"

# Configuration
MIN_WHALE_SIZE = 5000  # $5K minimum to be considered a whale trade
POSITION_SIZE = 2.0  # Your copy size per trade
SCAN_INTERVAL = 300  # 5 minutes between scans

# Track what we've already alerted on
ALERTED_TRADES = set()

def fetch_recent_activity():
    """Fetch recent trading activity from Polymarket"""
    try:
        # Get recent trades from data API
        url = f"{DATA_API}/activity"
        params = {
            "type": "TRADE",
            "limit": 50
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        print(f"❌ Error fetching activity: {e}")
        return []

def analyze_trade(trade):
    """Analyze if trade is worth recommending"""
    try:
        # Extract relevant fields
        size_str = trade.get("size", "0")
        size = float(size_str) if size_str else 0
        
        price_str = trade.get("price", "0")
        price = float(price_str) if price_str else 0
        
        # Calculate USD value
        value_usd = size * price
        
        # Only recommend if >= whale threshold
        if value_usd < MIN_WHALE_SIZE:
            return None
        
        # Get market info
        market = trade.get("market", "")
        side = trade.get("side", "Unknown")
        trader = trade.get("user", "Unknown")[:10] + "..."
        
        # Calculate timestamp
        timestamp = trade.get("timestamp", 0)
        if timestamp:
            trade_time = datetime.fromtimestamp(timestamp)
            age_minutes = (datetime.now() - trade_time).total_seconds() / 60
            
            # Only recommend fresh trades (< 30 min old)
            if age_minutes > 30:
                return None
        
        return {
            "market": market,
            "side": side,
            "whale_size": value_usd,
            "price": price,
            "trader": trader,
            "timestamp": timestamp,
            "trade_id": trade.get("id", str(time.time()))
        }
        
    except Exception as e:
        print(f"⚠️  Error analyzing trade: {e}")
        return None

def format_telegram_message(trade_data):
    """Format trade recommendation for Telegram"""
    market = trade_data["market"]
    side = trade_data["side"]
    whale_size = trade_data["whale_size"]
    price = trade_data["price"]
    trader = trade_data["trader"]
    
    # Calculate copy size
    copy_size = min(POSITION_SIZE, whale_size * 0.001)  # 0.1% of whale size
    
    message = f"""🐋 **WHALE TRADE ALERT**

📊 **Market:** {market}
📈 **Side:** {side}
💰 **Whale Size:** ${whale_size:,.0f}
💵 **Price:** ${price:.3f}
👤 **Trader:** {trader}

💸 **Your Copy Size:** ${copy_size:.2f}

**Reply:**
• ✅ "YES" - Execute trade
• ❌ "NO" - Skip
• ℹ️ "INFO" - More details"""
    
    return message

def scan_and_recommend():
    """Main scan loop - call this from OpenClaw"""
    print(f"🔍 Scanning for whale trades... ({datetime.now().strftime('%H:%M:%S')})")
    
    # Fetch recent activity
    trades = fetch_recent_activity()
    
    if not trades:
        print("📊 No recent trades found")
        return []
    
    print(f"📊 Analyzing {len(trades)} recent trades...")
    
    recommendations = []
    
    for trade in trades:
        # Skip if already alerted
        trade_id = trade.get("id")
        if trade_id in ALERTED_TRADES:
            continue
        
        # Analyze trade
        trade_data = analyze_trade(trade)
        
        if trade_data:
            # Format message
            message = format_telegram_message(trade_data)
            
            recommendations.append({
                "trade_id": trade_id,
                "message": message,
                "trade_data": trade_data
            })
            
            # Mark as alerted
            ALERTED_TRADES.add(trade_id)
            
            print(f"🐋 FOUND: {trade_data['market'][:50]} - ${trade_data['whale_size']:,.0f}")
    
    if not recommendations:
        print("✅ No new whale trades meeting criteria")
    else:
        print(f"🎯 {len(recommendations)} whale trades to recommend!")
    
    return recommendations

if __name__ == "__main__":
    print("🤖 Whale Trader Bot")
    print(f"🐋 Whale threshold: ${MIN_WHALE_SIZE:,}")
    print(f"💰 Your position size: ${POSITION_SIZE}")
    print("")
    
    # Run scan
    recommendations = scan_and_recommend()
    
    if recommendations:
        print("\n📱 TELEGRAM MESSAGES TO SEND:")
        print("=" * 60)
        for rec in recommendations:
            print(f"\nTrade ID: {rec['trade_id']}")
            print(rec['message'])
            print("-" * 60)
    
    print(f"\n✅ Scan complete at {datetime.now().strftime('%H:%M:%S')}")
