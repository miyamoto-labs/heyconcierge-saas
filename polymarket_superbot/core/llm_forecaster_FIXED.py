"""
LLM Forecaster - Use REAL LLM reasoning to predict market probabilities
FIXED VERSION with actual DeepSeek integration
"""

import json
import os
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timezone

from .market_scanner import Market
from .news_aggregator import NewsAggregator

# DeepSeek API via OpenAI SDK
try:
    from openai import OpenAI
    DEEPSEEK_KEY = os.getenv('DEEPSEEK_API_KEY') or os.getenv('OPENAI_API_KEY')
    if DEEPSEEK_KEY:
        client = OpenAI(
            api_key=DEEPSEEK_KEY,
            base_url="https://api.deepseek.com" if 'DEEPSEEK' in str(DEEPSEEK_KEY) else "https://api.openai.com/v1"
        )
        LLM_AVAILABLE = True
    else:
        client = None
        LLM_AVAILABLE = False
        print("⚠️  No DEEPSEEK_API_KEY found. Using fallback forecasting.")
except ImportError:
    client = None
    LLM_AVAILABLE = False
    print("⚠️  openai package not installed. Using fallback forecasting.")


@dataclass
class Forecast:
    """LLM forecast result"""
    market_slug: str
    question: str
    current_price: float
    predicted_probability: float
    confidence: str  # HIGH, MEDIUM, LOW
    reasoning: str
    edge: float  # predicted - current
    sources: list
    timestamp: datetime
    
    @property
    def should_trade(self) -> bool:
        """Should we trade based on this forecast?"""
        return abs(self.edge) >= 0.05 and self.confidence in ["HIGH", "MEDIUM"]
    
    @property
    def direction(self) -> str:
        """Trade direction"""
        if self.edge > 0:
            return "UP"  # Buy YES
        elif self.edge < 0:
            return "DOWN"  # Buy NO
        return "NEUTRAL"


class LLMForecaster:
    """
    Use LLM to forecast market probabilities
    NOW WITH REAL LLM INTEGRATION!
    """
    
    def __init__(self, news_aggregator: Optional[NewsAggregator] = None):
        self.news = news_aggregator or NewsAggregator()
        self.forecast_cache = {}
        self.cache_ttl = 600  # Cache forecasts for 10 minutes
        self.llm_available = LLM_AVAILABLE
    
    def forecast_market(self, market: Market) -> Forecast:
        """
        Generate probability forecast for a market
        
        Args:
            market: Market object to forecast
        
        Returns:
            Forecast with predicted probability and reasoning
        """
        
        # Check cache
        cache_key = f"{market.slug}_{int(datetime.now(timezone.utc).timestamp() // self.cache_ttl)}"
        if cache_key in self.forecast_cache:
            return self.forecast_cache[cache_key]
        
        print(f"\n🤖 Forecasting: {market.question[:60]}...")
        
        # Step 1: Gather context
        news_articles = self.news.aggregate_market_news(market.question, max_articles=10)
        news_summary = self.news.summarize_news(news_articles)
        
        # Step 2: Build LLM prompt
        prompt = self._build_forecast_prompt(market, news_summary)
        
        # Step 3: Get LLM prediction
        llm_response = self._call_llm(prompt, market)
        
        # Step 4: Parse response
        forecast = self._parse_llm_response(market, llm_response, news_articles)
        
        # Cache result
        self.forecast_cache[cache_key] = forecast
        
        return forecast
    
    def _build_forecast_prompt(self, market: Market, news_summary: str) -> str:
        """Build the LLM prompt for forecasting"""
        
        prompt = f"""You are an expert prediction market forecaster. Your task is to estimate the TRUE probability of an outcome.

**MARKET QUESTION:**
{market.question}

**CURRENT MARKET DATA:**
- Current YES price: {market.yes_price:.2%}
- Current NO price: {market.no_price:.2%}
- Trading volume: ${market.volume:,.0f}
- Liquidity: ${market.liquidity:,.0f}
- Time to resolution: {market.hours_to_resolution:.1f} hours
- Category: {market.category}

**RECENT NEWS & CONTEXT:**
{news_summary}

**YOUR TASK:**
1. Analyze the question carefully
2. Consider base rates and historical precedents
3. Evaluate recent news and developments
4. Account for market efficiency (is this easy to predict?)
5. Estimate the TRUE probability (not just market sentiment)

**OUTPUT FORMAT (JSON):**
{{
    "probability": 0.XX,
    "confidence": "HIGH|MEDIUM|LOW",
    "reasoning": "Step-by-step explanation of your forecast",
    "key_factors": ["factor1", "factor2", "factor3"],
    "base_rate": 0.XX,
    "news_impact": "BULLISH|BEARISH|NEUTRAL",
    "uncertainty": "What could go wrong with this forecast?"
}}

**GUIDELINES:**
- Be calibrated: 70% predictions should be right ~70% of the time
- Consider survivorship bias, selection effects, base rates
- Don't just follow the crowd (market is already priced in)
- Identify specific edges (info asymmetry, time decay, etc.)
- LOW confidence if: unclear question, far future, high uncertainty
- HIGH confidence if: near-term, objective resolution, clear data
- If market is >90% or <10%, you need VERY strong evidence to disagree

Provide your forecast:"""
        
        return prompt
    
    def _call_llm(self, prompt: str, market: Market) -> str:
        """
        Call REAL LLM API (DeepSeek or fallback)
        """
        
        if self.llm_available and client:
            try:
                # Call DeepSeek/OpenAI
                response = client.chat.completions.create(
                    model="deepseek-chat",  # Ultra-cheap, good quality
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,  # Lower temp for more consistent forecasts
                    max_tokens=1000
                )
                
                llm_text = response.choices[0].message.content
                
                # Try to extract JSON
                if "```json" in llm_text:
                    llm_text = llm_text.split("```json")[1].split("```")[0].strip()
                elif "```" in llm_text:
                    llm_text = llm_text.split("```")[1].split("```")[0].strip()
                
                return llm_text
            
            except Exception as e:
                print(f"⚠️  LLM API error: {e}. Using fallback.")
                return self._fallback_forecast(market)
        
        else:
            # Fallback: heuristic-based forecast
            return self._fallback_forecast(market)
    
    def _fallback_forecast(self, market: Market) -> str:
        """
        Fallback forecasting when LLM unavailable
        Uses simple heuristics instead of mock data
        """
        
        current_price = market.yes_price
        
        # Heuristic: Don't trade if market is very confident (>80% or <20%)
        # Only look for obvious mispricings in the 20-80% range
        
        if current_price > 0.85 or current_price < 0.15:
            # Market is very confident - probably efficient
            # Stay neutral (predict same as market)
            probability = current_price
            confidence = "LOW"
            reasoning = "Market is very confident. No clear edge identified without LLM analysis."
        
        elif 0.40 < current_price < 0.60:
            # Toss-up market - hard to predict without real analysis
            probability = current_price
            confidence = "LOW"
            reasoning = "Market is uncertain. Need LLM analysis for edge."
        
        else:
            # Markets in 20-40% or 60-80% range: slight mean reversion bias
            # This is a CONSERVATIVE heuristic - not a real edge
            if current_price < 0.40:
                # Slightly bullish on underdogs
                probability = current_price + 0.03
                confidence = "LOW"
                reasoning = "Slight underdog bias (no LLM). Conservative heuristic."
            else:
                # Slightly bearish on favorites
                probability = current_price - 0.03
                confidence = "LOW"
                reasoning = "Slight favorite bias (no LLM). Conservative heuristic."
        
        return json.dumps({
            "probability": round(probability, 3),
            "confidence": confidence,
            "reasoning": reasoning,
            "key_factors": ["Fallback heuristic - no LLM available"],
            "base_rate": 0.5,
            "news_impact": "NEUTRAL",
            "uncertainty": "High - no LLM analysis performed"
        })
    
    def _parse_llm_response(self, market: Market, response: str, sources: list) -> Forecast:
        """Parse LLM response into Forecast object"""
        
        try:
            # Parse JSON response
            data = json.loads(response)
            
            predicted_prob = float(data.get("probability", market.yes_price))
            confidence = data.get("confidence", "LOW").upper()
            reasoning = data.get("reasoning", "No reasoning provided")
            
            # Sanity checks
            predicted_prob = max(0.01, min(0.99, predicted_prob))
            
            # Calculate edge
            edge = predicted_prob - market.yes_price
            
            return Forecast(
                market_slug=market.slug,
                question=market.question,
                current_price=market.yes_price,
                predicted_probability=predicted_prob,
                confidence=confidence,
                reasoning=reasoning,
                edge=edge,
                sources=[a.url for a in sources] if sources else [],
                timestamp=datetime.now(timezone.utc)
            )
        
        except Exception as e:
            print(f"⚠️ Error parsing LLM response: {e}")
            print(f"Raw response: {response[:200]}...")
            
            # Return neutral forecast on error
            return Forecast(
                market_slug=market.slug,
                question=market.question,
                current_price=market.yes_price,
                predicted_probability=market.yes_price,
                confidence="LOW",
                reasoning=f"Error: {str(e)}",
                edge=0.0,
                sources=[],
                timestamp=datetime.now(timezone.utc)
            )
    
    def batch_forecast(self, markets: list) -> list:
        """Forecast multiple markets"""
        forecasts = []
        
        for market in markets:
            try:
                forecast = self.forecast_market(market)
                forecasts.append(forecast)
            except Exception as e:
                print(f"❌ Failed to forecast {market.slug}: {e}")
                continue
        
        return forecasts
    
    def find_best_opportunities(self, markets: list, min_edge: float = 0.05) -> list:
        """Find markets with significant edge"""
        
        forecasts = self.batch_forecast(markets)
        
        # Filter for tradeable opportunities
        opportunities = [f for f in forecasts if f.should_trade and abs(f.edge) >= min_edge]
        
        # Sort by edge size
        opportunities.sort(key=lambda f: abs(f.edge), reverse=True)
        
        return opportunities


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    from .market_scanner import MarketScanner
    
    print("\n" + "="*70)
    print("🤖 LLM FORECASTER TEST (REAL LLM)")
    print("="*70)
    
    # Get some markets
    scanner = MarketScanner()
    markets = scanner.get_all_markets(limit=5)
    
    if not markets:
        print("❌ No markets found")
        exit(1)
    
    # Test forecaster
    forecaster = LLMForecaster()
    
    print(f"\n{'='*70}")
    print(f"LLM Available: {'✅ YES' if forecaster.llm_available else '❌ NO (using fallback)'}")
    print(f"{'='*70}")
    
    # Forecast first market
    market = markets[0]
    forecast = forecaster.forecast_market(market)
    
    print(f"\n📊 FORECAST RESULT:")
    print(f"Market: {forecast.question[:70]}...")
    print(f"Current Price: {forecast.current_price:.2%}")
    print(f"Predicted: {forecast.predicted_probability:.2%}")
    print(f"Edge: {forecast.edge:+.2%}")
    print(f"Confidence: {forecast.confidence}")
    print(f"Should Trade: {'✅ YES' if forecast.should_trade else '❌ NO'}")
    if forecast.should_trade:
        print(f"Direction: {forecast.direction}")
    print(f"\nReasoning:\n{forecast.reasoning}")
    
    print("\n" + "="*70)
