#!/usr/bin/env python3
"""
🔥 HYPERLIQUID AGGRESSIVE SCALPER V4 🔥

ACTUALLY TRADES. NO EXCUSES.

Signals that trigger frequently:
- ANY momentum: 3 candles same direction
- RSI deviation from 50 (not extremes)
- Price vs 5-bar average
- Micro range breakouts

$25 trades, 0.2% stop, 0.3% target
"""

import json
import time
import os
import sys
from datetime import datetime
from typing import Optional, List, Dict
import statistics

sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account


class Config:
    POSITION_SIZE_USD = 25.0
    MAX_LEVERAGE = 5
    
    # ULTRA AGGRESSIVE - triggers on tiny moves
    RSI_LONG_BELOW = 48      # Long when RSI < 48
    RSI_SHORT_ABOVE = 52     # Short when RSI > 52
    RSI_PERIOD = 5
    
    MOMENTUM_CANDLES = 2     # 2 candles same direction = signal
    DEVIATION_PCT = 0.001    # 0.1% from average = signal
    
    STOP_LOSS_PCT = 0.002    # 0.2%
    TAKE_PROFIT_PCT = 0.003  # 0.3%
    
    MAX_DAILY_TRADES = 100
    COOLDOWN_SECONDS = 30    # Only 30 sec between trades
    CHECK_INTERVAL = 10      # Check every 10 sec


class AggressiveScalper:
    def __init__(self):
        print("=" * 60)
        print("🔥 AGGRESSIVE SCALPER V4 - ACTUALLY TRADES 🔥")
        print("=" * 60)
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        with open(".hyperliquid_config.json", 'r') as f:
            config = json.load(f)
        
        self.wallet = config["public_wallet"]
        self.api_key = config["api_private_key"]
        
        self.info = Info(skip_ws=True)
        account = Account.from_key(self.api_key)
        self.exchange = Exchange(account, account_address=self.wallet)
        
        self.daily_trades = 0
        self.daily_pnl = 0.0
        self.last_trade_time = 0
        self.in_position = False
        self.position_side = None
        self.entry_price = None
        
        self._load_state()
        self._close_any_positions()
        
        balance = self._get_balance()
        print(f"💵 Balance: ${balance:.2f}")
        print(f"📊 Triggers: RSI <{Config.RSI_LONG_BELOW}=LONG, >{Config.RSI_SHORT_ABOVE}=SHORT")
        print(f"🎯 Target: +0.3% / Stop: -0.2%")
        print(f"⚡ Cooldown: {Config.COOLDOWN_SECONDS}s between trades")
        print("=" * 60)
        print()
    
    def _load_state(self):
        try:
            with open("scalper_v4_state.json", 'r') as f:
                state = json.load(f)
            if state.get("date") == datetime.now().strftime("%Y-%m-%d"):
                self.daily_trades = state.get("trades", 0)
                self.daily_pnl = state.get("pnl", 0.0)
        except:
            pass
        self._save_state()
    
    def _save_state(self):
        with open("scalper_v4_state.json", 'w') as f:
            json.dump({
                "date": datetime.now().strftime("%Y-%m-%d"),
                "trades": self.daily_trades,
                "pnl": self.daily_pnl
            }, f)
    
    def _close_any_positions(self):
        try:
            state = self.info.user_state(self.wallet)
            for p in state.get('assetPositions', []):
                pos = p.get('position', {})
                size = float(pos.get('szi', 0))
                if size != 0:
                    print(f"⚠️ Closing existing position")
                    self.exchange.market_close(pos.get('coin', 'BTC'))
        except Exception as e:
            print(f"⚠️ {e}")
    
    def _get_balance(self) -> float:
        try:
            state = self.info.user_state(self.wallet)
            return float(state.get("marginSummary", {}).get("accountValue", 0))
        except:
            return 0.0
    
    def _get_price(self, asset: str = "BTC") -> Optional[float]:
        try:
            mids = self.info.all_mids()
            return float(mids.get(asset, 0))
        except:
            return None
    
    def _get_candles(self, asset: str = "BTC") -> List[float]:
        try:
            now = int(time.time() * 1000)
            candles = self.info.candles_snapshot(asset, "1m", now - 30*60*1000, now)
            return [float(c['c']) for c in candles] if candles else []
        except:
            return []
    
    def _rsi(self, closes: List[float]) -> Optional[float]:
        if len(closes) < Config.RSI_PERIOD + 1:
            return None
        
        deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
        gains = [max(d, 0) for d in deltas[-Config.RSI_PERIOD:]]
        losses = [max(-d, 0) for d in deltas[-Config.RSI_PERIOD:]]
        
        avg_gain = sum(gains) / Config.RSI_PERIOD
        avg_loss = sum(losses) / Config.RSI_PERIOD
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))
    
    def _check_position(self, asset: str = "BTC"):
        try:
            state = self.info.user_state(self.wallet)
            for p in state.get('assetPositions', []):
                pos = p.get('position', {})
                if pos.get('coin') == asset:
                    size = float(pos.get('szi', 0))
                    if size != 0:
                        self.in_position = True
                        self.position_side = "LONG" if size > 0 else "SHORT"
                        self.entry_price = float(pos.get('entryPx', 0))
                        return size, self.entry_price, float(pos.get('unrealizedPnl', 0))
            
            self.in_position = False
            self.position_side = None
            self.entry_price = None
            return 0, 0, 0
        except:
            return 0, 0, 0
    
    def _find_signal(self, closes: List[float]) -> Optional[tuple]:
        if len(closes) < 10:
            return None
        
        current = closes[-1]
        rsi = self._rsi(closes)
        
        # Strategy 1: RSI bias (very sensitive)
        if rsi:
            if rsi < Config.RSI_LONG_BELOW:
                return ("LONG", f"RSI {rsi:.1f} < {Config.RSI_LONG_BELOW}")
            elif rsi > Config.RSI_SHORT_ABOVE:
                return ("SHORT", f"RSI {rsi:.1f} > {Config.RSI_SHORT_ABOVE}")
        
        # Strategy 2: Momentum (2 candles same direction)
        if len(closes) >= 3:
            c1 = closes[-1] > closes[-2]
            c2 = closes[-2] > closes[-3]
            
            if c1 and c2:
                return ("LONG", "2 green candles")
            elif not c1 and not c2:
                return ("SHORT", "2 red candles")
        
        # Strategy 3: Mean reversion
        avg5 = sum(closes[-5:]) / 5
        dev = (current - avg5) / avg5
        
        if dev < -Config.DEVIATION_PCT:
            return ("LONG", f"Below avg by {dev*100:.2f}%")
        elif dev > Config.DEVIATION_PCT:
            return ("SHORT", f"Above avg by {dev*100:.2f}%")
        
        return None
    
    def _execute_trade(self, side: str, reason: str, asset: str = "BTC"):
        if time.time() - self.last_trade_time < Config.COOLDOWN_SECONDS:
            return False
        
        if self.daily_trades >= Config.MAX_DAILY_TRADES:
            return False
        
        price = self._get_price(asset)
        if not price:
            return False
        
        size = round(Config.POSITION_SIZE_USD / price, 5)
        is_buy = side == "LONG"
        
        print(f"\n{'='*50}")
        print(f"🎯 {side}: {reason}")
        print(f"   Price: ${price:,.2f} | Size: {size} BTC")
        
        try:
            self.exchange.update_leverage(Config.MAX_LEVERAGE, asset)
            result = self.exchange.market_open(asset, is_buy, size, None, 0.01)
            
            if result.get('status') == 'ok':
                print(f"   ✅ FILLED!")
                self.in_position = True
                self.position_side = side
                self.entry_price = price
                self.last_trade_time = time.time()
                self.daily_trades += 1
                
                if side == "LONG":
                    print(f"   🛑 Stop: ${price * 0.998:,.2f} | 🎯 TP: ${price * 1.003:,.2f}")
                else:
                    print(f"   🛑 Stop: ${price * 1.002:,.2f} | 🎯 TP: ${price * 0.997:,.2f}")
                    
                return True
            else:
                print(f"   ❌ Failed: {result}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print(f"{'='*50}")
        return False
    
    def _should_exit(self, price: float) -> Optional[str]:
        if not self.in_position or not self.entry_price:
            return None
        
        if self.position_side == "LONG":
            pnl = (price - self.entry_price) / self.entry_price
        else:
            pnl = (self.entry_price - price) / self.entry_price
        
        if pnl <= -Config.STOP_LOSS_PCT:
            return "STOP_LOSS"
        if pnl >= Config.TAKE_PROFIT_PCT:
            return "TAKE_PROFIT"
        
        return None
    
    def _close_position(self, reason: str, asset: str = "BTC"):
        size, entry, unrealized = self._check_position(asset)
        if size == 0:
            self.in_position = False
            return
        
        print(f"\n{'='*50}")
        print(f"📤 CLOSE: {reason} | P&L: ${unrealized:.2f}")
        
        try:
            result = self.exchange.market_close(asset)
            if result.get('status') == 'ok':
                print(f"   ✅ Closed!")
                self.daily_pnl += unrealized
                self.in_position = False
                self._save_state()
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print(f"{'='*50}")
    
    def run(self, asset: str = "BTC"):
        print(f"🚀 Starting on {asset}...")
        print(f"📊 Checking every {Config.CHECK_INTERVAL}s\n")
        
        last_check = 0
        
        while True:
            try:
                now = time.time()
                price = self._get_price(asset)
                if not price:
                    time.sleep(1)
                    continue
                
                # Manage position
                if self.in_position:
                    exit_reason = self._should_exit(price)
                    if exit_reason:
                        self._close_position(exit_reason, asset)
                    time.sleep(3)
                    continue
                
                # Look for signals
                if now - last_check >= Config.CHECK_INTERVAL:
                    last_check = now
                    
                    closes = self._get_candles(asset)
                    if closes:
                        signal = self._find_signal(closes)
                        
                        if signal:
                            self._execute_trade(signal[0], signal[1], asset)
                        else:
                            rsi = self._rsi(closes)
                            rsi_str = f"{rsi:.1f}" if rsi else "?"
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] ${price:,.0f} | RSI: {rsi_str} | Trades: {self.daily_trades} | P&L: ${self.daily_pnl:.2f}")
                
                time.sleep(1)
                
            except KeyboardInterrupt:
                print("\n🛑 Shutting down...")
                if self.in_position:
                    self._close_position("SHUTDOWN", asset)
                break
            except Exception as e:
                print(f"❌ {e}")
                time.sleep(5)


if __name__ == "__main__":
    bot = AggressiveScalper()
    bot.run("BTC")
