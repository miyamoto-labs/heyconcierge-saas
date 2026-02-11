#!/usr/bin/env python3
"""
Polymarket Telegram Trading Bot
Monitors whale trades, recommends via Telegram, executes on approval
"""
import requests
import json
import time
from datetime import datetime, timedelta
from web3 import Web3

# Wallet configuration
WALLET_ADDRESS = "0xD8CA1953F4A4A2dA9EDD28fD40E778C2F706757F"
PRIVATE_KEY = "2e8718c223fde232cd36aff0ffead182d1c8191c6b7b5aed8176cc03585e592b"  # Without 0x prefix

# Polymarket configuration
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"
POLYGON_RPC = "https://polygon-rpc.com"

# Trading parameters
MIN_WHALE_SIZE = 4000  # Minimum $4K to be considered a whale trade
MAX_TRADE_AGE_HOURS = 1  # Only consider trades within last hour
POSITION_SIZE_USD = 2.0  # Default position size per trade
MAX_DAILY_TRADES = 5  # Safety limit

# Telegram tracking
PENDING_APPROVALS = {}  # Store trades awaiting approval
EXECUTED_TRADES = []  # Track executed trades

def log(msg):
    """Simple logging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def get_whale_trades():
    """
    Fetch recent whale trades from Polymarket
    Note: This is a placeholder - actual implementation would scrape brosonpm.trade
    or use Polymarket's data API to find large recent trades
    """
    try:
        # For now, we'll use Polymarket's activity API
        # In production, we'd scrape brosonpm.trade or use a whale tracking service
        
        log("🔍 Scanning for whale trades...")
        
        # Placeholder: Return sample format
        # Real implementation would fetch from brosonpm.trade or Polymarket API
        
        return []
        
    except Exception as e:
        log(f"❌ Error fetching whale trades: {e}")
        return []

def analyze_trade(trade):
    """
    Analyze if a whale trade is worth recommending
    
    Criteria:
    - Trade size >= $4K (whale threshold)
    - Fresh (< 1 hour old)
    - Clear market (not sports unless obvious)
    - Good liquidity
    """
    try:
        # Extract trade details
        size = trade.get("size_usd", 0)
        age_hours = trade.get("age_hours", 999)
        market_name = trade.get("market", "Unknown")
        side = trade.get("side", "Unknown")  # YES or NO
        
        # Score the trade
        score = 0
        
        # Size scoring (larger = more conviction)
        if size >= 10000:
            score += 5
        elif size >= 7000:
            score += 3
        elif size >= 4000:
            score += 1
        
        # Freshness scoring
        if age_hours < 0.5:
            score += 3
        elif age_hours < 1:
            score += 2
        elif age_hours < 2:
            score += 1
        
        # Market type (avoid sports for now)
        if "sports" not in market_name.lower():
            score += 2
        
        # Recommend if score >= 5
        return score >= 5, score
        
    except Exception as e:
        log(f"⚠️  Error analyzing trade: {e}")
        return False, 0

def send_telegram_recommendation(trade, score):
    """
    Send trade recommendation to Telegram via OpenClaw message tool
    
    This function is called by the monitoring script and will be executed
    by OpenClaw's message tool in the main session
    """
    try:
        market = trade.get("market", "Unknown market")
        side = trade.get("side", "Unknown")
        whale_size = trade.get("size_usd", 0)
        trader = trade.get("trader_address", "Unknown")[:10] + "..."
        
        # Calculate our position size
        copy_size = min(POSITION_SIZE_USD, whale_size * 0.001)  # 0.1% of whale size
        
        message = f"""🐋 **WHALE TRADE DETECTED**

📊 **Market:** {market}
📈 **Position:** {side}
💰 **Whale Size:** ${whale_size:,.0f}
👤 **Trader:** {trader}
⭐ **Quality Score:** {score}/10

💵 **Your Copy Size:** ${copy_size:.2f}

🎯 **Reply:**
• YES - Execute trade
• NO - Skip this one
• INFO - Get more details"""
        
        # Store for approval tracking
        trade_id = f"{trader}_{market[:20]}_{int(time.time())}"
        PENDING_APPROVALS[trade_id] = {
            "trade": trade,
            "copy_size": copy_size,
            "timestamp": datetime.now().isoformat(),
            "score": score
        }
        
        # Return message for OpenClaw to send
        return {
            "action": "send_telegram",
            "message": message,
            "trade_id": trade_id
        }
        
    except Exception as e:
        log(f"❌ Error preparing Telegram message: {e}")
        return None

def execute_trade(trade_id, user_approved=True):
    """
    Execute a Polymarket trade after user approval
    
    Args:
        trade_id: ID of the pending trade
        user_approved: Whether user approved (True) or rejected (False)
    """
    if not user_approved:
        log(f"❌ Trade {trade_id} rejected by user")
        if trade_id in PENDING_APPROVALS:
            del PENDING_APPROVALS[trade_id]
        return {
            "status": "rejected",
            "message": "Trade rejected by user"
        }
    
    if trade_id not in PENDING_APPROVALS:
        log(f"⚠️  Trade {trade_id} not found in pending approvals")
        return {
            "status": "error",
            "message": "Trade not found"
        }
    
    try:
        pending = PENDING_APPROVALS[trade_id]
        trade = pending["trade"]
        copy_size = pending["copy_size"]
        
        log(f"🚀 Executing trade: {trade.get('market', 'Unknown')}")
        
        # TODO: Implement actual Polymarket trade execution
        # This requires:
        # 1. Get market token IDs from Gamma API
        # 2. Calculate order parameters
        # 3. Sign order with private key
        # 4. Submit to CLOB API
        
        # For now, return placeholder
        result = {
            "status": "simulated",
            "market": trade.get("market"),
            "side": trade.get("side"),
            "size": copy_size,
            "message": "Trade execution not yet implemented - need CLOB integration"
        }
        
        # Track execution
        EXECUTED_TRADES.append({
            "trade_id": trade_id,
            "executed_at": datetime.now().isoformat(),
            "result": result
        })
        
        # Clean up pending
        del PENDING_APPROVALS[trade_id]
        
        return result
        
    except Exception as e:
        log(f"❌ Error executing trade {trade_id}: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

def monitor_loop(duration_minutes=60):
    """
    Main monitoring loop
    Scans for whale trades and sends recommendations
    """
    log("🤖 Polymarket Telegram Trader Starting...")
    log(f"⏰ Monitoring for {duration_minutes} minutes")
    log(f"💰 Position size: ${POSITION_SIZE_USD} per trade")
    log(f"🐋 Whale threshold: ${MIN_WHALE_SIZE:,}+")
    log("")
    
    start_time = datetime.now()
    recommendations_sent = 0
    
    while True:
        # Check if duration exceeded
        elapsed = (datetime.now() - start_time).total_seconds() / 60
        if elapsed >= duration_minutes:
            log(f"⏰ Monitoring duration ({duration_minutes}m) complete")
            break
        
        # Check daily trade limit
        today_trades = [t for t in EXECUTED_TRADES 
                       if datetime.fromisoformat(t["executed_at"]).date() == datetime.now().date()]
        if len(today_trades) >= MAX_DAILY_TRADES:
            log(f"⚠️  Daily trade limit ({MAX_DAILY_TRADES}) reached")
            break
        
        # Fetch whale trades
        trades = get_whale_trades()
        
        if not trades:
            log("📊 No new whale trades found")
        else:
            log(f"📊 Found {len(trades)} potential whale trades")
            
            # Analyze each trade
            for trade in trades:
                should_recommend, score = analyze_trade(trade)
                
                if should_recommend:
                    recommendation = send_telegram_recommendation(trade, score)
                    
                    if recommendation:
                        log(f"📱 Sent recommendation: {trade.get('market', 'Unknown')[:50]}")
                        recommendations_sent += 1
                        
                        # In production, this would use OpenClaw's message tool
                        # For now, just print
                        print(json.dumps(recommendation, indent=2))
        
        # Wait before next scan
        log(f"⏳ Waiting 60 seconds before next scan...")
        log(f"📊 Stats: {recommendations_sent} recommendations, {len(EXECUTED_TRADES)} executed, {len(PENDING_APPROVALS)} pending")
        time.sleep(60)
    
    # Summary
    log("")
    log("=" * 60)
    log("📊 MONITORING SESSION COMPLETE")
    log("=" * 60)
    log(f"⏰ Duration: {duration_minutes} minutes")
    log(f"📱 Recommendations sent: {recommendations_sent}")
    log(f"✅ Trades executed: {len(EXECUTED_TRADES)}")
    log(f"⏸️  Pending approvals: {len(PENDING_APPROVALS)}")
    log("")

if __name__ == "__main__":
    import sys
    
    # Parse duration argument
    duration = 60  # Default 1 hour
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except:
            pass
    
    monitor_loop(duration_minutes=duration)
