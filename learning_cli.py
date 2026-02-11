#!/usr/bin/env python3
"""
CLI tool for managing the Polymarket learning engine.
View stats, test adaptations, simulate trades, etc.
"""

import sys
sys.path.insert(0, '/Users/erik/.openclaw/workspace')

import argparse
import json
from datetime import datetime, timedelta
import random
from polymarket_learning import LearningEngine, TRADE_HISTORY_PATH, LEARNED_PARAMS_PATH, PERFORMANCE_STATS_PATH

def cmd_status(args):
    """Show current learning status"""
    engine = LearningEngine()
    print(engine.get_performance_report())

def cmd_reset(args):
    """Reset all learning data (with confirmation)"""
    if not args.force:
        confirm = input("⚠️  This will delete all trade history and learned params. Type 'yes' to confirm: ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            return
    
    import os
    for path in [TRADE_HISTORY_PATH, LEARNED_PARAMS_PATH, PERFORMANCE_STATS_PATH]:
        if os.path.exists(path):
            os.remove(path)
            print(f"Deleted: {path}")
    
    print("✅ Learning data reset complete.")

def cmd_simulate(args):
    """Simulate trades to test the learning engine"""
    engine = LearningEngine()
    
    num_trades = args.count
    win_rate = args.win_rate / 100.0
    
    print(f"Simulating {num_trades} trades with {args.win_rate}% win rate...")
    
    assets = ['BTC', 'ETH']
    directions = ['UP', 'DOWN']
    time_buckets = [(30, 180), (200, 420), (450, 800)]  # early, mid, late
    
    for i in range(num_trades):
        asset = random.choice(assets)
        direction = random.choice(directions)
        time_range = random.choice(time_buckets)
        time_in_window = random.randint(time_range[0], time_range[1])
        confidence = random.uniform(0.2, 0.8)
        
        # Record trade
        trade_id = engine.record_trade(
            asset=asset,
            direction=direction,
            confidence=confidence,
            price_at_entry=50000 + random.uniform(-500, 500) if asset == 'BTC' else 3000 + random.uniform(-50, 50),
            price_change_at_entry=random.uniform(-0.005, 0.005),
            time_in_window=time_in_window,
            window_start_price=50000 if asset == 'BTC' else 3000,
            order_id=f"sim_{i}",
            market_slug=f"sim_market_{i}"
        )
        
        # Simulate resolution
        is_win = random.random() < win_rate
        actual_direction = direction if is_win else ('DOWN' if direction == 'UP' else 'UP')
        
        start_price = 50000 if asset == 'BTC' else 3000
        end_price = start_price * (1.001 if actual_direction == 'UP' else 0.999)
        
        engine.resolve_trade(trade_id, end_price, actual_direction)
    
    print(f"✅ Simulated {num_trades} trades")
    print()
    print(engine.get_performance_report())

def cmd_test_confidence(args):
    """Test confidence adjustment for specific conditions"""
    engine = LearningEngine()
    
    asset = args.asset
    direction = args.direction
    base_conf = args.confidence
    time_in_window = args.time
    
    adjusted, adjustments = engine.get_adjusted_confidence(
        asset=asset,
        direction=direction,
        base_confidence=base_conf,
        time_in_window=time_in_window
    )
    
    print(f"Testing: {asset} {direction} with base confidence {base_conf:.0%} at {time_in_window}s into window")
    print()
    print(f"Base confidence:     {base_conf:.1%}")
    print(f"Adjusted confidence: {adjusted:.1%}")
    print(f"Total adjustment:    {(adjusted - base_conf):+.1%}")
    print()
    
    if adjustments:
        print("Breakdown:")
        for key, value in adjustments.items():
            print(f"   {key}: {value:+.1%}")
    else:
        print("No adjustments applied (no learning data yet)")
    
    should_skip, reason = engine.should_skip_trade(asset, direction, adjusted)
    print()
    if should_skip:
        print(f"⚠️  Trade would be SKIPPED: {reason}")
    else:
        print("✅ Trade would be ALLOWED")

def cmd_show_trades(args):
    """Show recent trade history"""
    engine = LearningEngine()
    
    trades = engine.trade_history
    if args.pending:
        trades = [t for t in trades if t.result == "PENDING"]
    
    count = min(args.count, len(trades))
    recent = trades[-count:] if trades else []
    
    print(f"Showing {len(recent)} of {len(trades)} trades:")
    print()
    
    for trade in recent:
        result_emoji = {"WIN": "✅", "LOSS": "❌", "PENDING": "⏳"}.get(trade.result, "❓")
        print(f"[{trade.timestamp[:16]}] {result_emoji} {trade.asset} {trade.direction}")
        print(f"   Confidence: {trade.confidence:.0%} | Time: {trade.time_in_window}s | P&L: ${trade.pnl:+.2f}")
        print()

def cmd_force_adapt(args):
    """Force run an adaptation cycle"""
    engine = LearningEngine()
    
    print("Before adaptation:")
    print(f"   Min confidence: {engine.learned_params.min_confidence:.0%}")
    print(f"   Version: {engine.learned_params.version}")
    print()
    
    engine._run_adaptation()
    
    print()
    print("After adaptation:")
    print(f"   Min confidence: {engine.learned_params.min_confidence:.0%}")
    print(f"   Version: {engine.learned_params.version}")

def main():
    parser = argparse.ArgumentParser(description="Polymarket Learning Engine CLI")
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show learning status and performance')
    
    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset all learning data')
    reset_parser.add_argument('--force', action='store_true', help='Skip confirmation')
    
    # Simulate command
    sim_parser = subparsers.add_parser('simulate', help='Simulate trades for testing')
    sim_parser.add_argument('--count', type=int, default=50, help='Number of trades to simulate')
    sim_parser.add_argument('--win-rate', type=float, default=50, help='Win rate percentage (0-100)')
    
    # Test confidence command
    test_parser = subparsers.add_parser('test', help='Test confidence adjustment')
    test_parser.add_argument('--asset', choices=['BTC', 'ETH'], default='BTC')
    test_parser.add_argument('--direction', choices=['UP', 'DOWN'], default='UP')
    test_parser.add_argument('--confidence', type=float, default=0.5, help='Base confidence (0-1)')
    test_parser.add_argument('--time', type=int, default=300, help='Seconds into window')
    
    # Show trades command
    trades_parser = subparsers.add_parser('trades', help='Show trade history')
    trades_parser.add_argument('--count', type=int, default=10, help='Number of trades to show')
    trades_parser.add_argument('--pending', action='store_true', help='Show only pending trades')
    
    # Force adapt command
    adapt_parser = subparsers.add_parser('adapt', help='Force run adaptation cycle')
    
    args = parser.parse_args()
    
    if args.command == 'status':
        cmd_status(args)
    elif args.command == 'reset':
        cmd_reset(args)
    elif args.command == 'simulate':
        cmd_simulate(args)
    elif args.command == 'test':
        cmd_test_confidence(args)
    elif args.command == 'trades':
        cmd_show_trades(args)
    elif args.command == 'adapt':
        cmd_force_adapt(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
