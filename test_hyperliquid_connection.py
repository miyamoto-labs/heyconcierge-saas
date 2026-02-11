#!/usr/bin/env python3
"""
Test Hyperliquid connection and set leverage
"""

import json
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

def test_connection():
    print("🔌 Testing Hyperliquid connection...")
    
    # Load config
    with open('.hyperliquid_config.json', 'r') as f:
        config = json.load(f)
    
    api_key = config['api_private_key']
    main_wallet = config['public_wallet']
    
    print(f"Main wallet: {main_wallet}")
    print(f"API wallet: {config['api_wallet']}")
    
    # Initialize clients
    info = Info(skip_ws=True)
    account = Account.from_key(api_key)
    exchange = Exchange(account)
    
    # Test 1: Get account state
    print("\n📊 Account State:")
    state = info.user_state(main_wallet)
    
    if 'assetPositions' in state:
        print(f"  Assets: {len(state['assetPositions'])} positions")
        for asset in state['assetPositions']:
            print(f"    {asset['position']['coin']}: {asset['position']['szi']} (Leverage: {asset['position']['leverage']['value']})")
    
    # Test 2: Get BTC market info
    print("\n💰 BTC Market:")
    meta = info.meta()
    btc_info = next((m for m in meta['universe'] if m['name'] == 'BTC'), None)
    if btc_info:
        print(f"  Symbol: {btc_info['name']}")
        print(f"  Current leverage: Checking...")
    
    # Test 3: Set BTC leverage to 10x
    print("\n⚙️  Setting BTC leverage to 10x...")
    try:
        result = exchange.update_leverage(10, 'BTC', is_cross=True)
        print(f"  Result: {result}")
        print("  ✅ Leverage set to 10x (cross margin)")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    # Verify leverage was set
    print("\n🔍 Verifying leverage...")
    state = info.user_state(main_wallet)
    btc_position = next((p for p in state.get('assetPositions', []) if p['position']['coin'] == 'BTC'), None)
    if btc_position:
        current_leverage = btc_position['position']['leverage']['value']
        print(f"  Current BTC leverage: {current_leverage}")
    else:
        print("  No BTC position yet (leverage will apply on first trade)")
    
    print("\n✅ Connection test complete!")

if __name__ == '__main__':
    test_connection()
