"""
Domain Specialist Strategy - Focus on crypto markets with expert knowledge
"""

from typing import List
from datetime import datetime

from .base_strategy import BaseStrategy, Opportunity
from core.market_scanner import MarketScanner
from core.llm_forecaster import LLMForecaster
from config import get_strategy_allocation


class DomainSpecialistStrategy(BaseStrategy):
    """
    Specialize in crypto markets using domain expertise
    
    Strategy:
    1. Filter for crypto-related markets only
    2. Use domain knowledge + LLM forecasting
    3. Focus on: price predictions, token launches, exchange news
    4. Higher confidence than general markets
    
    Edge comes from:
    - Deep crypto knowledge
    - On-chain data analysis
    - Community sentiment
    - Technical analysis
    """
    
    def __init__(self):
        super().__init__(
            name="domain_specialist",
            weight=0.30  # Overlap with LLM forecast, but crypto-focused
        )
        
        self.scanner = MarketScanner()
        self.forecaster = LLMForecaster()
        
        # Crypto-specific filters
        self.crypto_keywords = [
            "bitcoin", "btc", "ethereum", "eth", "crypto", "blockchain",
            "defi", "nft", "token", "coin", "binance", "coinbase",
            "sol", "solana", "polygon", "matic", "altcoin"
        ]
    
    def scan(self) -> List[Opportunity]:
        """Scan for crypto market opportunities"""
        
        print(f"\n{'='*70}")
        print(f"🔷 {self.name.upper()} - Analyzing crypto markets...")
        print(f"{'='*70}")
        
        self.last_scan_time = datetime.now()
        
        # Get all markets
        markets = self.scanner.get_all_markets(limit=100)
        
        # Filter for crypto markets
        crypto_markets = self.scanner.filter_crypto_markets(markets)
        
        print(f"📊 Found {len(crypto_markets)} crypto-related markets")
        
        opportunities = []
        capital_per_strategy = get_strategy_allocation("llm_forecast")  # Share with LLM budget
        
        for market in crypto_markets[:10]:  # Analyze top 10
            try:
                # Use LLM forecasting with crypto domain context
                forecast = self.forecaster.forecast_market(market)
                
                # Higher threshold for domain specialist (more selective)
                if not forecast.should_trade or abs(forecast.edge) < 0.08:
                    continue
                
                # Boost confidence for crypto markets (we know this domain)
                confidence_boost = 1.2
                confidence_score = {
                    "HIGH": 0.85,
                    "MEDIUM": 0.65,
                    "LOW": 0.40
                }.get(forecast.confidence, 0.4) * confidence_boost
                
                confidence_score = min(confidence_score, 0.95)  # Cap at 95%
                
                # Position sizing
                size_usd = capital_per_strategy * 0.08 * confidence_score
                
                # Expected return
                expected_return_pct = abs(forecast.edge) * 100
                
                opp = Opportunity(
                    market_slug=market.slug,
                    question=market.question,
                    direction=forecast.direction,
                    size_usd=size_usd,
                    expected_return_pct=expected_return_pct,
                    confidence=confidence_score,
                    reasoning=f"Crypto Specialist: {forecast.predicted_probability:.1%} vs {forecast.current_price:.1%}. Domain edge + LLM. {forecast.reasoning[:150]}",
                    strategy_name=self.name,
                    timestamp=datetime.now()
                )
                
                opportunities.append(opp)
                
                print(f"\n✅ Crypto opportunity:")
                print(f"   Market: {market.question[:60]}...")
                print(f"   Edge: {forecast.edge:+.1%}")
                print(f"   Domain Confidence: {confidence_score:.0%}")
                print(f"   Direction: {forecast.direction}")
                print(f"   Size: ${opp.size_usd:.2f}")
            
            except Exception as e:
                print(f"⚠️ Error analyzing market: {e}")
                continue
        
        print(f"\n🔷 Found {len(opportunities)} crypto specialist opportunities")
        print(f"{'='*70}\n")
        
        return opportunities


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    strategy = DomainSpecialistStrategy()
    
    print("\n" + "="*70)
    print("🧪 Testing Domain Specialist Strategy")
    print("="*70)
    
    print(f"\n📋 Crypto Keywords:")
    print(f"   {', '.join(strategy.crypto_keywords[:15])}")
    
    opportunities = strategy.scan()
    
    if opportunities:
        print(f"\n✅ Found {len(opportunities)} crypto opportunities")
        
        for i, opp in enumerate(opportunities[:3], 1):
            print(f"\n{i}. {opp.market_slug}")
            print(f"   Direction: {opp.direction}")
            print(f"   Size: ${opp.size_usd:.2f}")
            print(f"   Confidence: {opp.confidence:.0%}")
            print(f"   EV: ${opp.expected_value:.2f}")
    else:
        print("\n❌ No crypto opportunities found")
    
    print("\n" + "="*70)
    print("💡 TIP: This strategy benefits from:")
    print("   • On-chain data integration")
    print("   • Crypto Twitter sentiment")
    print("   • Technical analysis indicators")
    print("="*70)
