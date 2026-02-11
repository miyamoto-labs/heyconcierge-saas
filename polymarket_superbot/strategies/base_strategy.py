"""
Base Strategy - Abstract class for all trading strategies
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime


@dataclass
class Opportunity:
    """Trading opportunity identified by a strategy"""
    market_slug: str
    question: str
    direction: str  # "UP" or "DOWN"
    size_usd: float
    expected_return_pct: float
    confidence: float  # 0-1 scale
    reasoning: str
    strategy_name: str
    timestamp: datetime
    
    @property
    def expected_value(self) -> float:
        """Expected value = size * return * confidence"""
        return self.size_usd * (self.expected_return_pct / 100) * self.confidence
    
    def __repr__(self) -> str:
        return (f"Opportunity(market={self.market_slug}, "
                f"direction={self.direction}, "
                f"EV=${self.expected_value:.2f})")


class BaseStrategy(ABC):
    """
    Abstract base class for all trading strategies
    """
    
    def __init__(self, name: str, weight: float, enabled: bool = True):
        """
        Args:
            name: Strategy name
            weight: Capital allocation weight (0-1)
            enabled: Whether strategy is active
        """
        self.name = name
        self.weight = weight
        self.enabled = enabled
        
        # Performance tracking
        self.trades_executed = 0
        self.trades_won = 0
        self.trades_lost = 0
        self.total_pnl = 0.0
        self.last_scan_time = None
    
    @abstractmethod
    def scan(self) -> List[Opportunity]:
        """
        Scan for trading opportunities
        
        Returns:
            List of Opportunity objects
        """
        pass
    
    @property
    def win_rate(self) -> float:
        """Calculate win rate"""
        if self.trades_executed == 0:
            return 0.0
        return self.trades_won / self.trades_executed
    
    @property
    def avg_pnl_per_trade(self) -> float:
        """Average P&L per trade"""
        if self.trades_executed == 0:
            return 0.0
        return self.total_pnl / self.trades_executed
    
    def record_trade(self, won: bool, pnl: float):
        """Record trade outcome for performance tracking"""
        self.trades_executed += 1
        
        if won:
            self.trades_won += 1
        else:
            self.trades_lost += 1
        
        self.total_pnl += pnl
    
    def get_performance_summary(self) -> dict:
        """Get strategy performance metrics"""
        return {
            "name": self.name,
            "enabled": self.enabled,
            "weight": self.weight,
            "trades_executed": self.trades_executed,
            "win_rate": self.win_rate,
            "total_pnl": self.total_pnl,
            "avg_pnl_per_trade": self.avg_pnl_per_trade,
            "last_scan": self.last_scan_time.isoformat() if self.last_scan_time else None
        }
    
    def __repr__(self) -> str:
        return (f"{self.__class__.__name__}(weight={self.weight:.1%}, "
                f"trades={self.trades_executed}, "
                f"win_rate={self.win_rate:.1%})")
