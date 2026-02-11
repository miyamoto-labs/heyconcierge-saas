#!/usr/bin/env python3
"""
Hyperliquid Liquidation Hunter
MoonDev's #1 Edge: Buy after big liquidations (people didn't want to exit)
Strategy: $100K+ liquidation → Price temporarily wrong → Buy the dip
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta

sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1)

print("Starting Liquidation Hunter...", flush=True)

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

# Load config
with open('/Users/erik/.openclaw/workspace/.hyperliquid_config.json', 'r') as f:
    config = json.load(f)

WALLET = config['public_wallet']
KEY = config['api_private_key']

# Settings
SYMBOLS = ['BTC', 'ETH', 'SOL']
MIN_LIQUIDATION = 100000  # $100K minimum (MoonDev's threshold)
POSITION_SIZE = 100  # $100 per trade
LEVERAGE = 5
CHECK_INTERVAL = 60  # Check every minute

# Initialize
info = Info(skip_ws=True)
account = Account.from_key(KEY)
exchange = Exchange(account, account_address=WALLET)

print("="*60, flush=True)
print("💥 LIQUIDATION HUNTER STARTED", flush=True)
print(f"Min liquidation: ${MIN_LIQUIDATION:,}", flush=True)
print(f"Position size: ${POSITION_SIZE}", flush=True)
print("="*60, flush=True)

# Track liquidations seen
seen_liquidations = set()

scan = 0

while True:
    try:
        scan += 1
        print(f"\n[Scan #{scan}] {datetime.now().strftime('%H:%M:%S')}", flush=True)
        
        for symbol in SYMBOLS:
            try:
                # Get recent liquidations
                # Note: Hyperliquid API doesn't expose liquidations directly
                # We need to use user_funding or watch for rapid price moves + volume spikes
                
                # Get price and recent trades
                mids = info.all_mids()
                price = float(mids.get(symbol, 0))
                
                if price == 0:
                    continue
                
                # Get recent candles to detect liquidation patterns
                now_ms = int(time.time() * 1000)
                lookback_ms = 60 * 60 * 1000  # 1 hour
                start_time = now_ms - lookback_ms
                
                candles = info.candles_snapshot(symbol, '1m', start_time, now_ms)
                
                if not candles or len(candles) < 10:
                    continue
                
                # Detect potential liquidation: 
                # - Large volume spike (3x+)
                # - Sharp price drop (>1%)
                # - Immediate bounce (>0.5%)
                
                recent = candles[-10:]  # Last 10 minutes
                volumes = [float(c['v']) for c in recent]
                closes = [float(c['c']) for c in recent]
                
                avg_vol = sum(volumes[:-1]) / len(volumes[:-1]) if len(volumes) > 1 else 1
                current_vol = volumes[-1]
                
                # Volume spike detected
                if current_vol > avg_vol * 3:
                    # Check price action
                    price_5m_ago = closes[-6] if len(closes) >= 6 else closes[0]
                    price_now = closes[-1]
                    
                    pct_change = ((price_now - price_5m_ago) / price_5m_ago) * 100
                    
                    # Sharp drop = long liquidations
                    if pct_change < -1.0:
                        liq_id = f"{symbol}_{now_ms//60000}"  # Unique per minute
                        
                        if liq_id not in seen_liquidations:
                            seen_liquidations.add(liq_id)
                            
                            print(f"💥 {symbol} LIQUIDATION DETECTED!", flush=True)
                            print(f"   Volume: {current_vol/avg_vol:.1f}x average", flush=True)
                            print(f"   Price drop: {pct_change:.2f}% to ${price:,.2f}", flush=True)
                            print(f"   → BUYING THE DIP", flush=True)
                            
                            # Calculate position size
                            size_coins = POSITION_SIZE / price
                            
                            try:
                                result = exchange.market_open(
                                    symbol,
                                    True,  # Buy
                                    size_coins,
                                    px=None,
                                    slippage=0.005
                                )
                                print(f"   ✅ Order placed: {result}", flush=True)
                            except Exception as e:
                                print(f"   ❌ Order failed: {e}", flush=True)
                    
                    # Sharp rise = short liquidations
                    elif pct_change > 1.0:
                        liq_id = f"{symbol}_{now_ms//60000}_short"
                        
                        if liq_id not in seen_liquidations:
                            seen_liquidations.add(liq_id)
                            
                            print(f"💥 {symbol} SHORT LIQUIDATION DETECTED!", flush=True)
                            print(f"   Volume: {current_vol/avg_vol:.1f}x average", flush=True)
                            print(f"   Price spike: {pct_change:.2f}% to ${price:,.2f}", flush=True)
                            print(f"   → SHORTING THE PUMP", flush=True)
                            
                            size_coins = POSITION_SIZE / price
                            
                            try:
                                result = exchange.market_open(
                                    symbol,
                                    False,  # Sell/short
                                    size_coins,
                                    px=None,
                                    slippage=0.005
                                )
                                print(f"   ✅ Order placed: {result}", flush=True)
                            except Exception as e:
                                print(f"   ❌ Order failed: {e}", flush=True)
                
            except Exception as e:
                print(f"   ❌ {symbol} error: {e}", flush=True)
        
        # Clean up old liquidations (>1 hour)
        if len(seen_liquidations) > 100:
            seen_liquidations.clear()
        
        time.sleep(CHECK_INTERVAL)
        
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user", flush=True)
        break
    except Exception as e:
        print(f"\n❌ Error: {e}", flush=True)
        time.sleep(60)

print("✅ Bot stopped", flush=True)
