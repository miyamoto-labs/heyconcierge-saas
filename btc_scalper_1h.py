#!/usr/bin/env python3
"""
BTC 1h Scalping Bot for Hyperliquid
Fast-moving trend captures with tighter stops
"""

import json
import time
from datetime import datetime
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

class BTCScalper1h:
    def __init__(self, paper_mode=True):
        """Initialize scalper"""
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
        
        # Trading params - AGGRESSIVE for 1h
        self.position_size = 15  # USD
        self.leverage = 10
        self.stop_loss_pct = 0.02  # 2% stop loss (tighter)
        self.take_profit_pct = 0.04  # 4% take profit (quicker)
    
    def get_market_data(self, hours=24):
        """Fetch BTC 1h candle data"""
        try:
            meta = self.info.meta()
            all_mids = self.info.all_mids()
            btc_price = float(all_mids['BTC'])
            
            # Get 1h candles
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
        """Calculate 10 and 20 period MAs (faster for scalping)"""
        ma10 = sum(prices[-10:]) / 10 if len(prices) >= 10 else None
        ma20 = sum(prices[-20:]) / 20 if len(prices) >= 20 else None
        return ma10, ma20
    
    def analyze_trend(self, market_data):
        """Analyze market - MORE AGGRESSIVE for 1h"""
        if not market_data or not market_data['candles']:
            return None
        
        closes = [float(c['c']) for c in market_data['candles']]
        current_price = market_data['price']
        
        if len(closes) < 26:
            print("⚠️  Insufficient data")
            return None
        
        # Calculate indicators
        rsi = self.calculate_rsi(closes)
        macd, macd_signal = self.calculate_macd(closes)
        ma10, ma20 = self.calculate_moving_averages(closes)
        
        print(f"\n📊 1h Scalper Analysis:")
        print(f"  Current Price: ${current_price:,.2f}")
        print(f"  RSI: {rsi:.2f}")
        print(f"  MACD: {macd:.4f} | Signal: {macd_signal:.4f}")
        print(f"  MA10: ${ma10:,.2f} | MA20: ${ma20:,.2f}")
        
        signal = {
            'action': None,
            'price': current_price,
            'rsi': rsi,
            'macd': macd,
            'macd_signal': macd_signal,
            'ma10': ma10,
            'ma20': ma20,
            'reasons': []
        }
        
        # LONG signals (more aggressive thresholds)
        long_signals = 0
        if rsi < 45:  # Less strict than 4h
            signal['reasons'].append("RSI below 45 (momentum shift)")
            long_signals += 1
        if macd > macd_signal:
            signal['reasons'].append("MACD bullish crossover")
            long_signals += 1
        if current_price > ma10 and ma10 > ma20:
            signal['reasons'].append("Price above MA10, MA10 above MA20 (short-term uptrend)")
            long_signals += 1
        
        # SHORT signals
        short_signals = 0
        if rsi > 55:  # Less strict than 4h
            signal['reasons'].append("RSI above 55 (momentum shift)")
            short_signals += 1
        if macd < macd_signal:
            signal['reasons'].append("MACD bearish crossover")
            short_signals += 1
        if current_price < ma10 and ma10 < ma20:
            signal['reasons'].append("Price below MA10, MA10 below MA20 (short-term downtrend)")
            short_signals += 1
        
        # Need 2/3 signals (same as 4h)
        if long_signals >= 2:
            signal['action'] = 'LONG'
        elif short_signals >= 2:
            signal['action'] = 'SHORT'
        else:
            signal['action'] = None
            signal['reasons'] = ["No strong short-term trend (need 2/3 signals)"]
        
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
        message += f"⚡️ BTC {signal['action']} Signal (1h Scalper)\n\n"
        message += f"💰 Entry Price: ${signal['price']:,.2f}\n"
        message += f"📊 Position Size: ${self.position_size} (${self.position_size * self.leverage:,.0f} exposure)\n"
        message += f"⚡️ Leverage: {self.leverage}x\n\n"
        
        message += f"📈 1h Technical Indicators:\n"
        message += f"  RSI: {signal['rsi']:.2f}\n"
        message += f"  MACD: {signal['macd']:.4f}\n"
        message += f"  MA10: ${signal['ma10']:,.2f}\n"
        message += f"  MA20: ${signal['ma20']:,.2f}\n\n"
        
        message += f"🎯 Scalping Plan:\n"
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
        message += f"⚡️ 1h timeframe (fast-moving)"
        
        print("\n" + "="*70)
        print("TELEGRAM_ALERT")
        print(message)
        print("="*70)
    
    def run(self):
        """Main bot loop"""
        print(f"\n{'='*60}")
        print(f"⚡️ BTC 1h Scalper - {'PAPER MODE' if self.paper_mode else 'LIVE'}")
        print(f"{'='*60}")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check existing position
        position = self.check_existing_position()
        if position['exists']:
            print(f"\n⚠️  Existing {position['side']} position detected")
            print(f"  Skipping new signal")
            return
        
        # Fetch market data
        print("\n📡 Fetching 1h candle data...")
        market_data = self.get_market_data(hours=48)
        
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
    bot = BTCScalper1h(paper_mode=True)
    bot.run()
