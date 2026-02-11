#!/usr/bin/env python3
"""
BTC/USD 4H Trading Strategy with Adaptive Market Conditions
Fetches data from Hyperliquid, backtests both trend-following and mean-reversion strategies
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import requests
from typing import Dict, List, Tuple

# Strategy Configuration
INITIAL_CAPITAL = 1000  # Starting capital in USD
POSITION_SIZE = 0.95  # Use 95% of capital per trade
LEVERAGE = 7  # Your current Hyperliquid leverage
MAKER_FEE = 0.0002  # 0.02% maker fee on Hyperliquid
TAKER_FEE = 0.0005  # 0.05% taker fee
SLIPPAGE = 0.0005  # 0.05% slippage estimate

class MarketConditionDetector:
    """Detect if market is trending or ranging"""
    
    @staticmethod
    def calculate_adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate Average Directional Index (ADX) for trend strength"""
        high = df['high']
        low = df['low']
        close = df['close']
        
        # True Range
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(period).mean()
        
        # Directional Movement
        up_move = high - high.shift()
        down_move = low.shift() - low
        
        plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0), index=df.index)
        minus_dm = pd.Series(np.where((down_move > up_move) & (down_move > 0), down_move, 0), index=df.index)
        
        plus_di = 100 * plus_dm.rolling(period).mean() / atr
        minus_di = 100 * minus_dm.rolling(period).mean() / atr
        
        # ADX
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
        adx = dx.rolling(period).mean()
        
        return adx
    
    @staticmethod
    def detect_condition(df: pd.DataFrame) -> pd.Series:
        """
        Detect market condition: TRENDING or RANGING
        
        Logic:
        - ADX > 25: Strong trend (use trend-following)
        - ADX < 20: Ranging market (use mean reversion)
        - 20-25: Transition zone (prefer current strategy)
        """
        adx = MarketConditionDetector.calculate_adx(df)
        
        conditions = []
        for i, adx_val in enumerate(adx):
            if pd.isna(adx_val):
                conditions.append('UNKNOWN')
            elif adx_val > 25:
                conditions.append('TRENDING')
            elif adx_val < 20:
                conditions.append('RANGING')
            else:
                conditions.append('TRANSITION')
        
        return pd.Series(conditions, index=df.index)

class TrendFollowingStrategy:
    """
    Trend Following Strategy for TRENDING markets
    
    Logic:
    - Entry: EMA crossover (faster crosses above slower) + ADX confirmation
    - Exit: Opposite crossover or trailing stop
    - Stop Loss: 2% from entry
    - Take Profit: 3x risk (6% profit target)
    """
    
    @staticmethod
    def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
        """Generate trend-following signals"""
        result = df.copy()
        
        # Calculate EMAs
        result['ema_fast'] = result['close'].ewm(span=12, adjust=False).mean()
        result['ema_slow'] = result['close'].ewm(span=26, adjust=False).mean()
        
        # ADX for trend strength
        result['adx'] = MarketConditionDetector.calculate_adx(result)
        
        # Crossover signals
        result['ema_cross'] = 0
        result.loc[result['ema_fast'] > result['ema_slow'], 'ema_cross'] = 1
        result.loc[result['ema_fast'] < result['ema_slow'], 'ema_cross'] = -1
        
        # Generate signals (only when ADX confirms trend)
        result['signal'] = 0
        
        # Long entry: Fast EMA crosses above slow EMA + ADX > 20
        long_condition = (
            (result['ema_cross'] == 1) & 
            (result['ema_cross'].shift() != 1) &
            (result['adx'] > 20)
        )
        result.loc[long_condition, 'signal'] = 1
        
        # Short entry: Fast EMA crosses below slow EMA + ADX > 20
        short_condition = (
            (result['ema_cross'] == -1) & 
            (result['ema_cross'].shift() != -1) &
            (result['adx'] > 20)
        )
        result.loc[short_condition, 'signal'] = -1
        
        return result

class MeanReversionStrategy:
    """
    Mean Reversion Strategy for RANGING markets
    
    Logic:
    - Entry: Price touches Bollinger Band + RSI extreme
    - Exit: Return to middle band or opposite extreme
    - Stop Loss: Beyond opposite band
    - Take Profit: Middle band
    """
    
    @staticmethod
    def generate_signals(df: pd.DataFrame) -> pd.DataFrame:
        """Generate mean-reversion signals"""
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
        
        # Generate signals
        result['signal'] = 0
        
        # Long entry: Price touches lower band + RSI oversold
        long_condition = (
            (result['close'] <= result['bb_lower']) &
            (result['rsi'] < 30)
        )
        result.loc[long_condition, 'signal'] = 1
        
        # Short entry: Price touches upper band + RSI overbought
        short_condition = (
            (result['close'] >= result['bb_upper']) &
            (result['rsi'] > 70)
        )
        result.loc[short_condition, 'signal'] = -1
        
        return result

class AdaptiveBacktester:
    """
    Backtest engine that switches between strategies based on market conditions
    """
    
    def __init__(self, df: pd.DataFrame, initial_capital: float = 1000):
        self.df = df
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.position = 0  # 1 = long, -1 = short, 0 = flat
        self.entry_price = 0
        self.trades = []
        self.equity_curve = []
        
    def backtest(self) -> Dict:
        """Run adaptive backtest"""
        
        # Detect market conditions
        self.df['condition'] = MarketConditionDetector.detect_condition(self.df)
        
        # Generate signals for both strategies
        trend_signals = TrendFollowingStrategy.generate_signals(self.df)
        range_signals = MeanReversionStrategy.generate_signals(self.df)
        
        # Run through each candle
        for i in range(len(self.df)):
            if i < 50:  # Skip warm-up period
                self.equity_curve.append(self.capital)
                continue
            
            row = self.df.iloc[i]
            condition = row['condition']
            
            # Choose strategy based on market condition
            if condition == 'TRENDING':
                signal = trend_signals.iloc[i]['signal']
                strategy_used = 'TREND'
            elif condition == 'RANGING':
                signal = range_signals.iloc[i]['signal']
                strategy_used = 'RANGE'
            else:
                signal = 0
                strategy_used = 'NONE'
            
            # Execute trades
            if self.position == 0 and signal != 0:
                # Enter position
                self.enter_position(row, signal, strategy_used)
            elif self.position != 0:
                # Check exit conditions
                self.check_exit(row, trend_signals.iloc[i], range_signals.iloc[i])
            
            # Track equity
            current_equity = self.calculate_equity(row['close'])
            self.equity_curve.append(current_equity)
        
        # Close any open position
        if self.position != 0:
            self.exit_position(self.df.iloc[-1], 'END')
        
        return self.calculate_metrics()
    
    def enter_position(self, row, signal, strategy):
        """Enter a long or short position"""
        self.position = signal
        self.entry_price = row['close']
        
        # Calculate position size (with leverage)
        size = (self.capital * POSITION_SIZE * LEVERAGE) / self.entry_price
        
        # Deduct fees
        fee = self.capital * POSITION_SIZE * TAKER_FEE
        self.capital -= fee
        
        self.trades.append({
            'entry_time': row.name,
            'entry_price': self.entry_price,
            'direction': 'LONG' if signal == 1 else 'SHORT',
            'size': size,
            'strategy': strategy,
            'fee': fee
        })
    
    def check_exit(self, row, trend_row, range_row):
        """Check if we should exit current position"""
        # Simple exit: opposite signal or stop loss
        should_exit = False
        exit_reason = ''
        
        if self.position == 1:  # Long position
            # Stop loss: 2% below entry
            if row['close'] < self.entry_price * 0.98:
                should_exit = True
                exit_reason = 'STOP_LOSS'
            # Take profit: 6% above entry
            elif row['close'] > self.entry_price * 1.06:
                should_exit = True
                exit_reason = 'TAKE_PROFIT'
            # Opposite signal
            elif trend_row['signal'] == -1 or range_row['signal'] == -1:
                should_exit = True
                exit_reason = 'SIGNAL'
        
        elif self.position == -1:  # Short position
            # Stop loss: 2% above entry
            if row['close'] > self.entry_price * 1.02:
                should_exit = True
                exit_reason = 'STOP_LOSS'
            # Take profit: 6% below entry
            elif row['close'] < self.entry_price * 0.94:
                should_exit = True
                exit_reason = 'TAKE_PROFIT'
            # Opposite signal
            elif trend_row['signal'] == 1 or range_row['signal'] == 1:
                should_exit = True
                exit_reason = 'SIGNAL'
        
        if should_exit:
            self.exit_position(row, exit_reason)
    
    def exit_position(self, row, reason):
        """Exit current position"""
        exit_price = row['close']
        
        # Calculate P&L
        if self.position == 1:  # Long
            pnl_pct = (exit_price - self.entry_price) / self.entry_price
        else:  # Short
            pnl_pct = (self.entry_price - exit_price) / self.entry_price
        
        # Apply leverage
        pnl_pct *= LEVERAGE
        
        # Deduct fees
        fee = self.capital * POSITION_SIZE * TAKER_FEE
        pnl = (self.capital * POSITION_SIZE * pnl_pct) - fee
        
        self.capital += pnl
        
        # Update last trade
        self.trades[-1].update({
            'exit_time': row.name,
            'exit_price': exit_price,
            'exit_reason': reason,
            'pnl': pnl,
            'pnl_pct': pnl_pct * 100,
            'exit_fee': fee
        })
        
        self.position = 0
        self.entry_price = 0
    
    def calculate_equity(self, current_price):
        """Calculate current equity including unrealized P&L"""
        if self.position == 0:
            return self.capital
        
        # Calculate unrealized P&L
        if self.position == 1:
            pnl_pct = (current_price - self.entry_price) / self.entry_price
        else:
            pnl_pct = (self.entry_price - current_price) / self.entry_price
        
        pnl_pct *= LEVERAGE
        unrealized_pnl = self.capital * POSITION_SIZE * pnl_pct
        
        return self.capital + unrealized_pnl
    
    def calculate_metrics(self) -> Dict:
        """Calculate comprehensive backtest metrics"""
        
        # Filter completed trades
        completed_trades = [t for t in self.trades if 'pnl' in t]
        
        if not completed_trades:
            return {'error': 'No completed trades'}
        
        # Basic metrics
        total_trades = len(completed_trades)
        winning_trades = [t for t in completed_trades if t['pnl'] > 0]
        losing_trades = [t for t in completed_trades if t['pnl'] <= 0]
        
        win_rate = len(winning_trades) / total_trades * 100 if total_trades > 0 else 0
        
        total_pnl = sum(t['pnl'] for t in completed_trades)
        avg_win = np.mean([t['pnl'] for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t['pnl'] for t in losing_trades]) if losing_trades else 0
        
        # Calculate returns
        equity_series = pd.Series(self.equity_curve)
        returns = equity_series.pct_change().dropna()
        
        # Sharpe Ratio (annualized, assuming 4h candles = 6 per day = 2190 per year)
        sharpe = returns.mean() / returns.std() * np.sqrt(2190) if returns.std() > 0 else 0
        
        # Max Drawdown
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min() * 100
        
        # Profit Factor
        gross_profit = sum(t['pnl'] for t in winning_trades) if winning_trades else 0
        gross_loss = abs(sum(t['pnl'] for t in losing_trades)) if losing_trades else 1
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Strategy breakdown
        trend_trades = [t for t in completed_trades if t.get('strategy') == 'TREND']
        range_trades = [t for t in completed_trades if t.get('strategy') == 'RANGE']
        
        return {
            'total_return_pct': (self.capital - self.initial_capital) / self.initial_capital * 100,
            'final_capital': self.capital,
            'total_trades': total_trades,
            'win_rate': win_rate,
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'total_pnl': total_pnl,
            'sharpe_ratio': sharpe,
            'max_drawdown_pct': max_drawdown,
            'profit_factor': profit_factor,
            'trend_trades': len(trend_trades),
            'range_trades': len(range_trades),
            'equity_curve': self.equity_curve,
            'trades': completed_trades
        }

def fetch_hyperliquid_data(symbol: str = "BTC", interval: str = "4h", lookback_days: int = 730) -> pd.DataFrame:
    """
    Fetch historical candle data from Hyperliquid
    
    Args:
        symbol: Trading pair (BTC, ETH, etc.)
        interval: Candle interval (1m, 5m, 15m, 1h, 4h, 1d)
        lookback_days: Days of history to fetch
    
    Returns:
        DataFrame with OHLCV data
    """
    print(f"📊 Fetching {lookback_days} days of {symbol} {interval} data from Hyperliquid...")
    
    # Hyperliquid Info API
    url = "https://api.hyperliquid.xyz/info"
    
    # Calculate timestamps
    end_time = int(datetime.now().timestamp() * 1000)
    start_time = int((datetime.now() - timedelta(days=lookback_days)).timestamp() * 1000)
    
    payload = {
        "type": "candleSnapshot",
        "req": {
            "coin": symbol,
            "interval": interval,
            "startTime": start_time,
            "endTime": end_time
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            print("❌ No data returned from Hyperliquid")
            return None
        
        # Convert to DataFrame (Hyperliquid returns dict format)
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['t'], unit='ms')
        df = df.set_index('timestamp')
        
        # Rename columns
        df = df.rename(columns={'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'})
        
        # Keep only OHLCV
        df = df[['open', 'high', 'low', 'close', 'volume']]
        
        # Convert to float
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = df[col].astype(float)
        
        print(f"✅ Fetched {len(df)} candles from {df.index[0]} to {df.index[-1]}")
        return df
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return None

def run_backtest_comparison():
    """Run and compare both strategies"""
    print("="*80)
    print("BTC/USD 4H TRADING STRATEGY BACKTEST")
    print("="*80)
    print()
    
    # Fetch data
    df = fetch_hyperliquid_data("BTC", "4h", lookback_days=730)
    
    if df is None or len(df) < 100:
        print("❌ Insufficient data for backtest")
        return
    
    print()
    print("🧪 Running Adaptive Backtest (Trend + Range strategies)...")
    print()
    
    # Run backtest
    backtester = AdaptiveBacktester(df, INITIAL_CAPITAL)
    results = backtester.backtest()
    
    if 'error' in results:
        print(f"❌ Backtest failed: {results['error']}")
        return
    
    # Display results
    print("="*80)
    print("📊 BACKTEST RESULTS")
    print("="*80)
    print()
    print(f"💰 Initial Capital: ${INITIAL_CAPITAL:,.2f}")
    print(f"💰 Final Capital: ${results['final_capital']:,.2f}")
    print(f"📈 Total Return: {results['total_return_pct']:.2f}%")
    print(f"📊 Total P&L: ${results['total_pnl']:,.2f}")
    print()
    print(f"🎯 Total Trades: {results['total_trades']}")
    print(f"✅ Winning Trades: {results['winning_trades']}")
    print(f"❌ Losing Trades: {results['losing_trades']}")
    print(f"📈 Win Rate: {results['win_rate']:.2f}%")
    print()
    print(f"💵 Average Win: ${results['avg_win']:.2f}")
    print(f"💸 Average Loss: ${results['avg_loss']:.2f}")
    print(f"⚖️  Profit Factor: {results['profit_factor']:.2f}")
    print()
    print(f"📊 Sharpe Ratio: {results['sharpe_ratio']:.2f}")
    print(f"📉 Max Drawdown: {results['max_drawdown_pct']:.2f}%")
    print()
    print(f"🔹 Trend Strategy Trades: {results['trend_trades']}")
    print(f"🔸 Range Strategy Trades: {results['range_trades']}")
    print()
    print("="*80)
    
    # Save results
    with open('/Users/erik/.openclaw/workspace/backtest_results.json', 'w') as f:
        # Remove equity curve for JSON (too large)
        results_copy = results.copy()
        results_copy.pop('equity_curve', None)
        json.dump(results_copy, f, indent=2, default=str)
    
    print()
    print("💾 Full results saved to: backtest_results.json")
    
    return results

if __name__ == "__main__":
    results = run_backtest_comparison()
