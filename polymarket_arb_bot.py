#!/usr/bin/env python3
"""
Polymarket Arbitrage Bot - Telegram Approval Workflow
Monitors for arbitrage opportunities and sends Telegram alerts for approval
"""
import requests
import time
import json
from datetime import datetime

# Polymarket APIs
GAMMA_API = "https://gamma-api.polymarket.com"  # Market discovery
CLOB_API = "https://clob.polymarket.com"  # Orderbook/pricing

# Configuration
MIN_PROFIT = 0.02  # Minimum $0.02 profit (covers gas)
MIN_ROI = 0.02  # Minimum 2% ROI
SCAN_INTERVAL = 60  # Seconds between scans
MAX_MARKETS_TO_CHECK = 50  # Limit to avoid rate limits

# Telegram config (via OpenClaw message tool)
TELEGRAM_ENABLED = True

def log(msg):
    """Simple logging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def get_active_markets():
    """Fetch active markets from Gamma API"""
    try:
        # Gamma API endpoint for markets
        url = f"{GAMMA_API}/markets"
        params = {
            "limit": MAX_MARKETS_TO_CHECK,
            "active": "true",
            "closed": "false"
        }
        
        resp = requests.get(url, params=params, timeout=10)
        
        if resp.status_code == 200:
            markets = resp.json()
            log(f"✅ Fetched {len(markets)} active markets")
            return markets
        else:
            log(f"❌ Failed to fetch markets: HTTP {resp.status_code}")
            return []
    except Exception as e:
        log(f"❌ Error fetching markets: {e}")
        return []

def get_orderbook(token_id):
    """Fetch orderbook for a specific token"""
    try:
        url = f"{CLOB_API}/book"
        params = {"token_id": token_id}
        
        resp = requests.get(url, params=params, timeout=5)
        
        if resp.status_code == 200:
            return resp.json()
        return None
    except:
        return None

def get_best_prices(token_id):
    """Get best bid/ask prices for a token"""
    try:
        book = get_orderbook(token_id)
        if not book:
            return None, None
        
        # Best ask (what you pay to buy)
        asks = book.get("asks", [])
        best_ask = float(asks[0]["price"]) if asks else None
        
        # Best bid (what you get when selling)
        bids = book.get("bids", [])
        best_bid = float(bids[0]["price"]) if bids else None
        
        return best_ask, best_bid
    except:
        return None, None

def check_single_condition_arb(market):
    """
    Check for single-condition arbitrage (YES + NO ≠ $1.00)
    This is the simplest and most reliable strategy
    """
    try:
        # Binary markets have exactly 2 tokens (YES/NO)
        tokens = market.get("tokens", [])
        if len(tokens) != 2:
            return None
        
        # Get prices for both sides
        token_yes = tokens[0]["token_id"]
        token_no = tokens[1]["token_id"]
        
        yes_ask, yes_bid = get_best_prices(token_yes)
        no_ask, no_bid = get_best_prices(token_no)
        
        if not all([yes_ask, no_ask]):
            return None
        
        # Calculate cost to buy both YES and NO
        total_cost = yes_ask + no_ask
        
        # Arbitrage exists if total cost < $1.00
        if total_cost < 1.00:
            profit = 1.00 - total_cost
            roi = profit / total_cost if total_cost > 0 else 0
            
            if profit >= MIN_PROFIT and roi >= MIN_ROI:
                return {
                    "type": "single_condition",
                    "market_name": market.get("question", "Unknown"),
                    "market_id": market.get("condition_id"),
                    "yes_price": yes_ask,
                    "no_price": no_ask,
                    "total_cost": total_cost,
                    "profit": profit,
                    "roi": roi * 100,
                    "capital_required": total_cost * 100,  # Assume 100 shares
                    "expected_profit": profit * 100
                }
        
        return None
    except Exception as e:
        return None

def send_telegram_alert(opportunity):
    """Send opportunity alert via Telegram (through OpenClaw)"""
    if not TELEGRAM_ENABLED:
        return
    
    try:
        msg = f"""
🔥 *POLYMARKET ARBITRAGE OPPORTUNITY* 🔥

📊 *Market:* {opportunity['market_name'][:100]}

💰 *Expected Profit:* ${opportunity['expected_profit']:.2f}
📈 *ROI:* {opportunity['roi']:.2f}%
💵 *Capital Required:* ${opportunity['capital_required']:.2f}

📉 *Details:*
• YES price: ${opportunity['yes_price']:.4f}
• NO price: ${opportunity['no_price']:.4f}
• Total cost: ${opportunity['total_cost']:.4f}
• Profit per share: ${opportunity['profit']:.4f}

⏰ *Detected:* {datetime.now().strftime('%H:%M:%S')}

🎯 *Action:* Reply "EXECUTE {opportunity['market_id'][:8]}" to trade
        """
        
        # This will be executed by OpenClaw message tool
        log(f"📱 Sending Telegram alert...")
        # NOTE: In production, this would use the message tool via OpenClaw
        # For now, just log it
        log(msg)
        
    except Exception as e:
        log(f"❌ Failed to send Telegram: {e}")

def scan_for_opportunities():
    """Main scan logic"""
    log("🔍 Starting arbitrage scan...")
    
    markets = get_active_markets()
    if not markets:
        log("⚠️  No markets fetched, skipping scan")
        return
    
    opportunities = []
    
    for i, market in enumerate(markets):
        if i % 10 == 0:
            log(f"Progress: {i}/{len(markets)} markets checked...")
        
        opp = check_single_condition_arb(market)
        if opp:
            opportunities.append(opp)
            log(f"💰 FOUND: {opp['market_name'][:50]} - ${opp['expected_profit']:.2f} profit ({opp['roi']:.1f}% ROI)")
            send_telegram_alert(opp)
        
        # Rate limit protection
        time.sleep(0.2)
    
    log(f"✅ Scan complete: {len(opportunities)} opportunities found")
    return opportunities

def main():
    """Main loop"""
    log("🚀 Polymarket Arbitrage Bot Starting...")
    log(f"⚙️  Config: Min profit ${MIN_PROFIT}, Min ROI {MIN_ROI*100}%, Interval {SCAN_INTERVAL}s")
    log(f"📱 Telegram alerts: {'ENABLED' if TELEGRAM_ENABLED else 'DISABLED'}")
    
    scan_count = 0
    
    while True:
        try:
            scan_count += 1
            log(f"\n{'='*60}")
            log(f"SCAN #{scan_count}")
            log(f"{'='*60}")
            
            opportunities = scan_for_opportunities()
            
            log(f"\n⏰ Next scan in {SCAN_INTERVAL} seconds...")
            time.sleep(SCAN_INTERVAL)
            
        except KeyboardInterrupt:
            log("\n👋 Shutting down gracefully...")
            break
        except Exception as e:
            log(f"❌ Error in main loop: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
