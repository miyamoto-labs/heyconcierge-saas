"""
LLM Forecaster - Use REAL LLM reasoning (Claude via Anthropic)
PRODUCTION VERSION with Claude Sonnet 3.5
"""

import json
import os
from typing import Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timezone

from .market_scanner import Market
from .news_aggregator import NewsAggregator

# Try Anthropic Claude first (we have the key)
try:
    from anthropic import Anthropic
    ANTHROPIC_KEY = os.getenv('ANTHROPIC_API_KEY')
    if ANTHROPIC_KEY:
        claude_client = Anthropic(api_key=ANTHROPIC_KEY)
        LLM_AVAILABLE = True
        LLM_PROVIDER = "Claude Sonnet 3.5"
    else:
        claude_client = None
        LLM_AVAILABLE = False
        LLM_PROVIDER = "None"
except ImportError:
    claude_client = None
    LLM_AVAILABLE = False
    LLM_PROVIDER = "None"
    print("⚠️  anthropic package not installed. Using fallback forecasting.")


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
        # Only trade if edge >= 5% AND confidence is MEDIUM or HIGH
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
    Use Claude Sonnet 3.5 to forecast market probabilities
    Fast, cheap, and accurate!
    """
    
    def __init__(self, news_aggregator: Optional[NewsAggregator] = None):
        self.news = news_aggregator or NewsAggregator()
        self.forecast_cache = {}
        self.cache_ttl = 600  # Cache forecasts for 10 minutes
        self.llm_available = LLM_AVAILABLE
        self.llm_provider = LLM_PROVIDER
        
        if self.llm_available:
            print(f"✅ LLM Forecaster initialized with {self.llm_provider}")
        else:
            print(f"⚠️  No LLM available. Using conservative heuristics.")
    
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
        
        prompt = f"""You are an expert prediction market forecaster. Estimate the TRUE probability.

**MARKET:**
{market.question}

**DATA:**
- YES price: {market.yes_price:.1%}
- Volume: ${market.volume:,.0f}
- Resolves in: {market.hours_to_resolution:.0f}h

**NEWS:**
{news_summary[:500] if news_summary else "No recent news"}

**TASK:**
Forecast the TRUE probability (0.01-0.99). Be calibrated and account for base rates.

**OUTPUT (JSON only):**
{{
    "probability": 0.XX,
    "confidence": "HIGH|MEDIUM|LOW",
    "reasoning": "2-3 sentence explanation"
}}

Guidelines:
- If market >90% or <10%, need VERY strong evidence to disagree
- Account for time to resolution
- Consider base rates first
- HIGH confidence: near-term, objective, clear data
- LOW confidence: far future, uncertain, speculative"""
        
        return prompt
    
    def _call_llm(self, prompt: str, market: Market) -> str:
        """Call Claude API"""
        
        if self.llm_available and claude_client:
            try:
                # Call Claude Sonnet 3.5
                response = claude_client.messages.create(
                    model="claude-sonnet-3-5-20241022",  # Fast, accurate, cheap
                    max_tokens=500,
                    temperature=0.3,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                
                llm_text = response.content[0].text
                
                # Extract JSON
                if "```json" in llm_text:
                    llm_text = llm_text.split("```json")[1].split("```")[0].strip()
                elif "```" in llm_text:
                    llm_text = llm_text.split("```")[1].split("```")[0].strip()
                elif "{" in llm_text and "}" in llm_text:
                    # Extract JSON object
                    start = llm_text.index("{")
                    end = llm_text.rindex("}") + 1
                    llm_text = llm_text[start:end]
                
                return llm_text
            
            except Exception as e:
                print(f"⚠️  Claude API error: {e}. Using fallback.")
                return self._fallback_forecast(market)
        
        else:
            return self._fallback_forecast(market)
    
    def _fallback_forecast(self, market: Market) -> str:
        """
        Conservative fallback when LLM unavailable
        """
        
        current_price = market.yes_price
        
        # VERY conservative: only trade extreme mispricings
        if current_price > 0.90:
            # Market says >90% - don't disagree without LLM
            probability = current_price
            confidence = "LOW"
            reasoning = "Market highly confident. No LLM - staying neutral."
        
        elif current_price < 0.10:
            # Market says <10% - don't disagree without LLM
            probability = current_price
            confidence = "LOW"
            reasoning = "Market highly confident. No LLM - staying neutral."
        
        else:
            # For 10-90% markets, stay neutral without LLM
            probability = current_price
            confidence = "LOW"
            reasoning = "No LLM available. Staying neutral to avoid blind trading."
        
        return json.dumps({
            "probability": round(probability, 3),
            "confidence": confidence,
            "reasoning": reasoning
        })
    
    def _parse_llm_response(self, market: Market, response: str, sources: list) -> Forecast:
        """Parse LLM response into Forecast object"""
        
        try:
            data = json.loads(response)
            
            predicted_prob = float(data.get("probability", market.yes_price))
            confidence = data.get("confidence", "LOW").upper()
            reasoning = data.get("reasoning", "No reasoning")
            
            # Sanity checks
            predicted_prob = max(0.01, min(0.99, predicted_prob))
            
            # Calculate edge
            edge = predicted_prob - market.yes_price
            
            # Log if significant edge found
            if abs(edge) >= 0.10:
                print(f"   🎯 EDGE FOUND: {edge:+.1%} ({self.llm_provider})")
            
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
            print(f"⚠️ Parse error: {e}")
            print(f"Raw: {response[:150]}...")
            
            # Neutral forecast on error
            return Forecast(
                market_slug=market.slug,
                question=market.question,
                current_price=market.yes_price,
                predicted_probability=market.yes_price,
                confidence="LOW",
                reasoning=f"Parse error: {str(e)}",
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
                print(f"❌ Failed: {market.slug[:40]}: {e}")
                continue
        
        return forecasts
    
    def find_best_opportunities(self, markets: list, min_edge: float = 0.05) -> list:
        """Find markets with significant edge"""
        
        forecasts = self.batch_forecast(markets)
        
        # Filter for tradeable
        opportunities = [f for f in forecasts if f.should_trade and abs(f.edge) >= min_edge]
        
        # Sort by edge
        opportunities.sort(key=lambda f: abs(f.edge), reverse=True)
        
        return opportunities
