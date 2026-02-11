#!/usr/bin/env python3
"""Find funding rate in asset contexts"""

from hyperliquid.info import Info
import json

info = Info(skip_ws=True)

print("Fetching meta_and_asset_ctxs...\n")
data = info.meta_and_asset_ctxs()

print(f"Type: {type(data)}")
print(f"Length: {len(data)}")

if isinstance(data, list) and len(data) >= 2:
    meta = data[0]
    ctx = data[1]
    
    print(f"\nMeta keys: {meta.keys()}")
    print(f"Contexts type: {type(ctx)}")
    print(f"Contexts length: {len(ctx) if isinstance(ctx, list) else 'N/A'}")
    
    if isinstance(ctx, list):
        # Find BTC in contexts
        for item in ctx:
            if isinstance(item, dict) and item.get('coin') == 'BTC':
                print(f"\nBTC context:")
                print(json.dumps(item, indent=2))
                break
        
        # Show first 3 contexts to see structure
        print(f"\n\nFirst 3 contexts:")
        for i, item in enumerate(ctx[:3]):
            print(f"\n[{i}] Keys: {item.keys() if isinstance(item, dict) else type(item)}")
            if 'funding' in str(item).lower():
                print(f"    HAS FUNDING: {item}")
