#!/usr/bin/env python3
"""
BTC Trend-Following Bot for Hyperliquid
Uses RSI, MACD, and moving averages to identify trends
"""

import json
import time
from datetime import datetime, timedelta
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

class BTCTrendBot:
    def __init__(self, paper_mode=True):
        """Initialize bot"""
        self.paper_mode = paper_mode
        
        # Load config
        with open('.hyperliquid_config.json', 'r') as f:
            config = json.load(f)
        
        self.main_wallet = config['public_wallet']
        self.api_key = config['api_private_key']
        
        # Initialize Hyperliquid clients
        self.info = Info(skip_ws=True)
        if not paper_mode:
            account = Account.from_key(self.api_key)
            self.exchange = Exchange(account)
        else:
            self.exchange = None
        
        # Trading params
        self.position_size = 15  # USD
        self.leverage = 10
        self.stop_loss_pct = 0.03  # 3% stop loss
        self.take_profit_pct = 0.06  # 6% take profit
        
        # No need for Telegram config - OpenClaw handles it
    
    def get_market_data(self, hours=24):
        """Fetch BTC price data from Hyperliquid"""
        try:
            # Get current price
            meta = self.info.meta()
            all_mids = self.info.all_mids()
            
            btc_price = float(all_mids['BTC'])
            
            # Get candle data for analysis
            now = int(time.time() * 1000)
            start = now - (hours * 60 * 60 * 1000)
            
            candles = self.info.candles_snapshot('BTC', '1h', start, now)
            
            return {
                'price': btc_price,
                'candles': candles
            }
        except Exception as e:
            print(f"❌ Error fetching market data: {e}")
            return None
    
    def calculate_rsi(self, prices, period=14):
        """Calculate RSI indicator"""
        if len(prices) < period:
            return None
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def calculate_macd(self, prices, fast=12, slow=26, signal=9):
        """Calculate MACD indicator"""
        if len(prices) < slow:
            return None, None
        
        # Simple EMA calculation
        def ema(data, period):
            multiplier = 2 / (period + 1)
            ema_values = [sum(data[:period]) / period]
            for price in data[period:]:
                ema_values.append((price - ema_values[-1]) * multiplier + ema_values[-1])
            return ema_values[-1]
        
        fast_ema = ema(prices, fast)
        slow_ema = ema(prices, slow)
        macd_line = fast_ema - slow_ema
        
        # For simplicity, using basic signal calculation
        signal_line = macd_line * 0.9  # Simplified
        
        return macd_line, signal_line
    
    def calculate_moving_averages(self, prices):
        """Calculate 20 and 50 period moving averages"""
        ma20 = sum(prices[-20:]) / 20 if len(prices) >= 20 else None
        ma50 = sum(prices[-50:]) / 50 if len(prices) >= 50 else None
        return ma20, ma50
    
    def analyze_trend(self, market_data):
        """Analyze market and generate signal"""
        if not market_data or not market_data['candles']:
            return None
        
        # Extract closing prices
        closes = [float(c['c']) for c in market_data['candles']]
        current_price = market_data['price']
        
        if len(closes) < 50:
            print("⚠️  Insufficient data for analysis")
            return None
        
        # Calculate indicators
        rsi = self.calculate_rsi(closes)
        macd, macd_signal = self.calculate_macd(closes)
        ma20, ma50 = self.calculate_moving_averages(closes)
        
        print(f"\n📊 Technical Analysis:")
        print(f"  Current Price: ${current_price:,.2f}")
        print(f"  RSI: {rsi:.2f}")
        print(f"  MACD: {macd:.4f} | Signal: {macd_signal:.4f}")
        print(f"  MA20: ${ma20:,.2f} | MA50: ${ma50:,.2f}")
        
        # Generate signal
        signal = {
            'action': None,
            'price': current_price,
            'rsi': rsi,
            'macd': macd,
            'macd_signal': macd_signal,
            'ma20': ma20,
            'ma50': ma50,
            'reasons': []
        }
        
        # LONG signal conditions
        long_signals = 0
        if rsi < 40:  # Oversold
            signal['reasons'].append("RSI oversold (<40)")
            long_signals += 1
        if macd > macd_signal:  # MACD bullish
            signal['reasons'].append("MACD bullish crossover")
            long_signals += 1
        if current_price > ma20 and ma20 > ma50:  # Uptrend
            signal['reasons'].append("Price above MA20, MA20 above MA50 (uptrend)")
            long_signals += 1
        
        # SHORT signal conditions
        short_signals = 0
        if rsi > 60:  # Overbought
            signal['reasons'].append("RSI overbought (>60)")
            short_signals += 1
        if macd < macd_signal:  # MACD bearish
            signal['reasons'].append("MACD bearish crossover")
            short_signals += 1
        if current_price < ma20 and ma20 < ma50:  # Downtrend
            signal['reasons'].append("Price below MA20, MA20 below MA50 (downtrend)")
            short_signals += 1
        
        # Decision logic (need 2/3 signals)
        if long_signals >= 2:
            signal['action'] = 'LONG'
        elif short_signals >= 2:
            signal['action'] = 'SHORT'
        else:
            signal['action'] = None
            signal['reasons'] = ["No strong trend detected (need 2/3 signals)"]
        
        return signal
    
    def check_existing_position(self):
        """Check if we already have a BTC position"""
        try:
            state = self.info.user_state(self.main_wallet)
            for asset in state.get('assetPositions', []):
                if asset['position']['coin'] == 'BTC':
                    position = asset['position']
                    return {
                        'exists': True,
                        'size': float(position['szi']),
                        'entry_price': float(position['entryPx']),
                        'side': 'LONG' if float(position['szi']) > 0 else 'SHORT'
                    }
            return {'exists': False}
        except Exception as e:
            print(f"❌ Error checking position: {e}")
            return {'exists': False}
    
    def send_telegram_alert(self, signal, position_info):
        """Send trade alert to Telegram via OpenClaw"""
        mode = "📝 PAPER MODE" if self.paper_mode else "💰 LIVE TRADING"
        
        message = f"{mode}\n\n"
        message += f"🚨 BTC {signal['action']} Signal Detected!\n\n"
        message += f"💰 Entry Price: ${signal['price']:,.2f}\n"
        message += f"📊 Position Size: ${self.position_size} (${self.position_size * self.leverage:,.0f} exposure)\n"
        message += f"⚡️ Leverage: {self.leverage}x\n\n"
        
        message += f"📈 Technical Indicators:\n"
        message += f"  RSI: {signal['rsi']:.2f}\n"
        message += f"  MACD: {signal['macd']:.4f}\n"
        message += f"  MA20: ${signal['ma20']:,.2f}\n"
        message += f"  MA50: ${signal['ma50']:,.2f}\n\n"
        
        message += f"🎯 Trade Plan:\n"
        if signal['action'] == 'LONG':
            sl_price = signal['price'] * (1 - self.stop_loss_pct)
            tp_price = signal['price'] * (1 + self.take_profit_pct)
        else:
            sl_price = signal['price'] * (1 + self.stop_loss_pct)
            tp_price = signal['price'] * (1 - self.take_profit_pct)
        
        message += f"  Stop Loss: ${sl_price:,.2f} ({self.stop_loss_pct*100}%)\n"
        message += f"  Take Profit: ${tp_price:,.2f} ({self.take_profit_pct*100}%)\n\n"
        
        message += f"💡 Reasons:\n"
        for reason in signal['reasons']:
            message += f"  • {reason}\n"
        
        message += f"\n⏸️  This is a signal only - no auto-execute"
        
        # Output for OpenClaw to send via Telegram
        print("\n" + "="*70)
        print("TELEGRAM_ALERT")
        print(message)
        print("="*70)
    
    def run(self):
        """Main bot loop"""
        print(f"\n{'='*60}")
        print(f"🤖 BTC Trend Bot - {'PAPER MODE' if self.paper_mode else 'LIVE TRADING'}")
        print(f"{'='*60}")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check existing position
        position = self.check_existing_position()
        if position['exists']:
            print(f"\n⚠️  Existing {position['side']} position detected:")
            print(f"  Size: {position['size']}")
            print(f"  Entry: ${position['entry_price']:,.2f}")
            print(f"  Skipping new signal generation")
            return
        
        # Fetch market data
        print("\n📡 Fetching market data...")
        market_data = self.get_market_data(hours=72)
        
        if not market_data:
            print("❌ Failed to fetch market data")
            return
        
        # Analyze trend
        signal = self.analyze_trend(market_data)
        
        if not signal:
            print("\n⚠️  Analysis failed")
            return
        
        if signal['action']:
            print(f"\n✅ {signal['action']} signal generated!")
            self.send_telegram_alert(signal, position)
        else:
            print(f"\n⏸️  No trade signal")
            print(f"  Reason: {signal['reasons'][0]}")
        
        print(f"\n{'='*60}\n")

if __name__ == '__main__':
    # Run in paper mode by default
    bot = BTCTrendBot(paper_mode=True)
    bot.run()
