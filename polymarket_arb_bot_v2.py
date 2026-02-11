#!/usr/bin/env python3
"""
Polymarket Arbitrage Bot V2 - Fixed API Integration
Monitors for arbitrage opportunities using Gamma API prices
"""
import requests
import json
from datetime import datetime
import time

# Polymarket API
GAMMA_API = "https://gamma-api.polymarket.com"

# Configuration
MIN_PROFIT = 0.01  # Minimum $0.01 profit per share (covers gas)
MIN_ROI = 0.01  # Minimum 1% ROI
SCAN_INTERVAL = 60  # Seconds between scans
MAX_MARKETS = 100  # Markets to check per scan

def log(msg):
    """Simple logging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def get_active_markets():
    """Fetch active binary markets from Gamma API"""
    try:
        url = f"{GAMMA_API}/markets"
        params = {
            "limit": MAX_MARKETS,
            "active": "true",
            "closed": "false"
        }
        
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        
        markets = resp.json()
        
        # Filter to binary markets only (YES/NO outcomes)
        binary_markets = []
        for m in markets:
            outcomes = json.loads(m.get("outcomes", "[]"))
            if len(outcomes) == 2 and outcomes[0] == "Yes" and outcomes[1] == "No":
                binary_markets.append(m)
        
        log(f"✅ Fetched {len(binary_markets)} binary markets (from {len(markets)} total)")
        return binary_markets
        
    except Exception as e:
        log(f"❌ Error fetching markets: {e}")
        return []

def check_arbitrage(market):
    """
    Check for single-condition arbitrage (YES + NO ≠ $1.00)
    
    Strategy: Buy both YES and NO shares. One will win, paying $1.00.
    If total cost < $1.00, guaranteed profit!
    """
    try:
        # Extract prices
        prices = json.loads(market.get("outcomePrices", "[]"))
        if len(prices) != 2:
            return None
        
        yes_price = float(prices[0])  # Price to buy YES
        no_price = float(prices[1])   # Price to buy NO
        
        # Total cost to buy both
        total_cost = yes_price + no_price
        
        # Profit per share
        profit = 1.00 - total_cost
        roi = (profit / total_cost * 100) if total_cost > 0 else 0
        
        # Check if profitable
        if profit >= MIN_PROFIT and roi >= MIN_ROI:
            return {
                "type": "single_condition",
                "market_id": market.get("id"),
                "condition_id": market.get("conditionId"),
                "question": market.get("question", "Unknown"),
                "yes_price": yes_price,
                "no_price": no_price,
                "total_cost": total_cost,
                "profit_per_share": profit,
                "roi": roi,
                "liquidity": float(market.get("liquidity", 0)),
                "volume_24h": float(market.get("volume24hr", 0)),
                "url": f"https://polymarket.com/event/{market.get('slug')}",
                "detected_at": datetime.now().isoformat()
            }
        
        return None
        
    except Exception as e:
        # log(f"⚠️  Error checking {market.get('id')}: {e}")
        return None

def scan_for_opportunities():
    """Main scan logic"""
    log("🔍 Starting arbitrage scan...")
    
    markets = get_active_markets()
    if not markets:
        log("⚠️  No markets fetched, skipping scan")
        return []
    
    opportunities = []
    checked = 0
    
    for market in markets:
        checked += 1
        opp = check_arbitrage(market)
        
        if opp:
            opportunities.append(opp)
            log(f"")
            log(f"💰 ARBITRAGE FOUND!")
            log(f"   Market: {opp['question'][:60]}")
            log(f"   YES: ${opp['yes_price']:.4f} | NO: ${opp['no_price']:.4f}")
            log(f"   Total: ${opp['total_cost']:.4f} | Profit: ${opp['profit_per_share']:.4f} ({opp['roi']:.2f}%)")
            log(f"   Liquidity: ${opp['liquidity']:.0f} | 24h Vol: ${opp['volume_24h']:.0f}")
            log(f"   URL: {opp['url']}")
    
    log(f"")
    log(f"✅ Scan complete: Checked {checked} markets, found {len(opportunities)} opportunities")
    
    return opportunities

def save_opportunities(opportunities):
    """Save opportunities to JSON file"""
    if not opportunities:
        return
    
    filename = f"/Users/erik/.openclaw/workspace/polymarket_opportunities_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(filename, 'w') as f:
        json.dump({
            "scan_time": datetime.now().isoformat(),
            "count": len(opportunities),
            "opportunities": opportunities
        }, f, indent=2)
    
    log(f"💾 Saved {len(opportunities)} opportunities to {filename}")

def main():
    """Main execution"""
    log("🚀 Polymarket Arbitrage Bot V2 Starting...")
    log(f"⚙️  Config: Min profit ${MIN_PROFIT}/share, Min ROI {MIN_ROI*100}%")
    log(f"📊 Checking {MAX_MARKETS} markets per scan, every {SCAN_INTERVAL}s")
    log("")
    
    try:
        opportunities = scan_for_opportunities()
        
        if opportunities:
            log("")
            log(f"🎯 Summary: {len(opportunities)} opportunities detected")
            save_opportunities(opportunities)
            
            # Calculate potential profit
            total_profit_1k = sum(opp['profit_per_share'] * 1000 for opp in opportunities)
            log(f"💵 Potential profit on $1000 spread across all: ${total_profit_1k:.2f}")
        else:
            log("")
            log("📉 No arbitrage opportunities found this scan")
        
        log("")
        log("✅ Scan complete!")
        
    except KeyboardInterrupt:
        log("\n👋 Shutting down...")
    except Exception as e:
        log(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
