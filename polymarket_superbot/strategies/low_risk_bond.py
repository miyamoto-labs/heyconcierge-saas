"""
Low-Risk Bond Strategy - Exploit near-certain outcomes
"""

from typing import List
from datetime import datetime

from .base_strategy import BaseStrategy, Opportunity
from core.market_scanner import MarketScanner
from config import BOND_CONFIG, get_strategy_allocation


class LowRiskBondStrategy(BaseStrategy):
    """
    Hunt for near-certain outcomes (95%+ probability) priced under fair value
    
    Strategy:
    1. Find markets with >95% probability
    2. Check if priced below $0.96 (underpriced)
    3. Verify resolves within 72 hours (quick return)
    4. Ensure sufficient liquidity (can exit if needed)
    5. Diversify across 5+ bonds
    
    Example: "Will sun rise tomorrow?" at 97¢ → 3% return in 24h
    """
    
    def __init__(self):
        super().__init__(
            name="low_risk_bond",
            weight=0.20
        )
        
        self.scanner = MarketScanner()
        self.config = BOND_CONFIG
    
    def scan(self) -> List[Opportunity]:
        """Scan for bond opportunities"""
        
        print(f"\n{'='*70}")
        print(f"💰 {self.name.upper()} - Scanning for bond opportunities...")
        print(f"{'='*70}")
        
        self.last_scan_time = datetime.now()
        
        # Get all active markets
        markets = self.scanner.get_all_markets(limit=100)
        
        if not markets:
            print("❌ No markets found")
            return []
        
        # Filter for high confidence markets
        high_prob_markets = self.scanner.filter_high_confidence(
            markets, 
            min_prob=self.config["min_probability"]
        )
        
        print(f"📊 Found {len(high_prob_markets)} high-probability markets (>95%)")
        
        # Further filter
        opportunities = []
        capital_per_strategy = get_strategy_allocation(self.name)
        
        for market in high_prob_markets:
            try:
                # Determine which side is >95%
                if market.yes_price >= self.config["min_probability"]:
                    direction = "UP"
                    prob = market.yes_price
                    price = market.yes_price
                else:
                    direction = "DOWN"
                    prob = market.no_price
                    price = market.no_price
                
                # Check if underpriced
                if price > self.config["max_price"]:
                    continue
                
                # Check time to resolution
                if market.hours_to_resolution > self.config["max_time_to_resolution_hours"]:
                    continue
                
                # Check liquidity
                if market.liquidity < self.config["min_liquidity_usd"]:
                    print(f"   ⚠️ Skipping (low liquidity): {market.question[:50]}...")
                    continue
                
                # Calculate expected return
                expected_return_pct = ((1.0 - price) / price) * 100
                
                # Position size: 20% max per bond
                size_usd = capital_per_strategy * (self.config["max_position_pct"] / 100)
                
                # Create opportunity
                opp = Opportunity(
                    market_slug=market.slug,
                    question=market.question,
                    direction=direction,
                    size_usd=size_usd,
                    expected_return_pct=expected_return_pct,
                    confidence=0.95,  # High confidence (near-certain)
                    reasoning=f"Bond: {prob:.1%} probability at {price:.2f} price. Resolves in {market.hours_to_resolution:.1f}h. Expected return: {expected_return_pct:.1f}%",
                    strategy_name=self.name,
                    timestamp=datetime.now()
                )
                
                opportunities.append(opp)
                
                print(f"\n✅ Bond opportunity:")
                print(f"   Market: {market.question[:60]}...")
                print(f"   Probability: {prob:.1%}")
                print(f"   Price: ${price:.3f}")
                print(f"   Return: {expected_return_pct:.1f}%")
                print(f"   Resolves: {market.hours_to_resolution:.1f}h")
                print(f"   Size: ${size_usd:.2f}")
            
            except Exception as e:
                print(f"⚠️ Error analyzing market: {e}")
                continue
        
        print(f"\n💰 Found {len(opportunities)} bond opportunities")
        print(f"{'='*70}\n")
        
        # Sort by expected return
        opportunities.sort(key=lambda o: o.expected_return_pct, reverse=True)
        
        # Limit to top 5 (diversification)
        return opportunities[:5]


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    strategy = LowRiskBondStrategy()
    
    print("\n" + "="*70)
    print("🧪 Testing Low-Risk Bond Strategy")
    print("="*70)
    
    print(f"\n📋 Strategy Parameters:")
    print(f"   Min Probability: {strategy.config['min_probability']:.0%}")
    print(f"   Max Price: ${strategy.config['max_price']:.2f}")
    print(f"   Max Time: {strategy.config['max_time_to_resolution_hours']}h")
    print(f"   Target Return: {strategy.config['target_return_pct']:.1f}%")
    
    opportunities = strategy.scan()
    
    if opportunities:
        print(f"\n✅ Found {len(opportunities)} bond opportunities")
        
        total_expected_return = sum(o.expected_return_pct * o.confidence for o in opportunities)
        
        print(f"\n💼 Portfolio:")
        for i, opp in enumerate(opportunities, 1):
            print(f"\n{i}. {opp.market_slug}")
            print(f"   Size: ${opp.size_usd:.2f}")
            print(f"   Return: {opp.expected_return_pct:.1f}%")
            print(f"   EV: ${opp.expected_value:.2f}")
        
        print(f"\n📊 Total Expected Return: {total_expected_return:.1f}%")
    else:
        print("\n❌ No bond opportunities found (all markets correctly priced)")
    
    print("\n" + "="*70)
