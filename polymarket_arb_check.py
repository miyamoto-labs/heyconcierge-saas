#!/usr/bin/env python3
"""
Polymarket Arbitrage Diagnostic - Show top 10 closest opportunities
"""
import requests
import json
from datetime import datetime

GAMMA_API = "https://gamma-api.polymarket.com"

def get_markets():
    """Fetch active binary markets"""
    try:
        url = f"{GAMMA_API}/markets"
        resp = requests.get(url, params={"limit": 200, "active": "true", "closed": "false"}, timeout=10)
        resp.raise_for_status()
        
        markets = resp.json()
        binary_markets = []
        
        for m in markets:
            outcomes = json.loads(m.get("outcomes", "[]"))
            if len(outcomes) == 2 and outcomes[0] == "Yes" and outcomes[1] == "No":
                binary_markets.append(m)
        
        return binary_markets
    except Exception as e:
        print(f"Error: {e}")
        return []

def analyze_markets():
    """Find and rank arbitrage opportunities"""
    print("🔍 Analyzing Polymarket for arbitrage opportunities...\n")
    
    markets = get_markets()
    print(f"✅ Fetched {len(markets)} binary markets\n")
    
    opportunities = []
    
    for m in markets:
        try:
            prices = json.loads(m.get("outcomePrices", "[]"))
            if len(prices) != 2:
                continue
            
            yes_price = float(prices[0])
            no_price = float(prices[1])
            total_cost = yes_price + no_price
            profit = 1.00 - total_cost
            roi = (profit / total_cost * 100) if total_cost > 0 else 0
            
            opportunities.append({
                "question": m.get("question", "Unknown")[:80],
                "yes": yes_price,
                "no": no_price,
                "total": total_cost,
                "profit": profit,
                "roi": roi,
                "liquidity": float(m.get("liquidity", 0)),
                "volume_24h": float(m.get("volume24hr", 0))
            })
        except:
            continue
    
    # Sort by profit potential
    opportunities.sort(key=lambda x: x['profit'], reverse=True)
    
    print("📊 TOP 20 CLOSEST TO ARBITRAGE:\n")
    print(f"{'#':<3} {'Question':<80} {'YES':<8} {'NO':<8} {'Total':<8} {'Profit':<10} {'ROI':<8} {'Liq':<10}")
    print("=" * 160)
    
    for i, opp in enumerate(opportunities[:20], 1):
        status = "✅ ARB!" if opp['profit'] > 0.01 else ""
        print(f"{i:<3} {opp['question']:<80} ${opp['yes']:<7.4f} ${opp['no']:<7.4f} ${opp['total']:<7.4f} ${opp['profit']:<9.4f} {opp['roi']:<7.2f}% ${opp['liquidity']:<9.0f} {status}")
    
    # Stats
    profitable = [o for o in opportunities if o['profit'] > 0.01]
    print(f"\n📈 STATS:")
    print(f"   Total markets analyzed: {len(opportunities)}")
    print(f"   Markets with profit > $0.01/share: {len(profitable)}")
    
    if profitable:
        total_potential = sum(o['profit'] * 1000 for o in profitable)
        print(f"   Potential profit on $1000 spread: ${total_potential:.2f}")
        print(f"\n🎯 {len(profitable)} ARBITRAGE OPPORTUNITIES FOUND!")
    else:
        print(f"   Current market efficiency: High (no arb > $0.01/share)")
        best = opportunities[0] if opportunities else None
        if best:
            print(f"   Best spread: ${best['profit']:.4f}/share ({best['roi']:.3f}%)")

if __name__ == "__main__":
    analyze_markets()
