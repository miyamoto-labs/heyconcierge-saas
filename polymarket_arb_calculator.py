#!/usr/bin/env python3
"""Calculate capital needs for $200/day from true arbitrage"""

# TRUE ARBITRAGE ECONOMICS
# Buy YES + NO when total < $1.00
# Example: YES $0.48 + NO $0.51 = $0.99 → $0.01 profit (1%)

DAILY_TARGET = 200  # $200/day target

# Conservative estimates
MIN_PROFIT_PCT = 0.5   # 0.5% minimum edge we'd accept
AVG_PROFIT_PCT = 1.0   # 1% average expected

# Opportunity frequency (needs real data)
OPPORTUNITIES_PER_HOUR_LOW = 2    # Conservative
OPPORTUNITIES_PER_HOUR_HIGH = 10  # Optimistic
HOURS_PER_DAY = 24

print("="*60)
print("💰 CAPITAL REQUIREMENTS FOR $200/DAY TRUE ARBITRAGE")
print("="*60)

for opp_per_hour in [2, 5, 10, 20]:
    opps_per_day = opp_per_hour * HOURS_PER_DAY
    
    for profit_pct in [0.5, 1.0, 1.5]:
        # profit_per_trade = capital * profit_pct / 100
        # daily_profit = profit_per_trade * opps_per_day
        # DAILY_TARGET = capital * (profit_pct/100) * opps_per_day
        # capital = DAILY_TARGET / ((profit_pct/100) * opps_per_day)
        
        capital_needed = DAILY_TARGET / ((profit_pct/100) * opps_per_day)
        per_trade = capital_needed  # Full capital per trade if sequential
        hourly_profit = DAILY_TARGET / 24
        
        print(f"\n📊 {opp_per_hour} opps/hour × {profit_pct}% edge:")
        print(f"   Opps/day: {opps_per_day}")
        print(f"   Capital needed: ${capital_needed:,.0f}")
        print(f"   Per-trade size: ${capital_needed:,.0f}")
        print(f"   Hourly profit: ${hourly_profit:.2f}")

print("\n" + "="*60)
print("🎯 REALISTIC SCENARIO")
print("="*60)

# Most likely: 5 opps/hour, 1% edge
realistic_opps = 5 * 24  # 120/day
realistic_edge = 0.01  # 1%
capital = DAILY_TARGET / (realistic_edge * realistic_opps)

print(f"""
Assumptions:
- 5 arbitrage opportunities per hour
- 1% average profit per opportunity
- 24/7 operation

Results:
- Opportunities per day: {realistic_opps}
- Capital required: ${capital:,.0f}
- Profit per trade: ${capital * realistic_edge:.2f}
- Hourly profit: ${DAILY_TARGET/24:.2f}

To GUARANTEE $200/day with 1% edge:
- Need {int(DAILY_TARGET / (capital * realistic_edge))} successful trades
- At 5/hour = {realistic_opps/24:.0f} hours of operation
- Capital: ${capital:,.0f} deployed per opportunity
""")

print("="*60)
print("⚠️  CRITICAL REALITY CHECK")
print("="*60)
print("""
TRUE arbitrage (YES + NO < $1.00) is RARE on Polymarket.
Market makers are smart. Mispricings get closed fast.

To find opportunities:
1. Scan ALL markets constantly (not just BTC/ETH 15-min)
2. Need speed - opportunities last seconds
3. Need capital ready to deploy instantly
4. May need to scan 100s of markets per minute

Next step: Run paper bot to measure ACTUAL opportunity frequency.
""")
