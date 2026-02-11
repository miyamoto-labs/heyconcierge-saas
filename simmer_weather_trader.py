#!/usr/bin/env python3
"""
Simmer Weather Trader — Automated weather market trading on Polymarket
Config from 0xMovez article: entry <15%, exit >45%, $2 max position
Uses NOAA NWS forecasts as edge over market pricing.
"""

import requests
import json
import time
from datetime import datetime

# Config (from article)
ENTRY_THRESHOLD = 0.15    # Buy below 15%
EXIT_THRESHOLD = 0.45     # Sell above 45%
MAX_POSITION = 2.00       # $2 max per trade
MAX_TRADES_PER_RUN = 5
LOCATIONS = ["NYC", "Chicago", "Seattle", "Atlanta", "Dallas", "Miami"]

# Simmer API
SIMMER_KEY = "sk_live_218e3b33520a4a89f203664a640475bc311cf2ef61dfe8f8152781413dbd37ac"
SIMMER_BASE = "https://api.simmer.markets/api/sdk"
HEADERS = {"Authorization": f"Bearer {SIMMER_KEY}", "Content-Type": "application/json"}

# NOAA NWS grid points for each city
NOAA_GRIDS = {
    "NYC": "OKX/33,37",
    "Chicago": "LOT/75,72",
    "Seattle": "SEW/124,67",
    "Atlanta": "FFC/50,88",
    "Dallas": "FWD/80,103",
    "Miami": "MFL/75,54",
}

def get_noaa_forecast(city):
    """Get NOAA NWS forecast for a city"""
    grid = NOAA_GRIDS.get(city)
    if not grid:
        return {}
    try:
        r = requests.get(f"https://api.weather.gov/gridpoints/{grid}/forecast",
                        headers={"User-Agent": "MiyamotoLabs/1.0"}, timeout=10)
        data = r.json()
        forecasts = {}
        for period in data.get("properties", {}).get("periods", []):
            if period["isDaytime"]:
                # Extract date
                date = period["startTime"][:10]  # YYYY-MM-DD
                forecasts[date] = {
                    "high": period["temperature"],
                    "unit": period["temperatureUnit"],
                    "name": period["name"],
                    "forecast": period["shortForecast"]
                }
        return forecasts
    except Exception as e:
        print(f"  ⚠️ NOAA error for {city}: {e}")
        return {}

def get_weather_markets():
    """Get all weather temperature markets from Simmer"""
    try:
        r = requests.get(f"{SIMMER_BASE}/markets",
                        params={"q": "temperature", "limit": 50},
                        headers=HEADERS, timeout=15)
        data = r.json()
        return data if isinstance(data, list) else data.get("markets", [])
    except Exception as e:
        print(f"⚠️ Market fetch error: {e}")
        return []

def parse_market(market):
    """Extract city, threshold, direction from market question"""
    q = market.get("question", "")
    city = None
    for loc in ["New York City", "Chicago", "Seattle", "Atlanta", "Dallas", "Miami"]:
        if loc in q:
            city = loc.replace("New York City", "NYC")
            break
    
    # Parse temperature threshold
    temp = None
    direction = None
    if "or higher" in q:
        direction = "above"
        try:
            temp = int(q.split("be ")[1].split("°")[0])
        except:
            pass
    elif "or below" in q:
        direction = "below"
        try:
            temp = int(q.split("be ")[1].split("°")[0])
        except:
            pass
    elif "between" in q:
        direction = "between"
        try:
            parts = q.split("between ")[1].split("°")[0]
            temp = int(parts.split("-")[0])
        except:
            pass
    
    # Extract date
    date = None
    if "February" in q:
        try:
            day = q.split("February ")[1].split("?")[0].strip()
            date = f"2026-02-{int(day):02d}"
        except:
            pass
    
    return city, temp, direction, date

def evaluate_edge(market, forecasts):
    """Compare NOAA forecast with market price to find edge"""
    city, temp, direction, date = parse_market(market)
    if not city or not temp or not date:
        return None, None
    
    forecast = forecasts.get(city, {}).get(date)
    if not forecast:
        return None, None
    
    noaa_high = forecast["high"]
    price = market.get("current_price", 0)
    
    # Calculate our probability estimate based on NOAA
    if direction == "above":
        # Will temp be >= threshold?
        diff = noaa_high - temp
        if diff >= 10:
            our_prob = 0.98
        elif diff >= 5:
            our_prob = 0.90
        elif diff >= 2:
            our_prob = 0.75
        elif diff >= 0:
            our_prob = 0.55
        elif diff >= -2:
            our_prob = 0.30
        elif diff >= -5:
            our_prob = 0.10
        else:
            our_prob = 0.02
    elif direction == "below":
        # Will temp be <= threshold?
        diff = temp - noaa_high
        if diff >= 10:
            our_prob = 0.98
        elif diff >= 5:
            our_prob = 0.90
        elif diff >= 2:
            our_prob = 0.75
        elif diff >= 0:
            our_prob = 0.55
        elif diff >= -2:
            our_prob = 0.30
        elif diff >= -5:
            our_prob = 0.10
        else:
            our_prob = 0.02
    elif direction == "between":
        # Will temp be in this 2-degree bucket?
        diff = abs(noaa_high - temp)
        if diff <= 1:
            our_prob = 0.35
        elif diff <= 3:
            our_prob = 0.15
        elif diff <= 5:
            our_prob = 0.05
        else:
            our_prob = 0.02
    else:
        return None, None
    
    edge = our_prob - price
    return edge, {
        "city": city,
        "noaa_high": noaa_high,
        "threshold": temp,
        "direction": direction,
        "date": date,
        "our_prob": our_prob,
        "market_price": price,
        "edge": edge,
        "forecast": forecast["forecast"]
    }

def place_trade(market_id, side, amount, reasoning):
    """Place a trade on Simmer (real or SIM)"""
    try:
        r = requests.post(f"{SIMMER_BASE}/trade",
                         headers=HEADERS,
                         json={
                             "market_id": market_id,
                             "side": side,
                             "amount": amount,
                             "source": "sdk:miyamoto-weather",
                             "reasoning": reasoning
                         },
                         timeout=30)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def run_scan():
    """Main scan: fetch forecasts, find edges, place trades"""
    print(f"🌦️  Simmer Weather Trader")
    print(f"⏰  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊  Config: entry <{ENTRY_THRESHOLD*100}%, exit >{EXIT_THRESHOLD*100}%, max ${MAX_POSITION}")
    print()
    
    # 1. Get NOAA forecasts for all cities
    print("📡 Fetching NOAA forecasts...")
    forecasts = {}
    for city in LOCATIONS:
        f = get_noaa_forecast(city)
        forecasts[city] = f
        for date, data in f.items():
            print(f"  {city} {date}: {data['high']}°F — {data['forecast']}")
    print()
    
    # 2. Get all weather markets
    print("📈 Fetching weather markets...")
    markets = get_weather_markets()
    print(f"  Found {len(markets)} markets")
    print()
    
    # 3. Evaluate edges
    opportunities = []
    for market in markets:
        edge, info = evaluate_edge(market, forecasts)
        if edge is not None and info is not None:
            info["market_id"] = market.get("id")
            info["question"] = market.get("question")
            opportunities.append(info)
    
    # Sort by absolute edge
    opportunities.sort(key=lambda x: abs(x["edge"]), reverse=True)
    
    print(f"🎯 Found {len(opportunities)} evaluated markets:")
    for opp in opportunities[:15]:
        emoji = "🟢" if abs(opp["edge"]) > 0.10 else "🟡" if abs(opp["edge"]) > 0.05 else "⚪"
        print(f"  {emoji} {opp['city']} {opp['date']}: NOAA {opp['noaa_high']}°F vs {opp['direction']} {opp['threshold']}°F")
        print(f"     Our prob: {opp['our_prob']:.0%} | Market: {opp['market_price']:.1%} | Edge: {opp['edge']:+.1%}")
    print()
    
    # 4. Place trades on best opportunities
    trades_placed = 0
    print("💰 Trading opportunities:")
    for opp in opportunities:
        if trades_placed >= MAX_TRADES_PER_RUN:
            break
        
        price = opp["market_price"]
        edge = opp["edge"]
        
        # Entry: buy YES if our_prob >> market_price and price < ENTRY_THRESHOLD
        if edge > 0.10 and price < ENTRY_THRESHOLD:
            side = "yes"
            reasoning = f"NOAA forecasts {opp['city']} high of {opp['noaa_high']}°F on {opp['date']}. Market asks {opp['direction']} {opp['threshold']}°F at {price:.1%}. Our estimate: {opp['our_prob']:.0%}. Edge: {edge:+.1%}."
            print(f"  🟢 BUY YES: {opp['question']}")
            print(f"     ${MAX_POSITION} @ {price:.1%} | Edge: {edge:+.1%}")
            result = place_trade(opp["market_id"], side, MAX_POSITION, reasoning)
            if result.get("success"):
                print(f"     ✅ Bought {result.get('shares_bought', 0):.1f} shares")
                trades_placed += 1
            else:
                print(f"     ❌ {result.get('error', 'Unknown error')}")
            time.sleep(3)  # Rate limit
        
        # Entry: buy NO if our_prob << market_price and (1-price) < ENTRY_THRESHOLD
        elif edge < -0.10 and price > (1 - ENTRY_THRESHOLD):
            side = "no"
            reasoning = f"NOAA forecasts {opp['city']} high of {opp['noaa_high']}°F on {opp['date']}. Market asks {opp['direction']} {opp['threshold']}°F at {price:.1%} YES. Our estimate: {opp['our_prob']:.0%}. Selling YES / buying NO."
            print(f"  🔴 BUY NO: {opp['question']}")
            print(f"     ${MAX_POSITION} @ NO {1-price:.1%} | Edge: {abs(edge):+.1%}")
            result = place_trade(opp["market_id"], side, MAX_POSITION, reasoning)
            if result.get("success"):
                print(f"     ✅ Bought {result.get('shares_bought', 0):.1f} shares")
                trades_placed += 1
            else:
                print(f"     ❌ {result.get('error', 'Unknown error')}")
            time.sleep(3)
        
        # Also buy YES on high-confidence picks even if price > 15%
        elif edge > 0.20 and price < 0.50:
            side = "yes"
            reasoning = f"High-confidence: NOAA {opp['noaa_high']}°F vs {opp['direction']} {opp['threshold']}°F. Edge {edge:+.1%}."
            print(f"  🟢 BUY YES (high conf): {opp['question']}")
            print(f"     ${MAX_POSITION} @ {price:.1%} | Edge: {edge:+.1%}")
            result = place_trade(opp["market_id"], side, MAX_POSITION, reasoning)
            if result.get("success"):
                print(f"     ✅ Bought {result.get('shares_bought', 0):.1f} shares")
                trades_placed += 1
            else:
                print(f"     ❌ {result.get('error', 'Unknown error')}")
            time.sleep(3)
    
    print(f"\n📊 Summary: {trades_placed} trades placed")
    
    # 5. Check current positions
    try:
        r = requests.get(f"{SIMMER_BASE}/positions", headers=HEADERS, timeout=10)
        positions = r.json()
        if positions:
            print(f"\n📋 Current positions:")
            pos_list = positions if isinstance(positions, list) else positions.get("positions", [])
            for pos in pos_list:
                print(f"  • {pos.get('market_question', pos.get('market_id', '?'))}")
                print(f"    YES: {pos.get('shares_yes', 0)} | NO: {pos.get('shares_no', 0)}")
    except:
        pass
    
    # Check balance
    try:
        r = requests.get(f"{SIMMER_BASE}/agents/me", headers=HEADERS, timeout=10)
        me = r.json()
        print(f"\n💰 Balance: ${me.get('balance', 0):.2f} $SIM | P&L: ${me.get('sim_pnl', 0):.2f}")
    except:
        pass
    
    print(f"\n✅ Scan complete!")
    return trades_placed

if __name__ == "__main__":
    run_scan()
