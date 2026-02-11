"""
Whale Copy Strategy - Mirror profitable traders
"""

import requests
from typing import List
from datetime import datetime

from .base_strategy import BaseStrategy, Opportunity
from config import WHALE_WALLETS, WHALE_COPY_CONFIG, get_strategy_allocation, GAMMA_API


class WhaleCopyStrategy(BaseStrategy):
    """
    Copy trades from profitable whale wallets
    
    Strategy:
    1. Monitor whale wallets for new positions
    2. Only copy high-conviction bets (>$5K)
    3. Wait 30-60 seconds to avoid front-running
    4. Size at 10-20% of whale's position
    """
    
    def __init__(self):
        super().__init__(
            name="whale_copy",
            weight=0.30
        )
        
        self.whales = WHALE_WALLETS
        self.config = WHALE_COPY_CONFIG
        
        # Track what we've already copied
        self.copied_trades = set()
    
    def scan(self) -> List[Opportunity]:
        """Scan whale wallets for new trades"""
        
        print(f"\n{'='*70}")
        print(f"🐋 {self.name.upper()} - Monitoring whale wallets...")
        print(f"{'='*70}")
        
        self.last_scan_time = datetime.now()
        
        opportunities = []
        capital_per_strategy = get_strategy_allocation(self.name)
        
        for whale_name, whale_data in self.whales.items():
            try:
                # Get whale's recent trades
                trades = self._get_whale_trades(whale_data["address"])
                
                if not trades:
                    continue
                
                print(f"\n🔍 Checking {whale_name} ({whale_data['address'][:10]}...)")
                print(f"   Specialty: {whale_data['specialty']}")
                print(f"   All-time profit: ${whale_data['profit']:,.0f}")
                
                # Check each recent trade
                for trade in trades:
                    # Skip if already copied
                    trade_id = f"{whale_data['address']}_{trade['market_slug']}_{trade['timestamp']}"
                    if trade_id in self.copied_trades:
                        continue
                    
                    # Check if high conviction (large size)
                    if trade['size_usd'] < whale_data['min_position_usd']:
                        continue
                    
                    # Create copy opportunity
                    # Size at 15% of whale's position
                    copy_size = trade['size_usd'] * (self.config['position_size_pct'] / 100)
                    copy_size = min(copy_size, capital_per_strategy * 0.20)  # Max 20% of strategy capital
                    
                    opp = Opportunity(
                        market_slug=trade['market_slug'],
                        question=trade['question'],
                        direction=trade['direction'],
                        size_usd=copy_size,
                        expected_return_pct=15.0,  # Assume 15% average return (historical)
                        confidence=0.7,  # 70% confidence in whale
                        reasoning=f"Copying {whale_name} ({whale_data['profit']/1000000:.1f}M profit). Whale bet ${trade['size_usd']:,.0f} on {trade['direction']}. Specialty: {whale_data['specialty']}",
                        strategy_name=self.name,
                        timestamp=datetime.now()
                    )
                    
                    opportunities.append(opp)
                    self.copied_trades.add(trade_id)
                    
                    print(f"\n   ✅ Copy opportunity:")
                    print(f"      Market: {trade['question'][:50]}...")
                    print(f"      Whale bet: ${trade['size_usd']:,.0f}")
                    print(f"      Our copy: ${copy_size:.2f}")
                    print(f"      Direction: {trade['direction']}")
            
            except Exception as e:
                print(f"⚠️ Error monitoring {whale_name}: {e}")
                continue
        
        print(f"\n🐋 Found {len(opportunities)} whale copy opportunities")
        print(f"{'='*70}\n")
        
        return opportunities
    
    def _get_whale_trades(self, address: str) -> List[dict]:
        """
        Get recent trades from a whale wallet
        
        NOTE: In production, integrate with:
        - PolyTrack API (https://polytrackhq.app)
        - Polygonscan API
        - On-chain event monitoring
        
        Returns mock data for now.
        """
        
        # Mock implementation
        # In production, query:
        # 1. Polymarket API for user positions
        # 2. Polygonscan for recent transactions
        # 3. PolyTrack for whale alerts
        
        return [
            # Mock whale trade
            {
                "market_slug": "btc-updown-15m-example",
                "question": "Will BTC go up in next 15 minutes?",
                "direction": "UP",
                "size_usd": 10000,
                "price": 0.55,
                "timestamp": datetime.now().timestamp()
            }
        ] if False else []  # Disabled for testing


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    strategy = WhaleCopyStrategy()
    
    print("\n" + "="*70)
    print("🧪 Testing Whale Copy Strategy")
    print("="*70)
    
    print(f"\n📋 Tracking {len(strategy.whales)} whale wallets:")
    for name, data in strategy.whales.items():
        print(f"   • {name}: ${data['profit']/1000000:.1f}M profit ({data['specialty']})")
    
    opportunities = strategy.scan()
    
    if opportunities:
        print(f"\n✅ Found {len(opportunities)} opportunities")
        
        for i, opp in enumerate(opportunities, 1):
            print(f"\n{i}. {opp.market_slug}")
            print(f"   {opp.reasoning[:100]}...")
    else:
        print("\n⏸️  No whale activity detected (waiting for new trades)")
    
    print("\n" + "="*70)
    print("💡 TIP: Integrate with PolyTrack API for real-time whale monitoring")
    print("="*70)
