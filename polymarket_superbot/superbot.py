#!/usr/bin/env python3
"""
Polymarket Superbot - Multi-Strategy Trading System
The most advanced prediction market bot
"""

import sys
import time
import json
from typing import List
from datetime import datetime

from config import (
    PAPER_MODE, STRATEGY_WEIGHTS, LEARNING_CONFIG,
    get_capital, get_max_position_size
)

from core.executor import TradeExecutor
from strategies import (
    LLMForecastStrategy,
    WhaleCopyStrategy,
    LowRiskBondStrategy,
    NewsScalpStrategy,
    DomainSpecialistStrategy,
    Opportunity
)


class SuperBot:
    """
    Multi-strategy Polymarket trading bot
    
    Coordinates multiple strategies:
    1. LLM Forecasting - AI probability predictions
    2. Whale Copy - Mirror profitable traders
    3. Low-Risk Bonds - Near-certain outcomes
    4. News Scalping - React to breaking news
    5. Domain Specialist - Crypto expertise
    """
    
    def __init__(self, paper_mode: bool = PAPER_MODE):
        """Initialize the superbot"""
        
        self.paper_mode = paper_mode
        
        print("\n" + "="*70)
        print("🤖 POLYMARKET SUPERBOT - INITIALIZING")
        print("="*70)
        
        # Initialize executor
        self.executor = TradeExecutor(paper_mode=paper_mode)
        
        # Initialize strategies
        self.strategies = [
            LLMForecastStrategy(),
            WhaleCopyStrategy(),
            LowRiskBondStrategy(),
            # NewsScalpStrategy(),  # Requires real-time monitoring
            # DomainSpecialistStrategy()  # Overlaps with LLM forecast
        ]
        
        print(f"\n💼 Capital: ${get_capital():.2f}")
        print(f"📊 Mode: {'📝 PAPER TRADING' if paper_mode else '💸 LIVE TRADING'}")
        print(f"\n🎯 Active Strategies ({len(self.strategies)}):")
        for strategy in self.strategies:
            print(f"   • {strategy.name}: {strategy.weight:.0%} allocation")
        
        print(f"\n✅ Superbot initialized successfully!")
        print("="*70 + "\n")
    
    def run_cycle(self, max_trades: int = 5) -> int:
        """
        Run one trading cycle
        
        Returns:
            Number of trades executed
        """
        
        cycle_start = datetime.now()
        
        print("\n" + "="*70)
        print(f"🔄 STARTING TRADING CYCLE - {cycle_start.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70)
        
        # Step 1: Scan all strategies for opportunities
        all_opportunities = []
        
        for strategy in self.strategies:
            if not strategy.enabled:
                continue
            
            try:
                opportunities = strategy.scan()
                all_opportunities.extend(opportunities)
            except Exception as e:
                print(f"❌ Error in {strategy.name}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        if not all_opportunities:
            print("\n⏸️  No trading opportunities found this cycle")
            print("="*70 + "\n")
            return 0
        
        # Step 2: Rank opportunities by expected value
        all_opportunities.sort(key=lambda o: o.expected_value, reverse=True)
        
        print(f"\n📊 OPPORTUNITY RANKING")
        print("="*70)
        print(f"Found {len(all_opportunities)} total opportunities")
        print(f"\nTop {min(10, len(all_opportunities))} by Expected Value:")
        
        for i, opp in enumerate(all_opportunities[:10], 1):
            print(f"\n{i}. {opp.strategy_name.upper()}")
            print(f"   Market: {opp.question[:60]}...")
            print(f"   Direction: {opp.direction}")
            print(f"   Size: ${opp.size_usd:.2f}")
            print(f"   Return: {opp.expected_return_pct:.1f}%")
            print(f"   Confidence: {opp.confidence:.0%}")
            print(f"   EV: ${opp.expected_value:.2f}")
        
        # Step 3: Execute top opportunities
        print(f"\n⚡ EXECUTING TRADES")
        print("="*70)
        
        trades_executed = 0
        
        for opp in all_opportunities[:max_trades]:
            try:
                print(f"\n🎯 Executing opportunity #{trades_executed + 1}")
                
                result = self.executor.place_trade(
                    market_slug=opp.market_slug,
                    direction=opp.direction,
                    size_usd=opp.size_usd,
                    strategy=opp.strategy_name,
                    reasoning=opp.reasoning
                )
                
                if result.success:
                    trades_executed += 1
                    print(f"✅ Trade {trades_executed} executed successfully")
                else:
                    print(f"❌ Trade failed: {result.error}")
                
                # Rate limiting
                time.sleep(2)
            
            except Exception as e:
                print(f"❌ Error executing trade: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        # Step 4: Show cycle summary
        cycle_end = datetime.now()
        duration = (cycle_end - cycle_start).total_seconds()
        
        print(f"\n📊 CYCLE SUMMARY")
        print("="*70)
        print(f"Duration: {duration:.1f}s")
        print(f"Opportunities Found: {len(all_opportunities)}")
        print(f"Trades Executed: {trades_executed}")
        
        # Show portfolio status
        status = self.executor.get_portfolio_status()
        print(f"\n💼 Portfolio Status:")
        print(f"   Capital: ${status['capital']:.2f}")
        print(f"   Active Positions: {status['active_positions']}")
        print(f"   Exposure: ${status['total_exposure']:.2f} ({status['utilization_pct']:.1f}%)")
        print(f"   Daily Trades: {status['daily_trades']}")
        print(f"   Daily P&L: ${status['daily_pnl']:+.2f}")
        
        print("\n" + "="*70 + "\n")
        
        return trades_executed
    
    def run_continuous(self, cycle_interval_seconds: int = 300):
        """
        Run bot continuously
        
        Args:
            cycle_interval_seconds: Seconds between cycles (default 5 minutes)
        """
        
        print("\n" + "="*70)
        print("🚀 STARTING CONTINUOUS MODE")
        print("="*70)
        print(f"Cycle interval: {cycle_interval_seconds}s ({cycle_interval_seconds/60:.1f} minutes)")
        print(f"Press Ctrl+C to stop")
        print("="*70 + "\n")
        
        cycle_count = 0
        
        try:
            while True:
                cycle_count += 1
                
                print(f"\n{'='*70}")
                print(f"🔄 CYCLE #{cycle_count}")
                print(f"{'='*70}")
                
                trades = self.run_cycle(max_trades=5)
                
                print(f"\n⏰ Next cycle in {cycle_interval_seconds}s...")
                print(f"{'='*70}\n")
                
                time.sleep(cycle_interval_seconds)
        
        except KeyboardInterrupt:
            print("\n\n" + "="*70)
            print("🛑 STOPPING SUPERBOT")
            print("="*70)
            print(f"Total cycles: {cycle_count}")
            print("\n✅ Bot stopped successfully")
            print("="*70 + "\n")
    
    def get_performance_report(self) -> dict:
        """Generate performance report for all strategies"""
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "mode": "paper" if self.paper_mode else "live",
            "capital": get_capital(),
            "strategies": []
        }
        
        for strategy in self.strategies:
            report["strategies"].append(strategy.get_performance_summary())
        
        return report
    
    def print_performance_report(self):
        """Print performance report"""
        
        report = self.get_performance_report()
        
        print("\n" + "="*70)
        print("📊 PERFORMANCE REPORT")
        print("="*70)
        print(f"Mode: {report['mode'].upper()}")
        print(f"Capital: ${report['capital']:.2f}")
        print(f"Generated: {report['timestamp']}")
        
        print(f"\n📈 Strategy Performance:")
        
        for strategy in report["strategies"]:
            print(f"\n🎯 {strategy['name'].upper()}")
            print(f"   Status: {'✅ ENABLED' if strategy['enabled'] else '❌ DISABLED'}")
            print(f"   Weight: {strategy['weight']:.0%}")
            print(f"   Trades: {strategy['trades_executed']}")
            print(f"   Win Rate: {strategy['win_rate']:.1%}")
            print(f"   Total P&L: ${strategy['total_pnl']:+.2f}")
            print(f"   Avg P&L/Trade: ${strategy['avg_pnl_per_trade']:+.2f}")
        
        print("\n" + "="*70 + "\n")


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Main CLI entry point"""
    
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Polymarket Superbot - Multi-Strategy Trading System"
    )
    
    parser.add_argument(
        "--mode",
        choices=["paper", "live"],
        default="paper",
        help="Trading mode (default: paper)"
    )
    
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Run continuously"
    )
    
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Cycle interval in seconds (default: 300 = 5 minutes)"
    )
    
    parser.add_argument(
        "--max-trades",
        type=int,
        default=5,
        help="Max trades per cycle (default: 5)"
    )
    
    parser.add_argument(
        "--report",
        action="store_true",
        help="Show performance report and exit"
    )
    
    args = parser.parse_args()
    
    # Initialize bot
    paper_mode = (args.mode == "paper")
    bot = SuperBot(paper_mode=paper_mode)
    
    # Show report if requested
    if args.report:
        bot.print_performance_report()
        return
    
    # Run continuous or single cycle
    if args.continuous:
        bot.run_continuous(cycle_interval_seconds=args.interval)
    else:
        trades = bot.run_cycle(max_trades=args.max_trades)
        print(f"\n✅ Cycle complete. Executed {trades} trades.")


if __name__ == "__main__":
    main()
