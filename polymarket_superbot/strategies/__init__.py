"""
Trading strategies for Polymarket Superbot
"""

from .base_strategy import BaseStrategy, Opportunity
from .llm_forecast import LLMForecastStrategy
from .whale_copy import WhaleCopyStrategy
from .low_risk_bond import LowRiskBondStrategy
from .news_scalp import NewsScalpStrategy
from .domain_specialist import DomainSpecialistStrategy

__all__ = [
    "BaseStrategy",
    "Opportunity",
    "LLMForecastStrategy",
    "WhaleCopyStrategy",
    "LowRiskBondStrategy",
    "NewsScalpStrategy",
    "DomainSpecialistStrategy"
]
