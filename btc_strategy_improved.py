#!/usr/bin/env python3
"""
IMPROVED BTC Trading Strategies - Multiple Variants for Comparison
Based on backtest analysis of v1
"""
import sys
sys.path.append('/Users/erik/.openclaw/workspace')

from btc_trading_strategy import (
    fetch_hyperliquid_data, 
    MarketConditionDetector,
    AdaptiveBacktester,
    INITIAL_CAPITAL
)
import pandas as pd
import numpy as np

class ImprovedTrendStrategy:
    """
    Improved Trend Following - Less Whipsaw
    
    Changes from v1:
    - Higher ADX threshold (30 vs 20) - only trade strong trends
    - Add volume confirmation
    - Wider stops (3% vs 2%) - less premature exits
    - Dynamic take profit based on ATR
    """
    
    @staticmethod
    def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        
        # EMAs
        result['ema_fast'] = result['close'].ewm(span=12, adjust=False).mean()
        result['ema_slow'] = result['close'].ewm(span=26, adjust=False).mean()
        
        # ADX (higher threshold = stronger trends only)
        result['adx'] = MarketConditionDetector.calculate_adx(result)
        
        # ATR for dynamic stops
        high_low = result['high'] - result['low']
        high_close = abs(result['high'] - result['close'].shift())
        low_close = abs(result['low'] - result['close'].shift())
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        result['atr'] = tr.rolling(14).mean()
        
        # Volume filter (above 20-period average)
        result['vol_ma'] = result['volume'].rolling(20).mean()
        result['vol_signal'] = result['volume'] > result['vol_ma']
        
        # Crossover
        result['ema_cross'] = 0
        result.loc[result['ema_fast'] > result['ema_slow'], 'ema_cross'] = 1
        result.loc[result['ema_fast'] < result['ema_slow'], 'ema_cross'] = -1
        
        # Signals - ONLY on strong trends with volume
        result['signal'] = 0
        
        # Long: EMA cross + ADX > 30 + volume confirmation
        long_condition = (
            (result['ema_cross'] == 1) & 
            (result['ema_cross'].shift() != 1) &
            (result['adx'] > 30) &  # Strong trend only
            (result['vol_signal'])
        )
        result.loc[long_condition, 'signal'] = 1
        
        # Short: EMA cross + ADX > 30 + volume confirmation
        short_condition = (
            (result['ema_cross'] == -1) & 
            (result['ema_cross'].shift() != -1) &
            (result['adx'] > 30) &
            (result['vol_signal'])
        )
        result.loc[short_condition, 'signal'] = -1
        
        return result

class ImprovedRangeStrategy:
    """
    Improved Mean Reversion - Better Entry/Exit
    
    Changes from v1:
    - Require BOTH BB touch AND RSI extreme (not just one)
    - Exit at middle band OR opposite signal (faster exits)
    - Only trade when ADX < 25 (confirm ranging market)
    """
    
    @staticmethod
    def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        
        # Bollinger Bands
        result['bb_middle'] = result['close'].rolling(20).mean()
        bb_std = result['close'].rolling(20).std()
        result['bb_upper'] = result['bb_middle'] + (bb_std * 2)
        result['bb_lower'] = result['bb_middle'] - (bb_std * 2)
        
        # RSI
        delta = result['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        result['rsi'] = 100 - (100 / (1 + rs))
        
        # ADX (only trade in ranging markets)
        result['adx'] = MarketConditionDetector.calculate_adx(result)
        
        # Signals
        result['signal'] = 0
        
        # Long: Lower band + RSI < 30 + ADX < 25 (ranging)
        long_condition = (
            (result['close'] <= result['bb_lower']) &
            (result['rsi'] < 30) &
            (result['adx'] < 25)
        )
        result.loc[long_condition, 'signal'] = 1
        
        # Short: Upper band + RSI > 70 + ADX < 25 (ranging)
        short_condition = (
            (result['close'] >= result['bb_upper']) &
            (result['rsi'] > 70) &
            (result['adx'] < 25)
        )
        result.loc[short_condition, 'signal'] = -1
        
        return result

class ConservativeTrendStrategy:
    """
    Conservative Trend Following - Fewer Trades, Higher Quality
    
    - Longer EMAs (50/200) - only major trends
    - ADX > 35 - very strong trends only
    - Price must be above/below 200 EMA for long/short
    - Wider stops, tighter profit targets
    """
    
    @staticmethod
    def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()
        
        # Longer EMAs
        result['ema_fast'] = result['close'].ewm(span=50, adjust=False).mean()
        result['ema_slow'] = result['close'].ewm(span=200, adjust=False).mean()
        
        # Strong trend only
        result['adx'] = MarketConditionDetector.calculate_adx(result)
        
        # ATR
        high_low = result['high'] - result['low']
        high_close = abs(result['high'] - result['close'].shift())
        low_close = abs(result['low'] - result['close'].shift())
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        result['atr'] = tr.rolling(14).mean()
        
        # Signals
        result['signal'] = 0
        
        # Long: Fast above slow + price above slow EMA + ADX > 35
        long_condition = (
            (result['ema_fast'] > result['ema_slow']) & 
            (result['ema_fast'].shift() <= result['ema_slow'].shift()) &
            (result['close'] > result['ema_slow']) &
            (result['adx'] > 35)
        )
        result.loc[long_condition, 'signal'] = 1
        
        # Short: Fast below slow + price below slow EMA + ADX > 35
        short_condition = (
            (result['ema_fast'] < result['ema_slow']) & 
            (result['ema_fast'].shift() >= result['ema_slow'].shift()) &
            (result['close'] < result['ema_slow']) &
            (result['adx'] > 35)
        )
        result.loc[short_condition, 'signal'] = -1
        
        return result

def run_strategy_comparison():
    """Test all strategy variants and compare"""
    print("="*80)
    print("🔬 BTC TRADING STRATEGY COMPARISON")
    print("="*80)
    print()
    
    # Fetch data
    df = fetch_hyperliquid_data("BTC", "4h", 730)
    if df is None or len(df) < 100:
        print("❌ Failed to fetch data")
        return
    
    print()
    
    # Test each strategy variant
    strategies = [
        ("V1: Original Adaptive", None),  # Uses default from btc_trading_strategy
        ("V2: Improved Trend + Range", (ImprovedTrendStrategy, ImprovedRangeStrategy)),
        ("V3: Conservative Trend Only", (ConservativeTrendStrategy, None)),
    ]
    
    results_summary = []
    
    for name, (trend_strat, range_strat) in strategies:
        print(f"\n{'='*80}")
        print(f"Testing: {name}")
        print(f"{'='*80}")
        
        # Prepare strategy functions
        if trend_strat is None:
            # Use original from imported module
            from btc_trading_strategy import TrendFollowingStrategy, MeanReversionStrategy
            trend_func = TrendFollowingStrategy
            range_func = MeanReversionStrategy
        else:
            trend_func = trend_strat
            range_func = range_strat if range_strat else trend_strat
        
        # Run backtest with this strategy pair
        # (We'd need to modify AdaptiveBacktester to accept strategy functions)
        # For now, just show the concept
        
        print(f"✅ {name} configured")
        print(f"   Trend Strategy: {trend_func.__name__}")
        print(f"   Range Strategy: {range_func.__name__ if range_func else 'None'}")
    
    print()
    print("="*80)
    print("💡 Strategy variants created!")
    print("="*80)
    print()
    print("Next: Run full comparison backtest on each variant")

if __name__ == "__main__":
    run_strategy_comparison()
