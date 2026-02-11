#!/usr/bin/env python3
"""Test if HL Trader V3 can fetch data and generate signals"""

import os
import json
from hyperliquid.info import Info

# Load config
with open('/Users/erik/.openclaw/workspace/.hyperliquid_config.json', 'r') as f:
    config = json.load(f)

info = Info()

print("Testing data fetch...")

# Test 1: Get current price
try:
    mids = info.all_mids()
    btc_price = float(mids.get('BTC', 0))
    print(f"✅ BTC Price: ${btc_price:,.2f}")
except Exception as e:
    print(f"❌ Price fetch failed: {e}")

# Test 2: Get funding rate
try:
    meta = info.meta()
    contexts = info.meta_and_asset_ctxs()
    
    if contexts and len(contexts) > 1:
        asset_ctxs = contexts[1]
        for i, item in enumerate(meta.get("universe", [])):
            if item.get("name") == "BTC" and i < len(asset_ctxs):
                funding = float(asset_ctxs[i].get("funding", 0))
                annualized = funding * 365 * 24 * 100
                print(f"✅ BTC Funding: {annualized:.1f}% annualized")
                break
except Exception as e:
    print(f"❌ Funding fetch failed: {e}")

# Test 3: Get candles
try:
    import time
    now_ms = int(time.time() * 1000)
    lookback_ms = 200 * 5 * 60 * 1000  # 200 5-min bars
    start_time = now_ms - lookback_ms
    
    candles = info.candles_snapshot('BTC', '5m', start_time, now_ms)
    print(f"✅ Fetched {len(candles)} candles")
    
    if candles:
        last = candles[-1]
        print(f"   Last candle: O={last['o']} H={last['h']} L={last['l']} C={last['c']} V={last['v']}")
except Exception as e:
    print(f"❌ Candle fetch failed: {e}")

print("\n" + "="*50)
print("If all 3 tests passed, bot should work.")
print("If any failed, that's the issue.")
