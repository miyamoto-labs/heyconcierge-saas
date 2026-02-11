"""
Trade Executor - Wrapper around existing CLOB executor
Adds risk management and position tracking
"""

import sys
import json
import os
from typing import Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

# Import existing CLOB executor
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, '/Users/erik/.openclaw/workspace')

try:
    from polymarket_clob_executor import PolymarketExecutor, TradeResult
except ImportError:
    print("⚠️ Warning: Could not import polymarket_clob_executor")
    # Define fallback
    @dataclass
    class TradeResult:
        success: bool
        order_id: Optional[str] = None
        error: Optional[str] = None
        price: Optional[float] = None
        size: Optional[float] = None

from config import (
    WALLET_ADDRESS, PRIVATE_KEY, PAPER_MODE,
    RISK_LIMITS, get_capital, get_max_position_size
)


@dataclass
class Position:
    """Active trading position"""
    market_slug: str
    direction: str  # "UP" or "DOWN"
    size_usd: float
    entry_price: float
    timestamp: datetime
    strategy: str
    order_id: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dict for JSON serialization"""
        d = asdict(self)
        d['timestamp'] = self.timestamp.isoformat()
        return d
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Position':
        """Create from dict"""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)


class TradeExecutor:
    """
    High-level trade executor with risk management
    """
    
    def __init__(self, paper_mode: bool = PAPER_MODE):
        self.paper_mode = paper_mode
        self.executor = PolymarketExecutor(
            private_key=PRIVATE_KEY,
            wallet_address=WALLET_ADDRESS,
            paper_mode=paper_mode
        )
        
        self.positions_file = "data/active_positions.json"
        self.trades_log_file = "data/trades_log.jsonl"
        
        # Load active positions
        self.active_positions = self._load_positions()
        
        # Daily tracking
        self.daily_trades = 0
        self.daily_pnl = 0.0
        self.last_reset_date = datetime.now(timezone.utc).date()
    
    def _load_positions(self) -> Dict[str, Position]:
        """Load active positions from file"""
        try:
            if os.path.exists(self.positions_file):
                with open(self.positions_file, 'r') as f:
                    data = json.load(f)
                return {k: Position.from_dict(v) for k, v in data.items()}
        except Exception as e:
            print(f"⚠️ Error loading positions: {e}")
        
        return {}
    
    def _save_positions(self):
        """Save active positions to file"""
        try:
            os.makedirs(os.path.dirname(self.positions_file), exist_ok=True)
            with open(self.positions_file, 'w') as f:
                data = {k: v.to_dict() for k, v in self.active_positions.items()}
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error saving positions: {e}")
    
    def _log_trade(self, trade_data: Dict):
        """Append trade to log file"""
        try:
            os.makedirs(os.path.dirname(self.trades_log_file), exist_ok=True)
            with open(self.trades_log_file, 'a') as f:
                f.write(json.dumps(trade_data) + '\n')
        except Exception as e:
            print(f"⚠️ Error logging trade: {e}")
    
    def _reset_daily_limits_if_needed(self):
        """Reset daily counters at midnight"""
        today = datetime.now(timezone.utc).date()
        if today > self.last_reset_date:
            self.daily_trades = 0
            self.daily_pnl = 0.0
            self.last_reset_date = today
            print(f"🔄 Daily limits reset for {today}")
    
    def check_risk_limits(self, size_usd: float, strategy: str) -> Tuple[bool, Optional[str]]:
        """
        Check if trade passes risk management rules
        
        Returns:
            (allowed, reason_if_not)
        """
        self._reset_daily_limits_if_needed()
        
        # Check max position size
        max_size = get_max_position_size()
        if size_usd > max_size:
            return False, f"Position too large: ${size_usd:.2f} > ${max_size:.2f}"
        
        # Check daily trade limit
        if self.daily_trades >= RISK_LIMITS["max_daily_trades"]:
            return False, f"Daily trade limit reached: {self.daily_trades}"
        
        # Check daily loss limit
        max_loss = RISK_LIMITS["max_daily_loss_usd"]
        if self.daily_pnl < -max_loss:
            return False, f"Daily loss limit reached: ${self.daily_pnl:.2f}"
        
        # Check total capital usage
        total_exposure = sum(p.size_usd for p in self.active_positions.values())
        capital = get_capital()
        
        if total_exposure + size_usd > capital * 0.9:  # Max 90% capital deployed
            return False, f"Would exceed capital limit: ${total_exposure + size_usd:.2f} / ${capital:.2f}"
        
        return True, None
    
    def place_trade(
        self,
        market_slug: str,
        direction: str,
        size_usd: float,
        strategy: str,
        reasoning: str = ""
    ) -> TradeResult:
        """
        Place a trade with risk management
        
        Args:
            market_slug: Market identifier
            direction: "UP" or "DOWN"
            size_usd: Position size in USD
            strategy: Strategy name
            reasoning: Why this trade?
        
        Returns:
            TradeResult
        """
        
        # Check risk limits
        allowed, reason = self.check_risk_limits(size_usd, strategy)
        if not allowed:
            print(f"❌ Trade blocked by risk management: {reason}")
            return TradeResult(success=False, error=reason)
        
        # Execute trade
        print(f"\n{'='*70}")
        print(f"📈 EXECUTING TRADE")
        print(f"{'='*70}")
        print(f"Market: {market_slug}")
        print(f"Direction: {direction}")
        print(f"Size: ${size_usd:.2f}")
        print(f"Strategy: {strategy}")
        print(f"Mode: {'📝 PAPER' if self.paper_mode else '💸 LIVE'}")
        
        result = self.executor.place_order(
            market_slug=market_slug,
            direction=direction,
            size_usd=size_usd,
            order_type="MARKET"
        )
        
        if result.success:
            # Track position
            position = Position(
                market_slug=market_slug,
                direction=direction,
                size_usd=size_usd,
                entry_price=result.price or 0.0,
                timestamp=datetime.now(timezone.utc),
                strategy=strategy,
                order_id=result.order_id
            )
            
            self.active_positions[market_slug] = position
            self._save_positions()
            
            # Update daily stats
            self.daily_trades += 1
            
            # Log trade
            trade_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "market": market_slug,
                "direction": direction,
                "size": size_usd,
                "price": result.price,
                "strategy": strategy,
                "reasoning": reasoning,
                "order_id": result.order_id,
                "paper_mode": self.paper_mode
            }
            self._log_trade(trade_data)
            
            print(f"\n✅ Trade executed successfully!")
            print(f"   Order ID: {result.order_id}")
            print(f"   Price: {result.price:.4f}")
            print(f"   Active positions: {len(self.active_positions)}")
        else:
            print(f"\n❌ Trade failed: {result.error}")
        
        print(f"{'='*70}\n")
        
        return result
    
    def close_position(self, market_slug: str, reason: str = "") -> bool:
        """Close an active position"""
        
        if market_slug not in self.active_positions:
            print(f"⚠️ No active position for {market_slug}")
            return False
        
        position = self.active_positions[market_slug]
        
        # Execute opposite trade
        opposite_direction = "DOWN" if position.direction == "UP" else "UP"
        
        result = self.executor.place_order(
            market_slug=market_slug,
            direction=opposite_direction,
            size_usd=position.size_usd,
            order_type="MARKET"
        )
        
        if result.success:
            # Calculate P&L
            pnl = self._calculate_pnl(position, result.price or 0.0)
            
            print(f"\n✅ Position closed: {market_slug}")
            print(f"   Entry: {position.entry_price:.4f}")
            print(f"   Exit: {result.price:.4f}")
            print(f"   P&L: ${pnl:+.2f}")
            
            # Update daily P&L
            self.daily_pnl += pnl
            
            # Remove from active positions
            del self.active_positions[market_slug]
            self._save_positions()
            
            # Log closure
            trade_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "CLOSE",
                "market": market_slug,
                "entry_price": position.entry_price,
                "exit_price": result.price,
                "pnl": pnl,
                "reason": reason
            }
            self._log_trade(trade_data)
            
            return True
        
        return False
    
    def _calculate_pnl(self, position: Position, exit_price: float) -> float:
        """Calculate P&L for a position"""
        
        if position.direction == "UP":
            # Bought YES
            return position.size_usd * ((exit_price - position.entry_price) / position.entry_price)
        else:
            # Bought NO
            return position.size_usd * ((position.entry_price - exit_price) / position.entry_price)
    
    def get_portfolio_status(self) -> Dict:
        """Get current portfolio status"""
        
        total_exposure = sum(p.size_usd for p in self.active_positions.values())
        capital = get_capital()
        
        return {
            "capital": capital,
            "active_positions": len(self.active_positions),
            "total_exposure": total_exposure,
            "utilization_pct": (total_exposure / capital) * 100,
            "daily_trades": self.daily_trades,
            "daily_pnl": self.daily_pnl,
            "paper_mode": self.paper_mode
        }


# ============================================================================
# CLI TESTING
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("⚡ TRADE EXECUTOR TEST")
    print("="*70)
    
    executor = TradeExecutor(paper_mode=True)
    
    # Show portfolio status
    status = executor.get_portfolio_status()
    print(f"\n💼 Portfolio Status:")
    print(f"   Capital: ${status['capital']:.2f}")
    print(f"   Active Positions: {status['active_positions']}")
    print(f"   Exposure: ${status['total_exposure']:.2f} ({status['utilization_pct']:.1f}%)")
    print(f"   Daily Trades: {status['daily_trades']}")
    print(f"   Daily P&L: ${status['daily_pnl']:+.2f}")
    
    # Test trade
    print("\n🧪 Testing trade execution...")
    result = executor.place_trade(
        market_slug="test-market",
        direction="UP",
        size_usd=1.0,
        strategy="test",
        reasoning="Testing the executor"
    )
    
    if result.success:
        print("✅ Test trade successful")
    else:
        print(f"❌ Test trade failed: {result.error}")
    
    print("\n" + "="*70)
