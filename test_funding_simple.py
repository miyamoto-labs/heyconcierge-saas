#!/usr/bin/env python3
"""Simple funding rate test"""

from funding_rate_monitor import FundingRateMonitor

monitor = FundingRateMonitor()

print("Fetching BTC funding rate...")
rate = monitor.get_funding_rate("BTC")

if rate:
    annualized = rate * 3 * 365 * 100
    print(f"✅ BTC Funding: {rate*100:.4f}% per 8h ({annualized:+.1f}% APR)")
    
    # Test signal
    signal = monitor.get_funding_signal("BTC", "LONG")
    print(f"\n Signal for BTC LONG:")
    print(f"   Adjust: {signal['adjust']}")
    print(f"   Reason: {signal['reason']}")
else:
    print("❌ Failed to fetch funding rate")
