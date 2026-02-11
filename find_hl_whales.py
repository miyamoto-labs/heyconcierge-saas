#!/usr/bin/env python3
"""
Find profitable Hyperliquid traders using the Info API
"""

from hyperliquid.info import Info
import json

def find_top_traders():
    """Query Hyperliquid for top traders"""
    print("🔍 Searching for top Hyperliquid traders...\n")
    
    info = Info(skip_ws=True)
    
    # Try to get leaderboard data
    try:
        # Get metadata
        meta = info.meta()
        print(f"✅ Connected to Hyperliquid")
        print(f"📊 Total markets: {len(meta['universe'])}\n")
        
        # Try to fetch user leaderboard (if API supports it)
        # Note: May need to explore API docs for exact method
        
        # For now, let's use known profitable wallets from research:
        known_whales = [
            {
                "wallet": "0x4e9fe710df8e4c3e3b8e0f7e43db3c6f2a123456",  # Example
                "name": "WhiteWhale",
                "notes": "$50M+ profit (Aug 2025), topped leaderboards"
            },
            # Add more as we find them
        ]
        
        print("📋 Researched Profitable Traders:")
        print("  (Need to find actual wallet addresses)\n")
        
        print("💡 Suggested approach:")
        print("  1. Check https://hyperdash.info/top-traders manually")
        print("  2. Check https://www.coinglass.com/hyperliquid for whale alerts")
        print("  3. Use Nansen API if available")
        print("  4. Monitor app.hyperliquid.xyz/leaderboard")
        print("\n  Then add real wallet addresses to hyperliquid_whale_tracker.py")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    find_top_traders()
