#!/usr/bin/env python3
"""
Quick test of funding rate monitor
"""

from funding_rate_monitor import FundingRateMonitor

def test_funding():
    print("🧪 Testing Funding Rate Monitor...\n")
    
    monitor = FundingRateMonitor()
    
    # Test fetching rates
    symbols = ["BTC", "ETH", "SOL"]
    
    print("📊 Current Funding Rates:")
    for symbol in symbols:
        rate = monitor.get_funding_rate(symbol)
        if rate:
            annualized = rate * 3 * 365 * 100
            print(f"  {symbol}: {rate*100:.4f}% per 8h ({annualized:+.1f}% APR)")
        else:
            print(f"  {symbol}: Unable to fetch")
    
    # Test signal generation
    print("\n🎯 Signal Enhancement Tests:")
    
    test_cases = [
        ("BTC", "LONG"),
        ("BTC", "SHORT"),
        ("ETH", "LONG"),
        ("ETH", "SHORT"),
    ]
    
    for symbol, side in test_cases:
        signal = monitor.get_funding_signal(symbol, side)
        print(f"\n  {symbol} {side}:")
        print(f"    Adjust: {signal['adjust']}")
        print(f"    Reason: {signal['reason']}")
    
    # Test arbitrage opportunities
    print("\n💰 Funding Arbitrage Opportunities:")
    opportunities = monitor.get_arbitrage_opportunities(["BTC", "ETH", "SOL", "HYPE"])
    
    if opportunities:
        for opp in opportunities[:3]:
            print(f"  {opp['symbol']}: {opp['recommended_side']} - "
                  f"{opp['expected_8h_profit_pct']:.4f}% per 8h")
    else:
        print("  No extreme funding opportunities at the moment")
    
    # Full report
    monitor.print_funding_report(["BTC", "ETH", "SOL"])
    
    print("\n✅ Test complete!")

if __name__ == "__main__":
    test_funding()
