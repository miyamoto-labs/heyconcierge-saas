#!/usr/bin/env python3
"""
Performance Statistics and Reporting
Generates detailed performance metrics for the trading bot
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np

class PerformanceTracker:
    """Track and analyze trading performance"""
    
    def __init__(self, 
                 trade_history_file: str = "trade_history.json",
                 state_file: str = "bot_state.json"):
        self.trade_history_file = trade_history_file
        self.state_file = state_file
    
    def load_trades(self) -> List[Dict]:
        """Load trade history"""
        if not os.path.exists(self.trade_history_file):
            return []
        
        try:
            with open(self.trade_history_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading trade history: {e}")
            return []
    
    def load_state(self) -> Dict:
        """Load bot state"""
        if not os.path.exists(self.state_file):
            return {}
        
        try:
            with open(self.state_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading state: {e}")
            return {}
    
    def calculate_metrics(self) -> Dict:
        """Calculate comprehensive performance metrics"""
        
        trades = self.load_trades()
        state = self.load_state()
        
        if not trades:
            return {"error": "No trades found"}
        
        # Filter completed trades (with exit data)
        completed_trades = [t for t in trades if t.get("exit_time")]
        
        if not completed_trades:
            return {
                "total_trades": len(trades),
                "completed_trades": 0,
                "open_trades": len(trades),
                "note": "No completed trades yet"
            }
        
        # Basic metrics
        total_trades = len(completed_trades)
        winning_trades = [t for t in completed_trades if t.get("pnl", 0) > 0]
        losing_trades = [t for t in completed_trades if t.get("pnl", 0) <= 0]
        
        win_count = len(winning_trades)
        loss_count = len(losing_trades)
        win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0
        
        # P&L metrics
        total_pnl = sum(t.get("pnl", 0) for t in completed_trades)
        avg_win = np.mean([t["pnl"] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t["pnl"] for t in losing_trades]) if losing_trades else 0
        
        largest_win = max([t["pnl"] for t in winning_trades]) if winning_trades else 0
        largest_loss = min([t["pnl"] for t in losing_trades]) if losing_trades else 0
        
        # Profit factor
        gross_profit = sum(t["pnl"] for t in winning_trades) if winning_trades else 0
        gross_loss = abs(sum(t["pnl"] for t in losing_trades)) if losing_trades else 1
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Risk/Reward
        avg_rr = abs(avg_win / avg_loss) if avg_loss != 0 else 0
        
        # Sharpe Ratio (simplified)
        returns = [t.get("pnl_pct", 0) for t in completed_trades]
        if returns and len(returns) > 1:
            mean_return = np.mean(returns)
            std_return = np.std(returns)
            sharpe = (mean_return / std_return * np.sqrt(252)) if std_return > 0 else 0
        else:
            sharpe = 0
        
        # Drawdown
        equity_curve = []
        running_balance = state.get("peak_balance", 1000)
        
        for trade in completed_trades:
            running_balance += trade.get("pnl", 0)
            equity_curve.append(running_balance)
        
        if equity_curve:
            peak = equity_curve[0]
            max_dd = 0
            
            for value in equity_curve:
                if value > peak:
                    peak = value
                dd = (peak - value) / peak * 100
                if dd > max_dd:
                    max_dd = dd
        else:
            max_dd = 0
        
        # Timeframe breakdown
        timeframe_stats = {}
        for tf in ["1h", "4h", "1d"]:
            tf_trades = [t for t in completed_trades if t.get("timeframe") == tf]
            if tf_trades:
                tf_wins = len([t for t in tf_trades if t.get("pnl", 0) > 0])
                tf_pnl = sum(t.get("pnl", 0) for t in tf_trades)
                timeframe_stats[tf] = {
                    "trades": len(tf_trades),
                    "wins": tf_wins,
                    "win_rate": (tf_wins / len(tf_trades) * 100),
                    "pnl": tf_pnl
                }
        
        # Long vs Short
        long_trades = [t for t in completed_trades if t.get("action") == "LONG"]
        short_trades = [t for t in completed_trades if t.get("action") == "SHORT"]
        
        long_wins = len([t for t in long_trades if t.get("pnl", 0) > 0])
        short_wins = len([t for t in short_trades if t.get("pnl", 0) > 0])
        
        # Recent performance (last 7 days)
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        
        recent_trades = [
            t for t in completed_trades 
            if datetime.fromisoformat(t.get("timestamp", "2020-01-01")) > week_ago
        ]
        
        recent_pnl = sum(t.get("pnl", 0) for t in recent_trades) if recent_trades else 0
        
        return {
            "summary": {
                "total_trades": total_trades,
                "winning_trades": win_count,
                "losing_trades": loss_count,
                "win_rate_pct": round(win_rate, 2),
                "total_pnl": round(total_pnl, 2),
                "avg_win": round(avg_win, 2),
                "avg_loss": round(avg_loss, 2),
                "largest_win": round(largest_win, 2),
                "largest_loss": round(largest_loss, 2),
                "profit_factor": round(profit_factor, 2),
                "risk_reward_ratio": round(avg_rr, 2),
                "sharpe_ratio": round(sharpe, 2),
                "max_drawdown_pct": round(max_dd, 2)
            },
            "timeframe_breakdown": timeframe_stats,
            "direction_breakdown": {
                "long": {
                    "trades": len(long_trades),
                    "wins": long_wins,
                    "win_rate_pct": round(long_wins / len(long_trades) * 100, 2) if long_trades else 0,
                    "pnl": round(sum(t.get("pnl", 0) for t in long_trades), 2)
                },
                "short": {
                    "trades": len(short_trades),
                    "wins": short_wins,
                    "win_rate_pct": round(short_wins / len(short_trades) * 100, 2) if short_trades else 0,
                    "pnl": round(sum(t.get("pnl", 0) for t in short_trades), 2)
                }
            },
            "recent_7_days": {
                "trades": len(recent_trades),
                "pnl": round(recent_pnl, 2)
            },
            "state": {
                "consecutive_losses": state.get("consecutive_losses", 0),
                "daily_pnl": state.get("daily_pnl", 0),
                "peak_balance": state.get("peak_balance", 0)
            }
        }
    
    def generate_report(self, output_file: Optional[str] = None) -> str:
        """Generate human-readable performance report"""
        
        metrics = self.calculate_metrics()
        
        if "error" in metrics:
            return f"Error: {metrics['error']}"
        
        report = []
        report.append("="*70)
        report.append("📊 HYPERLIQUID BOT PERFORMANCE REPORT")
        report.append("="*70)
        report.append(f"\n⏰ Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Summary
        summary = metrics["summary"]
        report.append("📈 OVERALL PERFORMANCE")
        report.append("-"*70)
        report.append(f"Total Trades: {summary['total_trades']}")
        report.append(f"Winning Trades: {summary['winning_trades']}")
        report.append(f"Losing Trades: {summary['losing_trades']}")
        report.append(f"Win Rate: {summary['win_rate_pct']}%")
        report.append(f"\nTotal P&L: ${summary['total_pnl']:,.2f}")
        report.append(f"Average Win: ${summary['avg_win']:,.2f}")
        report.append(f"Average Loss: ${summary['avg_loss']:,.2f}")
        report.append(f"Largest Win: ${summary['largest_win']:,.2f}")
        report.append(f"Largest Loss: ${summary['largest_loss']:,.2f}")
        report.append(f"\nProfit Factor: {summary['profit_factor']:.2f}")
        report.append(f"Risk/Reward Ratio: {summary['risk_reward_ratio']:.2f}")
        report.append(f"Sharpe Ratio: {summary['sharpe_ratio']:.2f}")
        report.append(f"Max Drawdown: {summary['max_drawdown_pct']:.2f}%")
        
        # Timeframe breakdown
        if metrics.get("timeframe_breakdown"):
            report.append("\n\n⏱️  TIMEFRAME BREAKDOWN")
            report.append("-"*70)
            for tf, stats in metrics["timeframe_breakdown"].items():
                report.append(f"\n{tf.upper()}:")
                report.append(f"  Trades: {stats['trades']}")
                report.append(f"  Win Rate: {stats['win_rate']:.1f}%")
                report.append(f"  P&L: ${stats['pnl']:,.2f}")
        
        # Direction breakdown
        direction = metrics.get("direction_breakdown", {})
        report.append("\n\n🎯 LONG vs SHORT")
        report.append("-"*70)
        
        if direction.get("long"):
            long = direction["long"]
            report.append(f"\nLONG Trades:")
            report.append(f"  Total: {long['trades']}")
            report.append(f"  Win Rate: {long['win_rate_pct']}%")
            report.append(f"  P&L: ${long['pnl']:,.2f}")
        
        if direction.get("short"):
            short = direction["short"]
            report.append(f"\nSHORT Trades:")
            report.append(f"  Total: {short['trades']}")
            report.append(f"  Win Rate: {short['win_rate_pct']}%")
            report.append(f"  P&L: ${short['pnl']:,.2f}")
        
        # Recent performance
        recent = metrics.get("recent_7_days", {})
        report.append("\n\n📅 RECENT 7 DAYS")
        report.append("-"*70)
        report.append(f"Trades: {recent.get('trades', 0)}")
        report.append(f"P&L: ${recent.get('pnl', 0):,.2f}")
        
        # Current state
        state = metrics.get("state", {})
        report.append("\n\n🔄 CURRENT STATE")
        report.append("-"*70)
        report.append(f"Consecutive Losses: {state.get('consecutive_losses', 0)}")
        report.append(f"Daily P&L: ${state.get('daily_pnl', 0):,.2f}")
        report.append(f"Peak Balance: ${state.get('peak_balance', 0):,.2f}")
        
        report.append("\n" + "="*70)
        
        report_text = "\n".join(report)
        
        # Save to file if requested
        if output_file:
            try:
                with open(output_file, 'w') as f:
                    f.write(report_text)
                print(f"✅ Report saved to: {output_file}")
            except Exception as e:
                print(f"⚠️  Error saving report: {e}")
        
        return report_text
    
    def export_metrics_json(self, output_file: str = "performance_metrics.json"):
        """Export metrics as JSON"""
        metrics = self.calculate_metrics()
        
        try:
            with open(output_file, 'w') as f:
                json.dump(metrics, f, indent=2)
            print(f"✅ Metrics exported to: {output_file}")
        except Exception as e:
            print(f"❌ Error exporting metrics: {e}")

def main():
    """Command-line interface"""
    import sys
    
    tracker = PerformanceTracker()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        # Export as JSON
        tracker.export_metrics_json()
    else:
        # Generate text report
        report = tracker.generate_report("performance_report.txt")
        print(report)

if __name__ == "__main__":
    main()
