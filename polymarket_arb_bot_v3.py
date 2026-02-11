#!/usr/bin/env python3
"""
Polymarket Arbitrage Bot V3 - Real Orderbook Prices
Uses CLOB orderbook for actual executable prices (not mid-market)
"""
import requests
import json
from datetime import datetime
import time

# APIs
GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"

# Configuration
MIN_PROFIT = 0.005  # $0.005/share (covers gas + fees)
MIN_ROI = 0.005  # 0.5% ROI minimum
MAX_MARKETS = 100

def log(msg):
    """Simple logging"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def get_active_markets():
    """Fetch active binary markets"""
    try:
        url = f"{GAMMA_API}/markets"
        resp = requests.get(url, params={"limit": MAX_MARKETS, "active": "true", "closed": "false"}, timeout=10)
        resp.raise_for_status()
        
        markets = resp.json()
        binary_markets = []
        
        for m in markets:
            outcomes = json.loads(m.get("outcomes", "[]"))
            clob_tokens = json.loads(m.get("clobTokenIds", "[]"))
            
            # Binary market with valid CLOB token IDs
            if len(outcomes) == 2 and len(clob_tokens) == 2 and outcomes[0] == "Yes":
                binary_markets.append(m)
        
        return binary_markets
    except Exception as e:
        log(f"❌ Error fetching markets: {e}")
        return []

def get_best_ask(token_id):
    """
    Get best ask price (what you pay to BUY)
    """
    try:
        url = f"{CLOB_API}/price"
        resp = requests.get(url, params={"token_id": token_id, "side": "buy"}, timeout=5)
        
        if resp.status_code == 200:
            data = resp.json()
            return float(data.get("price", 999))  # Return 999 if no price
        return None
    except:
        return None

def get_orderbook(token_id):
    """
    Get full orderbook for a token
    Returns (best_ask, best_bid, depth)
    """
    try:
        url = f"{CLOB_API}/book"
        resp = requests.get(url, params={"token_id": token_id}, timeout=5)
        
        if resp.status_code == 200:
            book = resp.json()
            
            asks = book.get("asks", [])
            bids = book.get("bids", [])
            
            best_ask = float(asks[0]["price"]) if asks else None
            best_bid = float(bids[0]["price"]) if bids else None
            
            ask_depth = sum(float(a["size"]) for a in asks[:5])  # Top 5 levels
            
            return best_ask, best_bid, ask_depth
        
        return None, None, 0
    except Exception as e:
        return None, None, 0

def check_arbitrage(market):
    """
    Check for single-condition arbitrage using CLOB orderbook
    
    Strategy: Buy YES + NO, wait for resolution, guaranteed $1.00 payout
    Profit = $1.00 - (YES_ask + NO_ask)
    """
    try:
        clob_tokens = json.loads(market.get("clobTokenIds", "[]"))
        if len(clob_tokens) != 2:
            return None
        
        token_yes = clob_tokens[0]
        token_no = clob_tokens[1]
        
        # Get best ask prices (what we pay to buy)
        yes_ask, yes_bid, yes_depth = get_orderbook(token_yes)
        no_ask, no_bid, no_depth = get_orderbook(token_no)
        
        if not (yes_ask and no_ask):
            return None
        
        # Total cost to buy both sides
        total_cost = yes_ask + no_ask
        
        # Profit per share
        profit = 1.00 - total_cost
        roi = (profit / total_cost * 100) if total_cost > 0 else 0
        
        # Minimum depth check (can we actually execute?)
        min_depth = min(yes_depth, no_depth)
        
        if profit >= MIN_PROFIT and roi >= MIN_ROI and min_depth > 10:
            return {
                "market_id": market.get("id"),
                "condition_id": market.get("conditionId"),
                "question": market.get("question", "Unknown")[:100],
                "yes_ask": yes_ask,
                "no_ask": no_ask,
                "total_cost": total_cost,
                "profit": profit,
                "roi": roi,
                "liquidity": float(market.get("liquidity", 0)),
                "volume_24h": float(market.get("volume24hr", 0)),
                "min_depth": min_depth,
                "token_yes": token_yes,
                "token_no": token_no,
                "url": f"https://polymarket.com/event/{market.get('slug')}",
                "timestamp": datetime.now().isoformat()
            }
        
        return None
        
    except Exception as e:
        return None

def scan_markets():
    """Scan for arbitrage opportunities"""
    log("🔍 Scanning for arbitrage with real orderbook data...\n")
    
    markets = get_active_markets()
    log(f"✅ Fetched {len(markets)} binary markets with CLOB orderbooks\n")
    
    opportunities = []
    checked = 0
    skipped = 0
    
    for i, market in enumerate(markets):
        if i % 25 == 0 and i > 0:
            log(f"   Progress: {i}/{len(markets)} markets checked...")
        
        opp = check_arbitrage(market)
        
        if opp:
            opportunities.append(opp)
            log(f"\n💰 ARBITRAGE OPPORTUNITY #{len(opportunities)}")
            log(f"   Market: {opp['question']}")
            log(f"   YES: ${opp['yes_ask']:.4f} | NO: ${opp['no_ask']:.4f}")
            log(f"   Total cost: ${opp['total_cost']:.4f}")
            log(f"   Profit: ${opp['profit']:.4f}/share ({opp['roi']:.2f}% ROI)")
            log(f"   Depth: ${opp['min_depth']:.0f} available")
            log(f"   URL: {opp['url']}\n")
        
        checked += 1
        
        # Rate limit protection
        time.sleep(0.1)
    
    log(f"\n{'='*80}")
    log(f"📊 SCAN COMPLETE")
    log(f"{'='*80}")
    log(f"   Markets checked: {checked}")
    log(f"   Opportunities found: {len(opportunities)}")
    
    if opportunities:
        total_profit_1k = sum(o['profit'] * 1000 for o in opportunities)
        log(f"   Potential profit on $1000 capital: ${total_profit_1k:.2f}")
        log(f"\n🎯 {len(opportunities)} REAL ARBITRAGE OPPORTUNITIES DETECTED!")
    else:
        log(f"   Market currently efficient - no arb > ${MIN_PROFIT}/share ({MIN_ROI*100}% ROI)")
    
    return opportunities

def save_results(opportunities):
    """Save opportunities to JSON"""
    if not opportunities:
        return
    
    filename = f"/Users/erik/.openclaw/workspace/polymarket_arb_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(filename, 'w') as f:
        json.dump({
            "scan_time": datetime.now().isoformat(),
            "count": len(opportunities),
            "opportunities": opportunities
        }, f, indent=2)
    
    log(f"\n💾 Results saved to: {filename}")

def main():
    """Main execution"""
    log("🚀 Polymarket Arbitrage Bot V3 - CLOB Orderbook Edition")
    log(f"⚙️  Config: Min profit ${MIN_PROFIT}/share, Min ROI {MIN_ROI*100}%")
    log(f"📊 Scanning {MAX_MARKETS} markets\n")
    
    try:
        opportunities = scan_markets()
        
        if opportunities:
            save_results(opportunities)
            
            log(f"\n📱 TELEGRAM ALERT:")
            log(f"   🔥 {len(opportunities)} arbitrage opportunities detected!")
            log(f"   Check workspace for detailed JSON results")
        
        log(f"\n✅ Scan finished at {datetime.now().strftime('%H:%M:%S')}")
        
    except KeyboardInterrupt:
        log("\n👋 Interrupted by user")
    except Exception as e:
        log(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
