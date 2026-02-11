#!/usr/bin/env python3
"""
BTC Daily Position Bot for Hyperliquid
Conservative major trend captures with wider stops
"""

import json
import time
from datetime import datetime
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

class BTCPositionDaily:
    def __init__(self, paper_mode=True):
        """Initialize position trader"""
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
        
        # Trading params - CONSERVATIVE for daily
        self.position_size = 15  # USD
        self.leverage = 7  # Lower leverage for longer holds
        self.stop_loss_pct = 0.05  # 5% stop loss (wider)
        self.take_profit_pct = 0.10  # 10% take profit (bigger targets)
    
    def get_market_data(self, days=30):
        """Fetch BTC daily candle data"""
        try:
            meta = self.info.meta()
            all_mids = self.info.all_mids()
            btc_price = float(all_mids['BTC'])
            
            # Get daily candles
            now = int(time.time() * 1000)
            start = now - (days * 24 * 60 * 60 * 1000)
            candles = self.info.candles_snapshot('BTC', '1d', start, now)
            
            return {
                'price': btc_price,
                'candles': candles
            }
        except Exception as e:
            print(f"❌ Error fetching market data: {e}")
            return None
    
    def calculate_rsi(self, prices, period=14):
        """Calculate RSI"""
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
        """Calculate MACD"""
        if len(prices) < slow:
            return None, None
        
        def ema(data, period):
            multiplier = 2 / (period + 1)
            ema_values = [sum(data[:period]) / period]
            for price in data[period:]:
                ema_values.append((price - ema_values[-1]) * multiplier + ema_values[-1])
            return ema_values[-1]
        
        fast_ema = ema(prices, fast)
        slow_ema = ema(prices, slow)
        macd_line = fast_ema - slow_ema
        signal_line = macd_line * 0.9
        
        return macd_line, signal_line
    
    def calculate_moving_averages(self, prices):
        """Calculate 50 and 100 period MAs (slower for position trading)"""
        ma50 = sum(prices[-50:]) / 50 if len(prices) >= 50 else None
        ma100 = sum(prices[-100:]) / 100 if len(prices) >= 100 else None
        return ma50, ma100
    
    def analyze_trend(self, market_data):
        """Analyze market - MORE CONSERVATIVE for daily"""
        if not market_data or not market_data['candles']:
            return None
        
        closes = [float(c['c']) for c in market_data['candles']]
        current_price = market_data['price']
        
        if len(closes) < 100:
            print("⚠️  Insufficient data for daily analysis")
            return None
        
        # Calculate indicators
        rsi = self.calculate_rsi(closes)
        macd, macd_signal = self.calculate_macd(closes)
        ma50, ma100 = self.calculate_moving_averages(closes)
        
        print(f"\n📊 Daily Position Analysis:")
        print(f"  Current Price: ${current_price:,.2f}")
        print(f"  RSI: {rsi:.2f}")
        print(f"  MACD: {macd:.4f} | Signal: {macd_signal:.4f}")
        print(f"  MA50: ${ma50:,.2f} | MA100: ${ma100:,.2f}")
        
        signal = {
            'action': None,
            'price': current_price,
            'rsi': rsi,
            'macd': macd,
            'macd_signal': macd_signal,
            'ma50': ma50,
            'ma100': ma100,
            'reasons': []
        }
        
        # LONG signals (stricter thresholds for major reversals)
        long_signals = 0
        if rsi < 35:  # Very oversold
            signal['reasons'].append("RSI very oversold (<35) - major reversal opportunity")
            long_signals += 1
        if macd > macd_signal:
            signal['reasons'].append("MACD bullish crossover on daily")
            long_signals += 1
        if current_price > ma50 and ma50 > ma100:
            signal['reasons'].append("Price above MA50, MA50 above MA100 (strong uptrend)")
            long_signals += 1
        
        # SHORT signals
        short_signals = 0
        if rsi > 65:  # Very overbought
            signal['reasons'].append("RSI very overbought (>65) - major reversal opportunity")
            short_signals += 1
        if macd < macd_signal:
            signal['reasons'].append("MACD bearish crossover on daily")
            short_signals += 1
        if current_price < ma50 and ma50 < ma100:
            signal['reasons'].append("Price below MA50, MA50 below MA100 (strong downtrend)")
            short_signals += 1
        
        # Need 2/3 signals (same requirement but stricter thresholds)
        if long_signals >= 2:
            signal['action'] = 'LONG'
        elif short_signals >= 2:
            signal['action'] = 'SHORT'
        else:
            signal['action'] = None
            signal['reasons'] = ["No major trend reversal detected (need 2/3 signals)"]
        
        return signal
    
    def check_existing_position(self):
        """Check for existing BTC position"""
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
        """Output alert for OpenClaw to send"""
        mode = "📝 PAPER MODE" if self.paper_mode else "💰 LIVE TRADING"
        
        message = f"{mode}\n\n"
        message += f"🎯 BTC {signal['action']} Signal (Daily Position)\n\n"
        message += f"💰 Entry Price: ${signal['price']:,.2f}\n"
        message += f"📊 Position Size: ${self.position_size} (${self.position_size * self.leverage:,.0f} exposure)\n"
        message += f"⚡️ Leverage: {self.leverage}x\n\n"
        
        message += f"📈 Daily Technical Indicators:\n"
        message += f"  RSI: {signal['rsi']:.2f}\n"
        message += f"  MACD: {signal['macd']:.4f}\n"
        message += f"  MA50: ${signal['ma50']:,.2f}\n"
        message += f"  MA100: ${signal['ma100']:,.2f}\n\n"
        
        message += f"🎯 Position Trading Plan:\n"
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
        
        message += f"\n⏸️  Signal only - no auto-execute\n"
        message += f"🎯 Daily timeframe (major trend reversal)"
        
        print("\n" + "="*70)
        print("TELEGRAM_ALERT")
        print(message)
        print("="*70)
    
    def run(self):
        """Main bot loop"""
        print(f"\n{'='*60}")
        print(f"🎯 BTC Daily Position Trader - {'PAPER MODE' if self.paper_mode else 'LIVE'}")
        print(f"{'='*60}")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check existing position
        position = self.check_existing_position()
        if position['exists']:
            print(f"\n⚠️  Existing {position['side']} position detected")
            print(f"  Skipping new signal")
            return
        
        # Fetch market data
        print("\n📡 Fetching daily candle data...")
        market_data = self.get_market_data(days=120)
        
        if not market_data:
            print("❌ Failed to fetch data")
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
    bot = BTCPositionDaily(paper_mode=True)
    bot.run()
