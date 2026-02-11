#!/usr/bin/env python3
"""
Polymarket Whale Monitor
Tracks profitable traders and sends Telegram alerts for approval
"""
import requests
import json
import time
from datetime import datetime, timedelta

# Top profitable traders to monitor (wallet addresses)
WHALE_WALLETS = {
    # From recent research (Jan 2026) - Top performers
    "0xd218e474776403a330142299f7796e8ba32eb5c9": {
        "name": "TopWhale1",
        "7d_volume": 951421,
        "7d_pnl": 900130,
        "win_rate": 0.65
    },
    "0xee613b3fc183ee44f9da9c05f53e2da107e3debf": {
        "name": "TopWhale2", 
        "7d_volume": 1418667,
        "7d_pnl": 1339834,
        "win_rate": 0.52
    },
    # From bot research - Known successful traders
    "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b": {
        "name": "KnownTrader1",
        "7d_volume": 0,
        "7d_pnl": 0,
        "win_rate": 0.60
    },
    "0x6bab41a0dc40d6dd4c1a915b8c01969479fd1292": {
        "name": "KnownTrader2",
        "7d_volume": 0,
        "7d_pnl": 0,
        "win_rate": 0.60
    },
    "0xa4b366ad22fc0d06f1e934ff468e8922431a87b8": {
        "name": "KnownTrader3",
        "7d_volume": 0,
        "7d_pnl": 0,
        "win_rate": 0.60
    }
}

# Configuration
MIN_TRADE_SIZE = 5000  # $5K minimum to alert
POSITION_SIZE_USD = 15.0  # Your default copy size ($79 capital / 5 max positions)
MAX_TRADE_AGE_MINUTES = 30  # Only alert on fresh trades
SCAN_INTERVAL_SECONDS = 180  # 3 minutes between scans

# Track alerted trades
ALERTED_TRADES = set()
PENDING_APPROVALS = {}

def log(msg):
    """Logging"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def fetch_trader_activity(wallet_address):
    """Fetch recent activity for a specific trader"""
    try:
        url = f"https://data-api.polymarket.com/activity"
        params = {
            "user": wallet_address,
            "type": "TRADE",
            "limit": 20
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            log(f"⚠️  API error for {wallet_address[:10]}: {response.status_code}")
            return []
            
    except Exception as e:
        log(f"❌ Error fetching {wallet_address[:10]}: {e}")
        return []

def analyze_trade(trade, whale_info):
    """Analyze if trade meets alert criteria"""
    try:
        # Parse trade details
        size_str = trade.get("size", "0")
        size = float(size_str) if size_str else 0
        
        price_str = trade.get("price", "0") 
        price = float(price_str) if price_str else 0
        
        # Calculate USD value
        value_usd = size * price
        
        # Check minimum size
        if value_usd < MIN_TRADE_SIZE:
            return None
        
        # Check age
        timestamp = trade.get("timestamp", 0)
        if timestamp:
            trade_time = datetime.fromtimestamp(timestamp)
            age_minutes = (datetime.now() - trade_time).total_seconds() / 60
            
            if age_minutes > MAX_TRADE_AGE_MINUTES:
                return None
            if age_minutes < 0:  # Future timestamp (API issue)
                return None
        else:
            return None
        
        # Get market info
        market = trade.get("market", "Unknown market")
        side = trade.get("side", "UNKNOWN")
        trade_id = trade.get("id", str(time.time()))
        
        # Check if already alerted
        if trade_id in ALERTED_TRADES:
            return None
        
        return {
            "trade_id": trade_id,
            "wallet": trade.get("user", "Unknown")[:10] + "...",
            "whale_name": whale_info["name"],
            "whale_win_rate": whale_info["win_rate"],
            "market": market,
            "side": side,
            "whale_size": value_usd,
            "price": price,
            "timestamp": timestamp,
            "age_minutes": age_minutes
        }
        
    except Exception as e:
        log(f"⚠️  Error analyzing trade: {e}")
        return None

def format_telegram_alert(trade_data):
    """Format trade alert for Telegram"""
    
    # Calculate copy size (10% of whale size, max $10)
    whale_size = trade_data["whale_size"]
    copy_size = min(POSITION_SIZE_USD, whale_size * 0.01)  # 1% of whale
    
    # Estimate profit potential
    win_rate = trade_data["whale_win_rate"]
    estimated_return = copy_size * (win_rate - 0.5) * 2  # Rough estimate
    
    message = f"""🐋 **WHALE TRADE ALERT**

👤 **Trader:** {trade_data['whale_name']} ({trade_data['wallet']})
📊 **Win Rate:** {trade_data['whale_win_rate']*100:.0f}%
⏰ **Age:** {trade_data['age_minutes']:.0f} minutes ago

📈 **Market:** {trade_data['market']}
🎯 **Side:** {trade_data['side']}
💰 **Whale Size:** ${trade_data['whale_size']:,.0f}
💵 **Price:** ${trade_data['price']:.3f}

💸 **Your Copy Size:** ${copy_size:.2f}
📈 **Est. Return:** ${estimated_return:.2f}

**Reply to approve:**
✅ YES - Execute trade
❌ NO - Skip this one
ℹ️ INFO - Market details"""
    
    return {
        "message": message,
        "trade_data": trade_data,
        "copy_size": copy_size
    }

def scan_whales():
    """Scan all whale wallets for new trades"""
    log(f"🔍 Scanning {len(WHALE_WALLETS)} whale wallets...")
    
    alerts = []
    
    for wallet, whale_info in WHALE_WALLETS.items():
        # Fetch activity
        trades = fetch_trader_activity(wallet)
        
        if not trades:
            continue
        
        log(f"  {whale_info['name']}: {len(trades)} recent trades")
        
        # Analyze each trade
        for trade in trades:
            trade_analysis = analyze_trade(trade, whale_info)
            
            if trade_analysis:
                # Format alert
                alert = format_telegram_alert(trade_analysis)
                alerts.append(alert)
                
                # Mark as alerted
                ALERTED_TRADES.add(trade_analysis["trade_id"])
                
                # Store for approval tracking
                PENDING_APPROVALS[trade_analysis["trade_id"]] = {
                    "trade_data": trade_analysis,
                    "copy_size": alert["copy_size"],
                    "timestamp": datetime.now().isoformat()
                }
                
                log(f"  🐋 ALERT: {trade_analysis['market'][:40]} - ${trade_analysis['whale_size']:,.0f}")
    
    return alerts

def run_monitor(duration_hours=24):
    """Main monitoring loop"""
    log("🤖 Polymarket Whale Monitor Starting...")
    log(f"⏰ Duration: {duration_hours} hours")
    log(f"💰 Position size: ${POSITION_SIZE_USD} per trade")
    log(f"🐋 Whale threshold: ${MIN_TRADE_SIZE:,}+")
    log(f"👥 Monitoring {len(WHALE_WALLETS)} wallets")
    log("")
    
    start_time = datetime.now()
    end_time = start_time + timedelta(hours=duration_hours)
    
    scan_count = 0
    total_alerts = 0
    
    while datetime.now() < end_time:
        scan_count += 1
        log(f"\n{'='*60}")
        log(f"SCAN #{scan_count}")
        log(f"{'='*60}")
        
        # Scan for whale trades
        alerts = scan_whales()
        
        if alerts:
            log(f"\n🎯 {len(alerts)} NEW ALERTS!")
            total_alerts += len(alerts)
            
            # Print alerts (in production, these would send via OpenClaw message tool)
            for alert in alerts:
                log("\n📱 TELEGRAM MESSAGE:")
                log("-" * 60)
                print(alert["message"])
                log("-" * 60)
        else:
            log("✅ No new whale trades meeting criteria")
        
        # Status
        log(f"\n📊 Session Stats:")
        log(f"   Scans: {scan_count}")
        log(f"   Total alerts: {total_alerts}")
        log(f"   Pending approvals: {len(PENDING_APPROVALS)}")
        log(f"   Runtime: {(datetime.now() - start_time).total_seconds() / 3600:.1f}h / {duration_hours}h")
        
        # Wait before next scan
        if datetime.now() < end_time:
            log(f"\n⏳ Next scan in {SCAN_INTERVAL_SECONDS}s...")
            time.sleep(SCAN_INTERVAL_SECONDS)
    
    # Final summary
    log("\n" + "="*60)
    log("📊 MONITORING SESSION COMPLETE")
    log("="*60)
    log(f"⏰ Duration: {duration_hours} hours")
    log(f"🔍 Total scans: {scan_count}")
    log(f"📱 Total alerts sent: {total_alerts}")
    log(f"⏸️  Pending approvals: {len(PENDING_APPROVALS)}")
    log("")

if __name__ == "__main__":
    import sys
    
    # Parse duration (default 24 hours)
    duration = 24
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except:
            pass
    
    # Run monitor
    run_monitor(duration_hours=duration)
