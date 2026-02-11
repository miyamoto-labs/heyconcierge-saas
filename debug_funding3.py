#!/usr/bin/env python3
"""Debug Hyperliquid funding rate API - try user_funding_history"""

from hyperliquid.info import Info
import json

info = Info(skip_ws=True)

print("Testing user_funding_history (requires wallet address)...")
print("This won't work without a wallet, but let's try all_mids instead\n")

# Try all_mids for current prices and funding
try:
    print("Trying all_mids:")
    mids = info.all_mids()
    print(f"Type: {type(mids)}")
    print(f"Sample: {json.dumps(dict(list(mids.items())[:5]), indent=2) if isinstance(mids, dict) else mids[:5]}")
except Exception as e:
    print(f"Error: {e}")

# Try spot context
try:
    print("\n\nTrying spot meta:")
    spot = info.spot_meta()
    print(f"Keys: {spot.keys() if isinstance(spot, dict) else type(spot)}")
except Exception as e:
    print(f"Error: {e}")

# Try spot meta and asset ctxs
try:
    print("\n\nTrying spot_meta_and_asset_ctxs:")
    spot = info.spot_meta_and_asset_ctxs()
    print(f"Type: {type(spot)}")
    if isinstance(spot, list) and len(spot) > 1:
        print(f"First element keys: {spot[0].keys() if isinstance(spot[0], dict) else type(spot[0])}")
        print(f"Second element sample: {json.dumps(spot[1][:2] if isinstance(spot[1], list) else str(spot[1])[:200], indent=2)}")
except Exception as e:
    print(f"Error: {e}")
