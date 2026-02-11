#!/usr/bin/env python3
"""Debug Hyperliquid funding rate API"""

from hyperliquid.info import Info
import json

info = Info(skip_ws=True)

print("Fetching Hyperliquid metadata...\n")
meta = info.meta()

print("Available keys:", meta.keys())
print("\nFirst universe entry sample:")
if 'universe' in meta and len(meta['universe']) > 0:
    print(json.dumps(meta['universe'][0], indent=2))

print("\n\nSearching for BTC:")
for asset in meta.get('universe', []):
    if asset.get('name') == 'BTC':
        print(json.dumps(asset, indent=2))
        break
