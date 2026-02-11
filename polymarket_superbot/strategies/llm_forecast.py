"""
LLM Forecast Strategy - Use AI to predict market probabilities
"""

from typing import List
from datetime import datetime

from .base_strategy import BaseStrategy, Opportunity
from core.market_scanner import MarketScanner
from core.llm_forecaster import LLMForecaster
from config import LLM_CONFIG, get_strategy_allocation


class LLMForecastStrategy(BaseStrategy):
    """
    Use LLM reasoning to find mispriced markets
    
    Strategy:
    1. Scan all active markets
    2. For each market, aggregate recent news
    3. Use LLM to estimate TRUE probability
    4. If LLM probability differs from market by >5%, trade
    """
    
    def __init__(self):
        super().__init__(
            name="llm_forecast",
            weight=0.40
        )
        
        self.scanner = MarketScanner()
        self.forecaster = LLMForecaster()
        
        self.min_edge = LLM_CONFIG["min_edge"]
        self.min_confidence = LLM_CONFIG["min_confidence"]
    
    def scan(self) -> List[Opportunity]:
        """Scan for mispriced markets using LLM"""
        
        print(f"\n{'='*70}")
        print(f"🤖 {self.name.upper()} - Scanning for opportunities...")
        print(f"{'='*70}")
        
        self.last_scan_time = datetime.now()
        
        # Get active markets with liquidity filters
        markets = self.scanner.get_all_markets(limit=100)
        
        if not markets:
            print("❌ No markets found")
            return []
        
        # FILTER: Only HIGHLY liquid markets to avoid illiquid orderbooks
        MIN_VOLUME = 100000  # $100K minimum volume (ensures real liquidity)
        MIN_LIQUIDITY = 20000  # $20K minimum liquidity
        
        liquid_markets = [
            m for m in markets 
            if m.volume >= MIN_VOLUME and m.liquidity >= MIN_LIQUIDITY
        ]
        
        print(f"✅ Scanned {len(markets)} markets")
        print(f"💧 Filtered to {len(liquid_markets)} liquid markets (vol>${MIN_VOLUME:,}, liq>${MIN_LIQUIDITY:,})")
        
        if not liquid_markets:
            print("❌ No liquid markets found")
            return []
        
        markets = liquid_markets[:20]  # Analyze top 20 by liquidity
        print(f"📊 Analyzing top {len(markets)} liquid markets with LLM...")
        
        # Find mispriced markets
        opportunities = []
        capital_per_strategy = get_strategy_allocation(self.name)
        
        for market in markets[:10]:  # Limit to 10 to avoid API costs
            try:
                # Get LLM forecast
                forecast = self.forecaster.forecast_market(market)
                
                # Check if tradeable
                if not forecast.should_trade:
                    continue
                
                if abs(forecast.edge) < self.min_edge:
                    continue
                
                # Calculate position size (2-5% of strategy capital)
                confidence_score = {
                    "HIGH": 0.8,
                    "MEDIUM": 0.5,
                    "LOW": 0.3
                }.get(forecast.confidence, 0.3)
                
                size_usd = capital_per_strategy * 0.05 * confidence_score
                
                # Estimate return
                expected_return_pct = abs(forecast.edge) * 100
                
                # Create opportunity
                opp = Opportunity(
                    market_slug=market.slug,
                    question=market.question,
                    direction=forecast.direction,
                    size_usd=size_usd,
                    expected_return_pct=expected_return_pct,
                    confidence=confidence_score,
                    reasoning=f"LLM Forecast: {forecast.predicted_probability:.1%} vs Market: {forecast.current_price:.1%}. {forecast.reasoning[:200]}",
                    strategy_name=self.name,
                    timestamp=datetime.now()
                )
                
                opportunities.append(opp)
                
                print(f"\n✅ Found opportunity:")
                print(f"   Market: {market.question[:60]}...")
                print(f"   Edge: {forecast.edge:+.1%}")
                print(f"   Confidence: {forecast.confidence}")
                print(f"   Direction: {forecast.direction}")
                print(f"   Size: ${opp.size_usd:.2f}")
            
            except Exception as e:
                print(f"⚠️ Error analyzing market: {e}")
                continue
        
        print(f"\n📈 Found {len(opportunities)} opportunities (LLM Forecast)")
        print(f"{'='*70}\n")
        
        return opportunities


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    strategy = LLMForecastStrategy()
    
    print("\n" + "="*70)
    print("🧪 Testing LLM Forecast Strategy")
    print("="*70)
    
    opportunities = strategy.scan()
    
    if opportunities:
        print(f"\n✅ Found {len(opportunities)} opportunities")
        
        # Show top 3
        for i, opp in enumerate(opportunities[:3], 1):
            print(f"\n{i}. {opp.market_slug}")
            print(f"   Direction: {opp.direction}")
            print(f"   Size: ${opp.size_usd:.2f}")
            print(f"   Expected Return: {opp.expected_return_pct:.1f}%")
            print(f"   EV: ${opp.expected_value:.2f}")
    else:
        print("\n❌ No opportunities found")
    
    print("\n" + "="*70)
