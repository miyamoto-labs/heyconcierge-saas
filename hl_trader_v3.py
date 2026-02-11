#!/usr/bin/env python3
"""
Hyperliquid Trading Bot V3 - MoonDev Strategies
Combines: BB Squeeze + Funding Rate Extremes + Volume Capitulation
Based on MoonDev's proven strategies (not HMM filter)
"""

import os
import sys
import json
import time
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import talib
from hyperliquid.exchange import Exchange
from hyperliquid.info import Info

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/erik/.openclaw/workspace/hl_trader_v3.log'),
        logging.StreamHandler()
    ]
)

# Configuration
PRIVATE_KEY = os.getenv('HL_PRIVATE_KEY')
ACCOUNT_ADDRESS = os.getenv('HL_ACCOUNT_ADDRESS')
SYMBOLS = ['BTC', 'ETH', 'SOL']  # Top liquid pairs
POSITION_SIZE_USD = 100  # $100 per trade (MoonDev style: small during testing)
MAX_LEVERAGE = 5  # 5x max (not 40x degeneracy)
STOP_LOSS_PCT = 10  # 10% stop
TAKE_PROFIT_PCT = 10  # 10% take profit
TIME_EXIT_HOURS = 24  # Exit after 24h if no signal

# Strategy toggles
ENABLE_FUNDING_RATE = True  # Fade extreme funding
ENABLE_BB_SQUEEZE = True  # Mean reversion
ENABLE_VOLUME_CAP = True  # Capitulation plays

# Thresholds
FUNDING_EXTREME_THRESHOLD = 1000  # 1000% annualized = extreme
BB_SQUEEZE_THRESHOLD = 0.02  # 2% Bollinger width = tight squeeze
VOLUME_SPIKE_MULTIPLIER = 3  # 3x average volume = capitulation

class HyperliquidTrader:
    def __init__(self):
        self.exchange = Exchange(ACCOUNT_ADDRESS, PRIVATE_KEY)
        self.info = Info()
        self.state_file = '/Users/erik/.openclaw/workspace/hl_trader_v3_state.json'
        self.load_state()
        
    def load_state(self):
        """Load persisted state"""
        try:
            with open(self.state_file, 'r') as f:
                self.state = json.load(f)
        except:
            self.state = {
                'positions': {},
                'last_trades': {},
                'equity_curve': []
            }
            
    def save_state(self):
        """Save state to disk"""
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)
            
    def get_candles(self, symbol, interval='5m', limit=200):
        """Fetch OHLCV data"""
        try:
            import time as time_module
            now_ms = int(time_module.time() * 1000)
            tf_minutes = {'1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60}
            minutes = tf_minutes.get(interval, 5)
            lookback_ms = limit * minutes * 60 * 1000
            start_time = now_ms - lookback_ms
            
            candles = self.info.candles_snapshot(symbol, interval, start_time, now_ms)
            
            if not candles:
                return None
                
            df = pd.DataFrame(candles)
            df.rename(columns={'t': 'time', 'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'}, inplace=True)
            df['time'] = pd.to_datetime(df['time'], unit='ms')
            for col in ['open', 'high', 'low', 'close', 'volume']:
                df[col] = pd.to_numeric(df[col])
            return df
        except Exception as e:
            logging.error(f"Error fetching candles for {symbol}: {e}")
            return None
            
    def get_funding_rate(self, symbol):
        """Get current funding rate (annualized %)"""
        try:
            meta = self.info.meta()
            for asset in meta['universe']:
                if asset['name'] == symbol:
                    funding = float(asset.get('funding', 0))
                    annualized = funding * 365 * 24 * 100  # Convert to annualized %
                    return annualized
            return 0
        except Exception as e:
            logging.error(f"Error fetching funding for {symbol}: {e}")
            return 0
            
    def check_funding_signal(self, symbol, price):
        """MoonDev Strategy: Fade extreme funding"""
        if not ENABLE_FUNDING_RATE:
            return None
            
        funding = self.get_funding_rate(symbol)
        
        # Extreme positive funding → everyone long → FADE (short)
        if funding > FUNDING_EXTREME_THRESHOLD:
            logging.info(f"🔥 EXTREME FUNDING: {symbol} +{funding:.1f}% annualized → FADE (short)")
            return {
                'side': 'sell',
                'reason': f'Extreme funding +{funding:.1f}%',
                'entry': price,
                'stop': price * 1.10,
                'target': price * 0.90
            }
            
        # Extreme negative funding → everyone short → FADE (long)
        if funding < -FUNDING_EXTREME_THRESHOLD:
            logging.info(f"🔥 EXTREME FUNDING: {symbol} {funding:.1f}% annualized → FADE (long)")
            return {
                'side': 'buy',
                'reason': f'Extreme funding {funding:.1f}%',
                'entry': price,
                'stop': price * 0.90,
                'target': price * 1.10
            }
            
        return None
        
    def check_bb_squeeze(self, df, symbol):
        """MoonDev Strategy: BB Squeeze mean reversion"""
        if not ENABLE_BB_SQUEEZE or len(df) < 50:
            return None
            
        # Calculate Bollinger Bands
        upper, middle, lower = talib.BBANDS(df['close'], timeperiod=20, nbdevup=2, nbdevdn=2)
        
        # BB Width (normalized)
        bb_width = (upper.iloc[-1] - lower.iloc[-1]) / middle.iloc[-1]
        
        # Current price position
        price = df['close'].iloc[-1]
        distance_from_middle = (price - middle.iloc[-1]) / middle.iloc[-1]
        
        # Squeeze detected + price outside bands
        if bb_width < BB_SQUEEZE_THRESHOLD:
            # Price below lower band → BUY (mean reversion)
            if price < lower.iloc[-1]:
                logging.info(f"🎯 BB SQUEEZE: {symbol} below lower band, width={bb_width:.3f} → BUY")
                return {
                    'side': 'buy',
                    'reason': f'BB squeeze (width={bb_width:.3f})',
                    'entry': price,
                    'stop': price * 0.90,
                    'target': middle.iloc[-1]  # Target = middle band
                }
                
            # Price above upper band → SELL (mean reversion)
            if price > upper.iloc[-1]:
                logging.info(f"🎯 BB SQUEEZE: {symbol} above upper band, width={bb_width:.3f} → SELL")
                return {
                    'side': 'sell',
                    'reason': f'BB squeeze (width={bb_width:.3f})',
                    'entry': price,
                    'stop': price * 1.10,
                    'target': middle.iloc[-1]  # Target = middle band
                }
                
        return None
        
    def check_volume_capitulation(self, df, symbol):
        """MoonDev Strategy: Volume spike = capitulation"""
        if not ENABLE_VOLUME_CAP or len(df) < 50:
            return None
            
        # Average volume (20 periods)
        avg_volume = df['volume'].rolling(20).mean().iloc[-2]
        current_volume = df['volume'].iloc[-1]
        
        # Volume spike detected
        if current_volume > avg_volume * VOLUME_SPIKE_MULTIPLIER:
            price = df['close'].iloc[-1]
            prev_close = df['close'].iloc[-2]
            
            # Red candle + volume spike = LONG liquidation → BUY
            if price < prev_close:
                logging.info(f"💥 VOLUME CAPITULATION: {symbol} {current_volume/avg_volume:.1f}x volume + red → BUY")
                return {
                    'side': 'buy',
                    'reason': f'Volume capitulation ({current_volume/avg_volume:.1f}x)',
                    'entry': price,
                    'stop': price * 0.90,
                    'target': price * 1.10
                }
                
            # Green candle + volume spike = SHORT liquidation → SELL
            if price > prev_close:
                logging.info(f"💥 VOLUME CAPITULATION: {symbol} {current_volume/avg_volume:.1f}x volume + green → SELL")
                return {
                    'side': 'sell',
                    'reason': f'Volume capitulation ({current_volume/avg_volume:.1f}x)',
                    'entry': price,
                    'stop': price * 1.10,
                    'target': price * 0.90
                }
                
        return None
        
    def place_order(self, symbol, signal):
        """Place limit order (ALWAYS limit orders - MoonDev rule)"""
        try:
            side = signal['side']
            price = signal['entry']
            
            # Calculate position size
            size = POSITION_SIZE_USD / price
            
            # Place LIMIT order at 3rd tick (MoonDev: 3rd-15th tick for cheap fills)
            tick_size = 0.01 if symbol == 'BTC' else 0.001
            limit_price = price - (3 * tick_size) if side == 'buy' else price + (3 * tick_size)
            
            # Place order
            order = self.exchange.order(
                symbol,
                is_buy=(side == 'buy'),
                sz=size,
                limit_px=limit_price,
                reduce_only=False
            )
            
            logging.info(f"✅ ORDER PLACED: {side.upper()} {size:.4f} {symbol} @ ${limit_price:.2f}")
            logging.info(f"   Reason: {signal['reason']}")
            logging.info(f"   Stop: ${signal['stop']:.2f} | Target: ${signal['target']:.2f}")
            
            # Track position
            self.state['positions'][symbol] = {
                'side': side,
                'entry_price': limit_price,
                'entry_time': datetime.now().isoformat(),
                'stop': signal['stop'],
                'target': signal['target'],
                'reason': signal['reason']
            }
            self.save_state()
            
            return True
            
        except Exception as e:
            logging.error(f"❌ Order failed: {e}")
            return False
            
    def check_exits(self, symbol, position, current_price):
        """Check stop loss / take profit / time exit"""
        entry_time = datetime.fromisoformat(position['entry_time'])
        hours_in_trade = (datetime.now() - entry_time).total_seconds() / 3600
        
        # Stop loss hit
        if position['side'] == 'buy' and current_price <= position['stop']:
            logging.info(f"🛑 STOP LOSS: {symbol} ${current_price:.2f} <= ${position['stop']:.2f}")
            return True
            
        if position['side'] == 'sell' and current_price >= position['stop']:
            logging.info(f"🛑 STOP LOSS: {symbol} ${current_price:.2f} >= ${position['stop']:.2f}")
            return True
            
        # Take profit hit
        if position['side'] == 'buy' and current_price >= position['target']:
            logging.info(f"🎯 TAKE PROFIT: {symbol} ${current_price:.2f} >= ${position['target']:.2f}")
            return True
            
        if position['side'] == 'sell' and current_price <= position['target']:
            logging.info(f"🎯 TAKE PROFIT: {symbol} ${current_price:.2f} <= ${position['target']:.2f}")
            return True
            
        # Time exit (24h rule - MoonDev)
        if hours_in_trade >= TIME_EXIT_HOURS:
            logging.info(f"⏰ TIME EXIT: {symbol} held {hours_in_trade:.1f}h (max {TIME_EXIT_HOURS}h)")
            return True
            
        return False
        
    def close_position(self, symbol):
        """Close position (market order for exits)"""
        try:
            position = self.state['positions'].get(symbol)
            if not position:
                return
                
            # Get current position from exchange
            user_state = self.info.user_state(ACCOUNT_ADDRESS)
            for pos in user_state.get('assetPositions', []):
                if pos['position']['coin'] == symbol:
                    size = abs(float(pos['position']['szi']))
                    
                    # Close via reduce-only market order
                    self.exchange.order(
                        symbol,
                        is_buy=(position['side'] == 'sell'),  # Opposite side to close
                        sz=size,
                        limit_px=None,  # Market order for exit
                        reduce_only=True
                    )
                    
                    logging.info(f"✅ CLOSED: {symbol} {position['side']} @ market")
                    
                    # Remove from state
                    del self.state['positions'][symbol]
                    self.save_state()
                    return
                    
        except Exception as e:
            logging.error(f"❌ Close failed for {symbol}: {e}")
            
    def run(self):
        """Main trading loop"""
        logging.info("🚀 Hyperliquid Trader V3 started")
        logging.info(f"Strategies: Funding={ENABLE_FUNDING_RATE}, BB={ENABLE_BB_SQUEEZE}, Volume={ENABLE_VOLUME_CAP}")
        
        scan_count = 0
        
        while True:
            try:
                scan_count += 1
                logging.info(f"\n[Scan #{scan_count}] {datetime.now().strftime('%H:%M:%S')}")
                
                # Check each symbol
                for symbol in SYMBOLS:
                    logging.info(f"📊 Checking {symbol}...")
                    
                    # Skip if already in position
                    if symbol in self.state['positions']:
                        logging.info(f"   Already in {symbol} position, checking exits...")
                        position = self.state['positions'][symbol]
                        df = self.get_candles(symbol)
                        if df is not None and len(df) > 0:
                            current_price = df['close'].iloc[-1]
                            
                            # Check exit conditions
                            if self.check_exits(symbol, position, current_price):
                                self.close_position(symbol)
                        continue
                        
                    # Fetch data
                    logging.info(f"   Fetching {symbol} candles...")
                    df = self.get_candles(symbol)
                    if df is None or len(df) < 50:
                        logging.info(f"   ❌ {symbol}: Not enough data")
                        continue
                    
                    logging.info(f"   ✅ {symbol}: Got {len(df)} candles")
                        
                    current_price = df['close'].iloc[-1]
                    logging.info(f"   Current price: ${current_price:,.2f}")
                    
                    # Check strategies (in priority order)
                    signal = None
                    
                    # 1. Funding rate (highest priority - real edge)
                    logging.info(f"   Checking funding rate...")
                    signal = self.check_funding_signal(symbol, current_price)
                    if signal:
                        logging.info(f"   🔥 Funding signal: {signal['side']}")
                    
                    # 2. BB Squeeze (mean reversion)
                    if not signal:
                        logging.info(f"   Checking BB squeeze...")
                        signal = self.check_bb_squeeze(df, symbol)
                        if signal:
                            logging.info(f"   🎯 BB signal: {signal['side']}")
                        
                    # 3. Volume capitulation (momentum)
                    if not signal:
                        logging.info(f"   Checking volume spike...")
                        signal = self.check_volume_capitulation(df, symbol)
                        if signal:
                            logging.info(f"   💥 Volume signal: {signal['side']}")
                    
                    if not signal:
                        logging.info(f"   ➖ No signals for {symbol}")
                        
                    # Execute signal
                    if signal:
                        self.place_order(symbol, signal)
                        time.sleep(2)  # Avoid rate limits
                        
                # Wait before next scan (5 min bars)
                logging.info(f"Positions: {len(self.state['positions'])}/{len(SYMBOLS)}")
                logging.info(f"💤 Sleeping 300s until next scan...")
                time.sleep(300)  # 5 minutes
                logging.info(f"⏰ Woke up, starting scan #{scan_count + 1}")
                
            except KeyboardInterrupt:
                logging.info("🛑 Shutdown requested")
                break
            except Exception as e:
                logging.error(f"❌ Error in main loop: {e}")
                time.sleep(60)
                
        logging.info("✅ Trader stopped")

if __name__ == '__main__':
    trader = HyperliquidTrader()
    trader.run()
