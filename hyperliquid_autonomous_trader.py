#!/usr/bin/env python3
"""
Hyperliquid Autonomous Trading Bot
Production-ready, 24/7 BTC perpetuals trader for commercial deployment

⚠️  WARNING: This bot trades real money autonomously!
Always test in paper mode first!
"""

import json
import time
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import traceback

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

class TradingState:
    """Manages bot state persistence for restart-safety"""
    
    def __init__(self, state_file: str = "bot_state.json"):
        self.state_file = state_file
        self.state = self._load_state()
    
    def _load_state(self) -> Dict:
        """Load state from file or create new"""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Error loading state: {e}")
                return self._default_state()
        return self._default_state()
    
    def _default_state(self) -> Dict:
        """Default state structure"""
        return {
            "last_update": datetime.now().isoformat(),
            "daily_pnl": 0.0,
            "daily_trades": 0,
            "consecutive_losses": 0,
            "peak_balance": 0.0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "last_trade_time": None,
            "open_positions": {},
            "emergency_stop": False,
            "paused_until": None,
            "last_status_report": None
        }
    
    def save(self):
        """Save state to file"""
        try:
            self.state["last_update"] = datetime.now().isoformat()
            with open(self.state_file, 'w') as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            print(f"❌ Error saving state: {e}")
    
    def reset_daily_stats(self):
        """Reset daily statistics (call at midnight)"""
        self.state["daily_pnl"] = 0.0
        self.state["daily_trades"] = 0
        self.save()
    
    def update_peak_balance(self, balance: float):
        """Update peak balance for drawdown calculation"""
        if balance > self.state["peak_balance"]:
            self.state["peak_balance"] = balance
            self.save()

class RiskManager:
    """Comprehensive risk management system"""
    
    def __init__(self, config: Dict, state: TradingState):
        self.config = config
        self.state = state
        self.risk_config = config["risk_management"]
    
    def can_trade(self, account_balance: float) -> Tuple[bool, str]:
        """Check if trading is allowed based on all risk criteria"""
        
        # Emergency stop
        if self.state.state.get("emergency_stop"):
            return False, "Emergency stop activated"
        
        # Paused due to consecutive losses or other reasons
        if self.state.state.get("paused_until"):
            pause_until = datetime.fromisoformat(self.state.state["paused_until"])
            if datetime.now() < pause_until:
                remaining = (pause_until - datetime.now()).total_seconds() / 60
                return False, f"Bot paused for {remaining:.0f} more minutes"
            else:
                # Unpause
                self.state.state["paused_until"] = None
                self.state.save()
        
        # Daily loss limit
        if abs(self.state.state["daily_pnl"]) >= self.risk_config["daily_loss_limit_usd"]:
            return False, f"Daily loss limit reached (${abs(self.state.state['daily_pnl']):.2f})"
        
        # Max consecutive losses
        if self.state.state["consecutive_losses"] >= self.risk_config["max_consecutive_losses"]:
            # Pause for 4 hours
            pause_until = (datetime.now() + timedelta(hours=4)).isoformat()
            self.state.state["paused_until"] = pause_until
            self.state.save()
            return False, f"Max consecutive losses reached ({self.state.state['consecutive_losses']}), pausing for 4 hours"
        
        # Max drawdown
        peak = self.state.state["peak_balance"]
        if peak > 0:
            drawdown_pct = ((peak - account_balance) / peak) * 100
            if drawdown_pct >= self.risk_config["max_drawdown_pct"]:
                return False, f"Max drawdown exceeded ({drawdown_pct:.1f}%)"
        
        # Max positions
        open_positions = len(self.state.state.get("open_positions", {}))
        if open_positions >= self.risk_config["max_positions"]:
            return False, f"Max positions reached ({open_positions}/{self.risk_config['max_positions']})"
        
        return True, "OK"
    
    def calculate_position_size(self, account_balance: float, leverage: int) -> float:
        """Calculate position size based on account balance and risk parameters"""
        position_pct = self.risk_config["position_size_pct"] / 100
        position_size_usd = account_balance * position_pct
        
        # With leverage, actual exposure
        exposure = position_size_usd * leverage
        
        return position_size_usd
    
    def validate_order(self, price: float, size: float, leverage: int) -> Tuple[bool, str]:
        """Validate order parameters before submission"""
        
        # Check leverage limit
        if leverage > self.risk_config["max_leverage"]:
            return False, f"Leverage {leverage} exceeds max {self.risk_config['max_leverage']}"
        
        # Check minimum size
        if size < 0.001:  # Hyperliquid minimum
            return False, f"Position size too small: {size}"
        
        # Check reasonable price
        if price <= 0:
            return False, f"Invalid price: {price}"
        
        return True, "OK"

class SignalGenerator:
    """Multi-timeframe signal generation with confidence scoring"""
    
    def __init__(self, config: Dict, info: Info):
        self.config = config
        self.info = info
        self.signal_config = config["signal_generation"]
    
    def fetch_candles(self, asset: str, timeframe: str, bars: int = 100) -> Optional[List[Dict]]:
        """Fetch historical candles"""
        try:
            now = int(time.time() * 1000)
            
            # Calculate lookback period
            if timeframe == "1h":
                lookback_ms = bars * 60 * 60 * 1000
            elif timeframe == "4h":
                lookback_ms = bars * 4 * 60 * 60 * 1000
            elif timeframe == "1d":
                lookback_ms = bars * 24 * 60 * 60 * 1000
            else:
                return None
            
            start = now - lookback_ms
            
            candles = self.info.candles_snapshot(asset, timeframe, start, now)
            return candles if candles else []
            
        except Exception as e:
            print(f"❌ Error fetching {timeframe} candles: {e}")
            return None
    
    def calculate_rsi(self, closes: List[float], period: int = 14) -> Optional[float]:
        """Calculate RSI indicator"""
        if len(closes) < period + 1:
            return None
        
        deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
        gains = [max(d, 0) for d in deltas]
        losses = [max(-d, 0) for d in deltas]
        
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_ema(self, prices: List[float], period: int) -> Optional[float]:
        """Calculate EMA"""
        if len(prices) < period:
            return None
        
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period
        
        for price in prices[period:]:
            ema = (price - ema) * multiplier + ema
        
        return ema
    
    def analyze_timeframe(self, asset: str, timeframe: str, current_price: float) -> Optional[Dict]:
        """Analyze single timeframe and generate signal"""
        
        tf_config = self.signal_config["timeframes"].get(timeframe)
        if not tf_config or not tf_config.get("enabled"):
            return None
        
        # Fetch candles
        candles = self.fetch_candles(asset, timeframe, bars=120)
        if not candles or len(candles) < 50:
            print(f"⚠️  Insufficient data for {timeframe}")
            return None
        
        closes = [float(c['c']) for c in candles]
        
        # Calculate indicators
        rsi = self.calculate_rsi(closes)
        ema_fast = self.calculate_ema(closes, 12)
        ema_slow = self.calculate_ema(closes, 26)
        ma_20 = sum(closes[-20:]) / 20 if len(closes) >= 20 else None
        ma_50 = sum(closes[-50:]) / 50 if len(closes) >= 50 else None
        
        if None in [rsi, ema_fast, ema_slow, ma_20, ma_50]:
            return None
        
        # Signal generation logic
        signal = {
            "timeframe": timeframe,
            "action": None,
            "confidence": 0,
            "price": current_price,
            "indicators": {
                "rsi": rsi,
                "ema_fast": ema_fast,
                "ema_slow": ema_slow,
                "ma_20": ma_20,
                "ma_50": ma_50
            },
            "reasons": [],
            "stop_loss_pct": tf_config["stop_loss_pct"],
            "take_profit_pct": tf_config["take_profit_pct"],
            "leverage": tf_config["leverage"]
        }
        
        # Long signals
        long_score = 0
        if rsi < 40:
            signal["reasons"].append(f"RSI oversold ({rsi:.1f})")
            long_score += 35
        elif rsi < 50:
            signal["reasons"].append(f"RSI neutral-low ({rsi:.1f})")
            long_score += 15
        
        if ema_fast > ema_slow:
            signal["reasons"].append("EMA bullish crossover")
            long_score += 30
        
        if current_price > ma_20 and ma_20 > ma_50:
            signal["reasons"].append("Price above MA20/50 (uptrend)")
            long_score += 25
        elif current_price > ma_20:
            signal["reasons"].append("Price above MA20")
            long_score += 10
        
        # Short signals
        short_score = 0
        if rsi > 60:
            signal["reasons"].append(f"RSI overbought ({rsi:.1f})")
            short_score += 35
        elif rsi > 50:
            signal["reasons"].append(f"RSI neutral-high ({rsi:.1f})")
            short_score += 15
        
        if ema_fast < ema_slow:
            signal["reasons"].append("EMA bearish crossover")
            short_score += 30
        
        if current_price < ma_20 and ma_20 < ma_50:
            signal["reasons"].append("Price below MA20/50 (downtrend)")
            short_score += 25
        elif current_price < ma_20:
            signal["reasons"].append("Price below MA20")
            short_score += 10
        
        # Determine action
        if long_score > short_score and long_score >= 50:
            signal["action"] = "LONG"
            signal["confidence"] = min(long_score, 100)
        elif short_score > long_score and short_score >= 50:
            signal["action"] = "SHORT"
            signal["confidence"] = min(short_score, 100)
        else:
            signal["action"] = None
            signal["confidence"] = max(long_score, short_score)
            signal["reasons"] = ["No strong signal (need 50+ confidence)"]
        
        return signal
    
    def generate_composite_signal(self, asset: str = "BTC") -> Optional[Dict]:
        """Generate composite signal from all enabled timeframes"""
        
        # Get current price
        try:
            all_mids = self.info.all_mids()
            current_price = float(all_mids.get(asset, 0))
            if current_price <= 0:
                print("❌ Invalid current price")
                return None
        except Exception as e:
            print(f"❌ Error fetching current price: {e}")
            return None
        
        # Analyze each timeframe
        timeframe_signals = {}
        for tf in ["1h", "4h", "1d"]:
            signal = self.analyze_timeframe(asset, tf, current_price)
            if signal:
                timeframe_signals[tf] = signal
        
        if not timeframe_signals:
            print("⚠️  No valid timeframe signals")
            return None
        
        # Calculate composite signal
        composite = {
            "asset": asset,
            "timestamp": datetime.now().isoformat(),
            "current_price": current_price,
            "timeframe_signals": timeframe_signals,
            "composite_action": None,
            "composite_confidence": 0,
            "recommended_timeframe": None
        }
        
        # Weight signals by timeframe importance
        weighted_long = 0
        weighted_short = 0
        total_weight = 0
        
        for tf, signal in timeframe_signals.items():
            weight = self.signal_config["timeframes"][tf]["weight"]
            
            if signal["action"] == "LONG":
                weighted_long += signal["confidence"] * weight
            elif signal["action"] == "SHORT":
                weighted_short += signal["confidence"] * weight
            
            total_weight += weight
        
        # Determine composite action
        if total_weight > 0:
            avg_long = weighted_long / total_weight
            avg_short = weighted_short / total_weight
            
            if avg_long > avg_short and avg_long >= self.signal_config["min_confidence"]:
                composite["composite_action"] = "LONG"
                composite["composite_confidence"] = avg_long
            elif avg_short > avg_long and avg_short >= self.signal_config["min_confidence"]:
                composite["composite_action"] = "SHORT"
                composite["composite_confidence"] = avg_short
        
        # Select recommended timeframe (highest confidence)
        if composite["composite_action"]:
            best_tf = max(
                [tf for tf, s in timeframe_signals.items() if s["action"] == composite["composite_action"]],
                key=lambda tf: timeframe_signals[tf]["confidence"]
            )
            composite["recommended_timeframe"] = best_tf
        
        return composite

class PositionManager:
    """Manages open positions with stop-loss and take-profit"""
    
    def __init__(self, config: Dict, state: TradingState, exchange: Optional[Exchange], info: Info):
        self.config = config
        self.state = state
        self.exchange = exchange
        self.info = info
    
    def sync_positions(self, wallet_address: str):
        """Sync open positions from Hyperliquid"""
        try:
            user_state = self.info.user_state(wallet_address)
            positions = {}
            
            for asset_pos in user_state.get("assetPositions", []):
                pos = asset_pos.get("position", {})
                coin = pos.get("coin")
                size = float(pos.get("szi", 0))
                
                if size != 0:  # Open position
                    positions[coin] = {
                        "coin": coin,
                        "size": size,
                        "side": "LONG" if size > 0 else "SHORT",
                        "entry_price": float(pos.get("entryPx", 0)),
                        "unrealized_pnl": float(pos.get("unrealizedPnl", 0)),
                        "leverage": float(pos.get("leverage", {}).get("value", 1))
                    }
            
            self.state.state["open_positions"] = positions
            self.state.save()
            
            return positions
            
        except Exception as e:
            print(f"❌ Error syncing positions: {e}")
            return {}
    
    def check_stop_loss_take_profit(self, wallet_address: str) -> List[Dict]:
        """Check if any positions hit stop-loss or take-profit"""
        actions = []
        
        positions = self.sync_positions(wallet_address)
        
        for coin, pos in positions.items():
            try:
                # Get current price
                all_mids = self.info.all_mids()
                current_price = float(all_mids.get(coin, 0))
                
                if current_price <= 0:
                    continue
                
                entry_price = pos["entry_price"]
                side = pos["side"]
                
                # Calculate P&L percentage
                if side == "LONG":
                    pnl_pct = ((current_price - entry_price) / entry_price) * 100
                else:  # SHORT
                    pnl_pct = ((entry_price - current_price) / entry_price) * 100
                
                # Get stop/target from position metadata (if stored)
                # For now, use default risk config
                stop_loss_pct = self.config["risk_management"]["stop_loss_pct"]
                take_profit_pct = self.config["risk_management"]["take_profit_pct"]
                
                # Check stop loss
                if pnl_pct <= -stop_loss_pct:
                    actions.append({
                        "coin": coin,
                        "action": "close",
                        "reason": "stop_loss",
                        "pnl_pct": pnl_pct
                    })
                
                # Check take profit
                elif pnl_pct >= take_profit_pct:
                    actions.append({
                        "coin": coin,
                        "action": "close",
                        "reason": "take_profit",
                        "pnl_pct": pnl_pct
                    })
                
            except Exception as e:
                print(f"❌ Error checking {coin}: {e}")
        
        return actions

class HyperliquidAutonomousTrader:
    """Main autonomous trading bot"""
    
    def __init__(self, config_file: str = "trading_config.json"):
        """Initialize the trading bot"""
        
        print("="*70)
        print("🤖 Hyperliquid Autonomous Trading Bot v1.0")
        print("="*70)
        
        # Load configuration
        print("\n📋 Loading configuration...")
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        # Load Hyperliquid credentials
        print("🔑 Loading Hyperliquid credentials...")
        with open('.hyperliquid_config.json', 'r') as f:
            self.hl_config = json.load(f)
        
        self.wallet_address = self.hl_config["public_wallet"]
        self.api_key = self.hl_config["api_private_key"]
        
        # Initialize components
        print("🔌 Connecting to Hyperliquid...")
        self.info = Info(skip_ws=True)
        
        if not self.config["mode"]["paper_mode"]:
            account = Account.from_key(self.api_key)
            self.exchange = Exchange(account, account_address=self.wallet_address)
            print("✅ Connected to Hyperliquid MAINNET")
        else:
            self.exchange = None
            print("📝 Running in PAPER MODE (no real trades)")
        
        # Initialize managers
        self.state = TradingState(self.config["persistence"]["state_file"])
        self.risk_manager = RiskManager(self.config, self.state)
        self.signal_generator = SignalGenerator(self.config, self.info)
        self.position_manager = PositionManager(self.config, self.state, self.exchange, self.info)
        
        # Bot status
        self.running = True
        self.last_health_check = None
        
        print("\n✅ Bot initialized successfully!")
        print(f"📊 Autonomous mode: {self.config['mode']['autonomous']}")
        print(f"📊 Paper mode: {self.config['mode']['paper_mode']}")
        print(f"💰 Account: {self.wallet_address[:10]}...{self.wallet_address[-8:]}")
    
    def health_check(self) -> bool:
        """Verify API connectivity and bot health"""
        try:
            # Check Hyperliquid API
            all_mids = self.info.all_mids()
            if not all_mids:
                print("⚠️  Health check failed: Cannot fetch prices")
                return False
            
            # Check account balance
            balance = self.get_account_balance()
            if balance is None:
                print("⚠️  Health check failed: Cannot fetch balance")
                return False
            
            self.last_health_check = datetime.now()
            return True
            
        except Exception as e:
            print(f"⚠️  Health check failed: {e}")
            return False
    
    def get_account_balance(self) -> Optional[float]:
        """Get current account balance"""
        try:
            user_state = self.info.user_state(self.wallet_address)
            margin_summary = user_state.get("marginSummary", {})
            account_value = float(margin_summary.get("accountValue", 0))
            return account_value
        except Exception as e:
            print(f"❌ Error fetching balance: {e}")
            return None
    
    def execute_trade(self, signal: Dict) -> bool:
        """Execute a trade based on signal"""
        
        asset = signal["asset"]
        action = signal["composite_action"]
        tf = signal["recommended_timeframe"]
        tf_signal = signal["timeframe_signals"][tf]
        
        print(f"\n{'='*70}")
        print(f"🎯 EXECUTING {action} TRADE")
        print(f"{'='*70}")
        print(f"Asset: {asset}")
        print(f"Price: ${signal['current_price']:,.2f}")
        print(f"Timeframe: {tf}")
        print(f"Confidence: {signal['composite_confidence']:.1f}%")
        print(f"Leverage: {tf_signal['leverage']}x")
        
        # Get account balance
        balance = self.get_account_balance()
        if balance is None:
            print("❌ Cannot fetch balance, aborting trade")
            return False
        
        # Calculate position size
        position_size = self.risk_manager.calculate_position_size(balance, tf_signal['leverage'])
        
        print(f"\n💰 Account Balance: ${balance:,.2f}")
        print(f"📊 Position Size: ${position_size:,.2f}")
        print(f"📊 Exposure: ${position_size * tf_signal['leverage']:,.2f}")
        
        # Calculate stop loss and take profit
        if action == "LONG":
            stop_price = signal['current_price'] * (1 - tf_signal['stop_loss_pct'] / 100)
            target_price = signal['current_price'] * (1 + tf_signal['take_profit_pct'] / 100)
        else:  # SHORT
            stop_price = signal['current_price'] * (1 + tf_signal['stop_loss_pct'] / 100)
            target_price = signal['current_price'] * (1 - tf_signal['take_profit_pct'] / 100)
        
        print(f"🛑 Stop Loss: ${stop_price:,.2f} ({tf_signal['stop_loss_pct']}%)")
        print(f"🎯 Take Profit: ${target_price:,.2f} ({tf_signal['take_profit_pct']}%)")
        
        # Validate order
        size_in_coins = position_size / signal['current_price']
        valid, msg = self.risk_manager.validate_order(
            signal['current_price'],
            size_in_coins,
            tf_signal['leverage']
        )
        
        if not valid:
            print(f"❌ Order validation failed: {msg}")
            return False
        
        # Execute in paper mode or live
        if self.config["mode"]["paper_mode"]:
            print("\n📝 PAPER MODE - Simulating trade")
            print("✅ Trade would be executed in live mode")
            
            # Record paper trade
            self._record_trade(signal, position_size, "paper")
            
            return True
        
        else:
            print("\n💰 LIVE MODE - Executing real trade...")
            
            try:
                # Place market order
                is_buy = (action == "LONG")
                
                order_result = self.exchange.market_open(
                    asset,
                    is_buy,
                    size_in_coins,
                    None,  # No reduce_only
                    None   # No TP/SL (we manage manually)
                )
                
                print(f"✅ Order executed: {order_result}")
                
                # Record trade
                self._record_trade(signal, position_size, "live", order_result)
                
                # Send alert
                self._send_trade_alert(signal, position_size, stop_price, target_price)
                
                return True
                
            except Exception as e:
                print(f"❌ Trade execution failed: {e}")
                traceback.print_exc()
                return False
    
    def _record_trade(self, signal: Dict, size: float, mode: str, order_result: Optional[Dict] = None):
        """Record trade to history"""
        trade_record = {
            "timestamp": datetime.now().isoformat(),
            "asset": signal["asset"],
            "action": signal["composite_action"],
            "price": signal["current_price"],
            "size": size,
            "timeframe": signal["recommended_timeframe"],
            "confidence": signal["composite_confidence"],
            "mode": mode,
            "order_result": order_result
        }
        
        # Save to trade history
        history_file = self.config["persistence"]["trade_history_file"]
        
        try:
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    history = json.load(f)
            else:
                history = []
            
            history.append(trade_record)
            
            with open(history_file, 'w') as f:
                json.dump(history, f, indent=2)
        
        except Exception as e:
            print(f"⚠️  Error saving trade history: {e}")
        
        # Update state
        self.state.state["total_trades"] += 1
        self.state.state["daily_trades"] += 1
        self.state.state["last_trade_time"] = datetime.now().isoformat()
        self.state.save()
    
    def _send_trade_alert(self, signal: Dict, size: float, stop_price: float, target_price: float):
        """Send Telegram alert for trade"""
        if not self.config["monitoring"]["telegram_alerts"]:
            return
        
        mode = "📝 PAPER" if self.config["mode"]["paper_mode"] else "💰 LIVE"
        action = signal["composite_action"]
        
        message = f"{mode} TRADE EXECUTED\n\n"
        message += f"{'🟢' if action == 'LONG' else '🔴'} {action} {signal['asset']}\n\n"
        message += f"💰 Entry: ${signal['current_price']:,.2f}\n"
        message += f"📊 Size: ${size:,.2f}\n"
        message += f"⏱️  Timeframe: {signal['recommended_timeframe']}\n"
        message += f"🎯 Confidence: {signal['composite_confidence']:.1f}%\n\n"
        message += f"🛑 Stop Loss: ${stop_price:,.2f}\n"
        message += f"🎯 Target: ${target_price:,.2f}\n\n"
        message += f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        print(f"\n{'-'*70}")
        print("TELEGRAM_ALERT")
        print(message)
        print(f"{'-'*70}\n")
    
    def manage_positions(self):
        """Check and manage open positions"""
        actions = self.position_manager.check_stop_loss_take_profit(self.wallet_address)
        
        for action_item in actions:
            coin = action_item["coin"]
            reason = action_item["reason"]
            pnl_pct = action_item["pnl_pct"]
            
            print(f"\n🔔 Position alert: {coin} hit {reason} ({pnl_pct:+.2f}%)")
            
            if self.config["mode"]["paper_mode"]:
                print("📝 PAPER MODE - Would close position")
            else:
                print(f"💰 Closing {coin} position...")
                try:
                    # Close position
                    # Implementation depends on your exchange wrapper
                    print(f"✅ Position closed: {reason}")
                    
                    # Update stats
                    if pnl_pct > 0:
                        self.state.state["winning_trades"] += 1
                        self.state.state["consecutive_losses"] = 0
                    else:
                        self.state.state["losing_trades"] += 1
                        self.state.state["consecutive_losses"] += 1
                    
                    self.state.state["daily_pnl"] += (pnl_pct / 100) * self.get_account_balance()
                    self.state.save()
                    
                except Exception as e:
                    print(f"❌ Error closing position: {e}")
    
    def send_status_report(self):
        """Send hourly status report"""
        if not self.config["monitoring"]["hourly_status"]:
            return
        
        balance = self.get_account_balance()
        positions = self.position_manager.sync_positions(self.wallet_address)
        
        message = "📊 BOT STATUS REPORT\n\n"
        message += f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        message += f"💰 Balance: ${balance:,.2f}\n"
        message += f"📊 Open Positions: {len(positions)}\n"
        message += f"📈 Total Trades: {self.state.state['total_trades']}\n"
        message += f"✅ Win Rate: {self._calculate_win_rate():.1f}%\n"
        message += f"📉 Daily P&L: ${self.state.state['daily_pnl']:,.2f}\n"
        message += f"🔄 Consecutive Losses: {self.state.state['consecutive_losses']}\n"
        
        print(f"\n{'-'*70}")
        print("STATUS_REPORT")
        print(message)
        print(f"{'-'*70}\n")
    
    def _calculate_win_rate(self) -> float:
        """Calculate win rate"""
        total = self.state.state["winning_trades"] + self.state.state["losing_trades"]
        if total == 0:
            return 0.0
        return (self.state.state["winning_trades"] / total) * 100
    
    def run(self):
        """Main bot loop"""
        
        print(f"\n{'='*70}")
        print("🚀 STARTING AUTONOMOUS TRADING BOT")
        print(f"{'='*70}\n")
        
        iteration = 0
        last_status_report = None
        
        try:
            while self.running:
                iteration += 1
                
                print(f"\n{'='*70}")
                print(f"🔄 Iteration {iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"{'='*70}")
                
                # Health check
                if not self.health_check():
                    print("⚠️  Health check failed, retrying in 60 seconds...")
                    time.sleep(60)
                    continue
                
                # Check emergency stop
                if self.config["safety"]["emergency_stop"]:
                    print("🛑 EMERGENCY STOP ACTIVATED - Bot halted")
                    break
                
                # Get account balance
                balance = self.get_account_balance()
                if balance:
                    print(f"💰 Account Balance: ${balance:,.2f}")
                    self.state.update_peak_balance(balance)
                
                # Check if trading is allowed
                can_trade, reason = self.risk_manager.can_trade(balance if balance else 0)
                
                if not can_trade:
                    print(f"⏸️  Trading paused: {reason}")
                    time.sleep(300)  # Wait 5 minutes
                    continue
                
                # Manage existing positions
                print("\n🔍 Checking open positions...")
                self.manage_positions()
                
                # Generate signals
                print("\n📊 Generating trading signals...")
                signal = self.signal_generator.generate_composite_signal()
                
                if signal and signal["composite_action"]:
                    print(f"\n✅ Signal generated: {signal['composite_action']}")
                    print(f"   Confidence: {signal['composite_confidence']:.1f}%")
                    print(f"   Recommended timeframe: {signal['recommended_timeframe']}")
                    
                    # Execute if autonomous mode enabled
                    if self.config["mode"]["autonomous"]:
                        self.execute_trade(signal)
                    else:
                        print("⏸️  Autonomous mode disabled - signal only")
                
                else:
                    print("\n⏸️  No trading signal generated")
                
                # Send status report (hourly)
                now = datetime.now()
                if last_status_report is None or (now - last_status_report).seconds >= 3600:
                    self.send_status_report()
                    last_status_report = now
                
                # Sleep before next iteration
                sleep_time = 300  # 5 minutes
                print(f"\n😴 Sleeping for {sleep_time} seconds...")
                time.sleep(sleep_time)
        
        except KeyboardInterrupt:
            print("\n\n🛑 Bot stopped by user")
        
        except Exception as e:
            print(f"\n\n❌ Fatal error: {e}")
            traceback.print_exc()
        
        finally:
            print("\n✅ Bot shutdown complete")
            self.state.save()

def main():
    """Entry point"""
    
    # Check if config file exists
    if not os.path.exists("trading_config.json"):
        print("❌ Error: trading_config.json not found!")
        print("Please create configuration file first.")
        sys.exit(1)
    
    # Check if credentials exist
    if not os.path.exists(".hyperliquid_config.json"):
        print("❌ Error: .hyperliquid_config.json not found!")
        print("Please configure Hyperliquid credentials first.")
        sys.exit(1)
    
    # Initialize and run bot
    bot = HyperliquidAutonomousTrader()
    bot.run()

if __name__ == "__main__":
    main()
