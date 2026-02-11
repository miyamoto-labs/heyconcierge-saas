#!/usr/bin/env python3
"""
Polymarket Bot Status - Quick check for balance, trades, and positions
Run: python3 polymarket_status.py
"""

import json
import sys
from datetime import datetime

try:
    from py_clob_client.client import ClobClient
    from py_clob_client.clob_types import BalanceAllowanceParams, AssetType
except ImportError:
    print("❌ Missing py-clob-client. Run: pip install py-clob-client")
    sys.exit(1)

WALLET_FILE = "/Users/erik/.openclaw/workspace/.polymarket_wallet.json"

def main():
    # Load wallet
    try:
        with open(WALLET_FILE) as f:
            wallet = json.load(f)
    except FileNotFoundError:
        print(f"❌ Wallet not found: {WALLET_FILE}")
        return

    print("=" * 60)
    print("🎰 POLYMARKET BOT STATUS")
    print("=" * 60)
    print(f"📍 Wallet: {wallet['address']}")
    print(f"🔗 Polygonscan: https://polygonscan.com/address/{wallet['address']}")
    print()

    # Connect to CLOB
    try:
        client = ClobClient(
            host='https://clob.polymarket.com',
            chain_id=137,
            key=wallet['private_key'],
            signature_type=0
        )
        creds = client.derive_api_key()
        client.set_api_creds(creds)
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return

    # Get balance
    try:
        params = BalanceAllowanceParams(asset_type=AssetType.COLLATERAL, signature_type=0)
        balance = client.get_balance_allowance(params)
        usdc = int(balance['balance']) / 1e6
        print(f"💰 USDC Balance: ${usdc:.2f}")
    except Exception as e:
        print(f"❌ Balance error: {e}")

    # Get recent trades
    print()
    print("-" * 60)
    print("📊 RECENT TRADES (last 10)")
    print("-" * 60)
    
    try:
        trades = client.get_trades()
        
        if not trades:
            print("   No trades yet")
        else:
            total_pnl = 0
            for t in trades[:10]:
                outcome = t.get('outcome', '?')
                price = float(t.get('price', 0))
                size = float(t.get('size', 0))
                status = t.get('status', '?')
                side = t.get('side', '?')
                tx = t.get('transaction_hash', '?')[:20]
                
                cost = price * size
                emoji = "🟢" if status == "CONFIRMED" else "🟡" if status == "MINED" else "🔴"
                
                print(f"   {emoji} {side} {size:.2f} {outcome} @ ${price:.3f} = ${cost:.2f} [{status}]")
            
            print(f"\n   Total trades: {len(trades)}")
    except Exception as e:
        print(f"   ❌ Error fetching trades: {e}")

    # Check if bot is running
    print()
    print("-" * 60)
    print("🤖 BOT STATUS")
    print("-" * 60)
    
    import subprocess
    result = subprocess.run(['pgrep', '-f', 'polymarket_trader'], capture_output=True, text=True)
    if result.returncode == 0:
        pid = result.stdout.strip().split('\n')[0]
        print(f"   ✅ Bot RUNNING (PID: {pid})")
    else:
        print("   ❌ Bot NOT RUNNING")

    print()
    print(f"⏰ Checked at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
