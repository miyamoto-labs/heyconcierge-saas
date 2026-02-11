#!/usr/bin/env python3
"""
💰 FUNDING RATE MONITOR & ARBITRAGE
Tracks funding rates across Hyperliquid assets
Provides signals for funding rate arbitrage + signal enhancement

Key Concepts:
- Positive funding = longs pay shorts (go short to collect)
- Negative funding = shorts pay longs (go long to collect)
- High funding (>0.05%) = opportunity to fade the trend
"""

import json
import time
from datetime import datetime
from typing import Dict, Optional, Tuple
from hyperliquid.info import Info


class FundingRateMonitor:
    """Monitor and analyze funding rates for trading signals"""
    
    def __init__(self):
        self.info = Info()
        self.funding_cache = {}  # {symbol: {rate, timestamp}}
        self.cache_ttl = 3600  # 1 hour cache
        
        # Thresholds for signal generation
        self.HIGH_POSITIVE_THRESHOLD = 0.0005  # 0.05% (annualized ~45%)
        self.HIGH_NEGATIVE_THRESHOLD = -0.0005  # -0.05%
        self.EXTREME_THRESHOLD = 0.001  # 0.1% (annualized ~90%)
        
    def get_funding_rate(self, symbol: str) -> Optional[float]:
        """
        Get current funding rate for symbol
        
        Returns:
            Funding rate as decimal (e.g., 0.0001 = 0.01%)
            None if unavailable
        """
        # Check cache first
        if symbol in self.funding_cache:
            cached = self.funding_cache[symbol]
            if time.time() - cached['timestamp'] < self.cache_ttl:
                return cached['rate']
        
        try:
            # Get meta and asset contexts
            data = self.info.meta_and_asset_ctxs()
            
            if not isinstance(data, list) or len(data) < 2:
                return None
            
            meta, contexts = data[0], data[1]
            universe = meta.get('universe', [])
            
            # Find symbol index in universe
            for idx, asset in enumerate(universe):
                if asset.get('name') == symbol:
                    # Get corresponding context
                    if idx < len(contexts):
                        ctx = contexts[idx]
                        funding = ctx.get('funding')
                        
                        if funding is not None:
                            # Convert to float and cache
                            rate = float(funding)
                            self.funding_cache[symbol] = {
                                'rate': rate,
                                'timestamp': time.time()
                            }
                            return rate
                    break
            
            return None
            
        except Exception as e:
            print(f"⚠️  Error fetching funding rate for {symbol}: {e}")
            return None
    
    def get_funding_signal(self, symbol: str, intended_side: str) -> Dict:
        """
        Analyze funding rate and provide trading signal enhancement
        
        Args:
            symbol: Asset symbol
            intended_side: "LONG" or "SHORT" - the side we're considering
            
        Returns:
            {
                'adjust': 'BOOST' | 'NEUTRAL' | 'FADE' | 'BLOCK',
                'reason': str,
                'funding_rate': float,
                'annualized_pct': float
            }
        """
        rate = self.get_funding_rate(symbol)
        
        if rate is None:
            return {
                'adjust': 'NEUTRAL',
                'reason': 'Funding rate unavailable',
                'funding_rate': None,
                'annualized_pct': None
            }
        
        # Annualize funding rate (8h funding, 3x per day, 365 days)
        annualized = rate * 3 * 365 * 100  # Convert to percentage
        
        # Determine signal
        if rate > self.EXTREME_THRESHOLD:
            # Extremely high positive funding - strong fade signal
            if intended_side == "SHORT":
                return {
                    'adjust': 'BOOST',
                    'reason': f'Extreme positive funding ({annualized:.1f}% APR) - longs overheated',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
            else:  # LONG
                return {
                    'adjust': 'BLOCK',
                    'reason': f'Extreme positive funding ({annualized:.1f}% APR) - avoid longs',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
                
        elif rate < -self.EXTREME_THRESHOLD:
            # Extremely high negative funding - strong fade signal
            if intended_side == "LONG":
                return {
                    'adjust': 'BOOST',
                    'reason': f'Extreme negative funding ({annualized:.1f}% APR) - shorts overheated',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
            else:  # SHORT
                return {
                    'adjust': 'BLOCK',
                    'reason': f'Extreme negative funding ({annualized:.1f}% APR) - avoid shorts',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
                
        elif rate > self.HIGH_POSITIVE_THRESHOLD:
            # High positive funding - moderate fade signal
            if intended_side == "SHORT":
                return {
                    'adjust': 'BOOST',
                    'reason': f'High positive funding ({annualized:.1f}% APR) - favor shorts',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
            else:  # LONG
                return {
                    'adjust': 'FADE',
                    'reason': f'High positive funding ({annualized:.1f}% APR) - be cautious on longs',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
                
        elif rate < self.HIGH_NEGATIVE_THRESHOLD:
            # High negative funding - moderate fade signal
            if intended_side == "LONG":
                return {
                    'adjust': 'BOOST',
                    'reason': f'High negative funding ({annualized:.1f}% APR) - favor longs',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
            else:  # SHORT
                return {
                    'adjust': 'FADE',
                    'reason': f'High negative funding ({annualized:.1f}% APR) - be cautious on shorts',
                    'funding_rate': rate,
                    'annualized_pct': annualized
                }
        
        else:
            # Normal funding - no adjustment
            return {
                'adjust': 'NEUTRAL',
                'reason': f'Normal funding ({annualized:.1f}% APR)',
                'funding_rate': rate,
                'annualized_pct': annualized
            }
    
    def get_arbitrage_opportunities(self, symbols: list) -> list:
        """
        Find pure funding rate arbitrage opportunities
        
        Returns list of opportunities sorted by profitability
        """
        opportunities = []
        
        for symbol in symbols:
            rate = self.get_funding_rate(symbol)
            if rate is None:
                continue
            
            annualized = rate * 3 * 365 * 100
            
            # Consider arbitrage if |funding| > 0.05%
            if abs(rate) > self.HIGH_POSITIVE_THRESHOLD:
                opportunities.append({
                    'symbol': symbol,
                    'funding_rate': rate,
                    'annualized_pct': annualized,
                    'recommended_side': 'SHORT' if rate > 0 else 'LONG',
                    'expected_8h_profit_pct': abs(rate) * 100,  # Per 8h period
                    'risk_level': 'LOW' if abs(rate) < self.EXTREME_THRESHOLD else 'MEDIUM'
                })
        
        # Sort by absolute funding rate (highest profit potential first)
        opportunities.sort(key=lambda x: abs(x['funding_rate']), reverse=True)
        
        return opportunities
    
    def print_funding_report(self, symbols: list):
        """Print a formatted funding rate report"""
        print("\n" + "="*60)
        print("💰 FUNDING RATE REPORT")
        print("="*60)
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        for symbol in symbols:
            rate = self.get_funding_rate(symbol)
            if rate is None:
                print(f"{symbol:8s} - Funding rate unavailable")
                continue
            
            annualized = rate * 3 * 365 * 100
            rate_pct = rate * 100
            
            # Visual indicator
            if abs(rate) > self.EXTREME_THRESHOLD:
                indicator = "🔥 EXTREME"
            elif abs(rate) > self.HIGH_POSITIVE_THRESHOLD:
                indicator = "⚡ HIGH"
            else:
                indicator = "   NORMAL"
            
            # Side recommendation
            if rate > self.HIGH_POSITIVE_THRESHOLD:
                recommendation = "→ FAVOR SHORT"
            elif rate < self.HIGH_NEGATIVE_THRESHOLD:
                recommendation = "→ FAVOR LONG"
            else:
                recommendation = ""
            
            print(f"{symbol:8s} {indicator} | "
                  f"{rate_pct:+7.4f}% per 8h | "
                  f"{annualized:+7.1f}% APR {recommendation}")
        
        # Show arbitrage opportunities
        opportunities = self.get_arbitrage_opportunities(symbols)
        if opportunities:
            print("\n📊 ARBITRAGE OPPORTUNITIES:")
            for opp in opportunities[:3]:  # Top 3
                print(f"  {opp['symbol']:8s} - "
                      f"{opp['recommended_side']:5s} - "
                      f"{opp['expected_8h_profit_pct']:.4f}% per 8h - "
                      f"{opp['risk_level']} risk")
        
        print("="*60 + "\n")


def main():
    """Standalone funding rate monitor"""
    monitor = FundingRateMonitor()
    
    symbols = ["BTC", "ETH", "SOL", "HYPE", "FARTCOIN"]
    
    print("💰 Funding Rate Monitor - Press Ctrl+C to exit")
    print("Checking every 5 minutes...\n")
    
    try:
        while True:
            monitor.print_funding_report(symbols)
            time.sleep(300)  # 5 minutes
            
    except KeyboardInterrupt:
        print("\n👋 Funding rate monitor stopped")


if __name__ == "__main__":
    main()
