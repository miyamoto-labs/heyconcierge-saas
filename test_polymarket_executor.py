#!/usr/bin/env python3
"""
Test the Polymarket executor with a real market
"""

import sys
sys.path.insert(0, '/Users/erik/.openclaw/workspace')

from polymarket_clob_executor import PolymarketExecutor, PRIVATE_KEY, WALLET_ADDRESS

def main():
    print("\n" + "="*70)
    print("🧪 TESTING POLYMARKET EXECUTOR")
    print("="*70)
    
    # Initialize in paper mode
    executor = PolymarketExecutor(
        private_key=PRIVATE_KEY,
        wallet_address=WALLET_ADDRESS,
        paper_mode=True  # Always start with paper mode
    )
    
    # Test with a real market
    market_slug = "will-trump-deport-less-than-250000"
    
    print(f"\n🔍 Looking up market: {market_slug}")
    yes_token, no_token = executor.get_market_tokens(market_slug)
    
    if not yes_token or not no_token:
        print("❌ Market not found!")
        return
    
    print(f"✅ Market found!")
    print(f"   YES token: {yes_token}")
    print(f"   NO token: {no_token}")
    
    # Get orderbook
    print(f"\n📖 Fetching orderbook...")
    book = executor.get_orderbook(yes_token)
    
    if book:
        print(f"✅ Orderbook:")
        print(f"   Best Bid: {book['best_bid']:.4f}")
        print(f"   Best Ask: {book['best_ask']:.4f}")
        print(f"   Spread: {book['spread']:.4f}")
        print(f"   Bid Size: {book['bid_size']:.2f}")
        print(f"   Ask Size: {book['ask_size']:.2f}")
    
    # Test order placement (paper mode)
    print(f"\n⚡ Testing order placement ($1 YES)...")
    result = executor.place_order(
        market_slug=market_slug,
        direction="UP",  # Betting YES (< 250k deportations)
        size_usd=1.0,
        order_type="MARKET"
    )
    
    print(f"\n📊 RESULT:")
    print(f"   Success: {result.success}")
    if result.success:
        print(f"   ✅ Order ID: {result.order_id}")
        print(f"   Price: {result.price:.4f}")
        print(f"   Shares: {result.size:.2f}")
        print(f"   Cost: ${result.size * result.price:.2f}")
    else:
        print(f"   ❌ Error: {result.error}")
    
    print("\n" + "="*70)
    print("✅ TEST COMPLETE!")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
