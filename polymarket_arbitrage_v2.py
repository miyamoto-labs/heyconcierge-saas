#!/usr/bin/env python3
"""
Polymarket Chainlink Arbitrage Bot V2
REAL EDGE: Chainlink oracle lags Binance by 5-30 seconds
Strategy: Watch Binance → Bet on Polymarket before odds update
"""

import os
import sys
import json
import time
import requests
from datetime import datetime

# Force unbuffered output
sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1)

print("Starting Polymarket Arbitrage Bot V2...", flush=True)

# Config
BINANCE_API = "https://api.binance.com/api/v3/ticker/price"
POLYMARKET_API = "https://clob.polymarket.com"
TRADER_URL = "http://localhost:3001"  # Mac mini trader
API_SECRET = os.getenv('API_SECRET', 'pm-trader-erik-2026')

SYMBOLS = {
    'BTCUSDT': 'BTC',
    'ETHUSDT': 'ETH'
}

# Thresholds
MIN_PRICE_MOVE = 0.003  # 0.3% minimum move to trigger
BET_AMOUNT = 10  # $10 per bet
CHECK_INTERVAL = 2  # Check every 2 seconds

print("Config loaded", flush=True)

def get_binance_price(symbol):
    """Get current Binance price"""
    try:
        r = requests.get(f"{BINANCE_API}?symbol={symbol}", timeout=3)
        return float(r.json()['price'])
    except:
        return None

def find_polymarket_markets():
    """Find active 15-min BTC/ETH markets"""
    try:
        r = requests.get(f"{POLYMARKET_API}/markets", timeout=5)
        markets = r.json()
        
        active = []
        for m in markets:
            if '15' in m.get('question', '').lower() and ('BTC' in m['question'] or 'ETH' in m['question']):
                active.append({
                    'id': m['condition_id'],
                    'question': m['question'],
                    'yes_price': float(m.get('yes_price', 0)),
                    'no_price': float(m.get('no_price', 0))
                })
        return active
    except:
        return []

def place_bet(market_id, direction, amount):
    """Place bet via trader"""
    try:
        r = requests.post(
            f"{TRADER_URL}/bet",
            json={
                'market_id': market_id,
                'direction': direction,
                'amount': amount,
                'secret': API_SECRET
            },
            timeout=10
        )
        return r.json()
    except Exception as e:
        return {'error': str(e)}

# Track last prices
last_prices = {}

print("="*60, flush=True)
print("🎯 POLYMARKET ARBITRAGE BOT V2", flush=True)
print("Strategy: Front-run Chainlink oracle lag", flush=True)
print(f"Min move: {MIN_PRICE_MOVE*100}%", flush=True)
print("="*60, flush=True)

scan = 0

while True:
    try:
        scan += 1
        if scan % 30 == 1:  # Log every minute
            print(f"\n[Scan #{scan}] {datetime.now().strftime('%H:%M:%S')}", flush=True)
        
        # Check Binance prices
        for binance_symbol, crypto in SYMBOLS.items():
            price = get_binance_price(binance_symbol)
            if not price:
                continue
            
            # Calculate price change
            if binance_symbol in last_prices:
                pct_change = (price - last_prices[binance_symbol]) / last_prices[binance_symbol]
                
                # Significant move detected
                if abs(pct_change) >= MIN_PRICE_MOVE:
                    print(f"\n🔥 {crypto} moved {pct_change*100:+.2f}% (${last_prices[binance_symbol]:,.0f} → ${price:,.0f})", flush=True)
                    
                    # Find relevant Polymarket markets
                    markets = find_polymarket_markets()
                    pm_markets = [m for m in markets if crypto in m['question']]
                    
                    if pm_markets:
                        for m in pm_markets:
                            print(f"   Market: {m['question'][:50]}...", flush=True)
                            print(f"   Current odds: YES={m['yes_price']:.3f} NO={m['no_price']:.3f}", flush=True)
                            
                            # Bet based on direction
                            if pct_change > MIN_PRICE_MOVE:
                                # Price going UP → bet YES (above threshold)
                                print(f"   → Betting YES (price rising)", flush=True)
                                result = place_bet(m['id'], 'yes', BET_AMOUNT)
                                print(f"   Result: {result}", flush=True)
                            elif pct_change < -MIN_PRICE_MOVE:
                                # Price going DOWN → bet NO (below threshold)
                                print(f"   → Betting NO (price falling)", flush=True)
                                result = place_bet(m['id'], 'no', BET_AMOUNT)
                                print(f"   Result: {result}", flush=True)
            
            # Update last price
            last_prices[binance_symbol] = price
        
        time.sleep(CHECK_INTERVAL)
        
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user", flush=True)
        break
    except Exception as e:
        print(f"\n❌ Error: {e}", flush=True)
        time.sleep(10)

print("✅ Bot stopped", flush=True)
