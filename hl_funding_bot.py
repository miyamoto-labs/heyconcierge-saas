#!/usr/bin/env python3
"""
SIMPLEST Hyperliquid Bot - Funding Rate Extremes Only
MoonDev's #1 strategy: Fade >1000% annualized funding
"""

import os
import sys
import json
import time
from datetime import datetime

# Force unbuffered output
sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1)
sys.stderr = os.fdopen(sys.stderr.fileno(), 'w', buffering=1)

print("Starting bot...", flush=True)

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

print("Imports done", flush=True)

# Load config
with open('/Users/erik/.openclaw/workspace/.hyperliquid_config.json', 'r') as f:
    config = json.load(f)

WALLET = config['public_wallet']
KEY = config['api_private_key']

print(f"Config loaded: {WALLET[:10]}...", flush=True)

# Settings
SYMBOLS = ['BTC', 'ETH', 'SOL']
POSITION_SIZE = 100  # $100 per trade
LEVERAGE = 5
FUNDING_THRESHOLD = 1000  # 1000% annualized
CHECK_INTERVAL = 900  # 15 minutes (like MoonDev)

# Initialize
print("Creating Info object...", flush=True)
info = Info(skip_ws=True)  # Skip websocket to avoid hangs
print("Creating account...", flush=True)
account = Account.from_key(KEY)
print("Creating exchange...", flush=True)
exchange = Exchange(account, account_address=WALLET)

print("="*60, flush=True)
print("🚀 FUNDING RATE BOT STARTED", flush=True)
print(f"Threshold: ±{FUNDING_THRESHOLD}% annualized", flush=True)
print(f"Check interval: {CHECK_INTERVAL//60} minutes", flush=True)
print("="*60, flush=True)

scan = 0

while True:
    try:
        scan += 1
        print(f"\n[Scan #{scan}] {datetime.now().strftime('%H:%M:%S')}")
        
        # Check each symbol
        for symbol in SYMBOLS:
            # Get funding rate
            meta = info.meta()
            contexts = info.meta_and_asset_ctxs()
            
            funding_rate = 0
            if contexts and len(contexts) > 1:
                asset_ctxs = contexts[1]
                for i, item in enumerate(meta.get("universe", [])):
                    if item.get("name") == symbol and i < len(asset_ctxs):
                        funding_rate = float(asset_ctxs[i].get("funding", 0))
                        break
            
            # Convert to annualized %
            annualized = funding_rate * 365 * 24 * 100
            
            print(f"{symbol}: {annualized:+.1f}% funding", end="")
            
            # Check if extreme
            if abs(annualized) > FUNDING_THRESHOLD:
                # Get current price
                mids = info.all_mids()
                price = float(mids.get(symbol, 0))
                
                if price == 0:
                    print(" (no price)")
                    continue
                
                # Determine side (fade the crowd)
                if annualized > FUNDING_THRESHOLD:
                    # Everyone long → SHORT
                    side = "SHORT"
                    is_buy = False
                    print(f" → 🔥 EXTREME! Shorting at ${price:,.2f}")
                else:
                    # Everyone short → LONG
                    side = "LONG"
                    is_buy = True
                    print(f" → 🔥 EXTREME! Buying at ${price:,.2f}")
                
                # Calculate size
                size_coins = POSITION_SIZE / price
                
                # Place order
                try:
                    result = exchange.market_open(
                        symbol,
                        is_buy,
                        size_coins,
                        px=None,
                        slippage=0.005
                    )
                    print(f"   ✅ Order placed: {result}")
                    time.sleep(60)  # Wait 1 min before next check
                except Exception as e:
                    print(f"   ❌ Order failed: {e}")
            else:
                print(" (normal)")
        
        # Sleep
        print(f"\n💤 Sleeping {CHECK_INTERVAL}s...")
        time.sleep(CHECK_INTERVAL)
        
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user")
        break
    except Exception as e:
        print(f"\n❌ Error: {e}")
        time.sleep(60)

print("✅ Bot stopped")
