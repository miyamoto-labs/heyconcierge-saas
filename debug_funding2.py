#!/usr/bin/env python3
"""Debug Hyperliquid funding rate API - method 2"""

from hyperliquid.info import Info
import json

info = Info(skip_ws=True)

print("Testing different methods to get funding rates...\n")

# Try funding_history
print("1. Testing funding_history for BTC:")
try:
    funding = info.funding_history("BTC", startTime=None, endTime=None)
    if funding:
        print(f"   Latest funding: {json.dumps(funding[-1], indent=2)}")
except Exception as e:
    print(f"   Error: {e}")

# Try meta_and_asset_ctxs
print("\n2. Testing meta_and_asset_ctxs:")
try:
    ctx = info.meta_and_asset_ctxs()
    print(f"   Keys: {ctx.keys() if isinstance(ctx, dict) else type(ctx)}")
    if isinstance(ctx, list) and len(ctx) > 0:
        print(f"   First item: {json.dumps(ctx[0], indent=2)}")
except Exception as e:
    print(f"   Error: {e}")

# Check all available methods
print("\n3. Available methods on Info:")
methods = [m for m in dir(info) if not m.startswith('_') and callable(getattr(info, m))]
for m in methods:
    if 'fund' in m.lower() or 'rate' in m.lower():
        print(f"   - {m}")
