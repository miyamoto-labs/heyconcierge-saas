#!/usr/bin/env python3
"""
Hyperliquid Whale Copy Trading Bot
Monitors profitable traders and copies their perpetual positions
"""

import json
import time
from datetime import datetime
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

class HyperliquidWhaleTracker:
    def __init__(self, paper_mode=True):
        """Initialize whale tracker"""
        self.paper_mode = paper_mode
        
        # Load config
        with open('.hyperliquid_config.json', 'r') as f:
            config = json.load(f)
        
        self.main_wallet = config['public_wallet']
        self.api_key = config['api_private_key']
        
        # Initialize clients
        self.info = Info(skip_ws=True)
        if not paper_mode:
            account = Account.from_key(self.api_key)
            self.exchange = Exchange(account)
        else:
            self.exchange = None
        
        # Trading params
        self.position_size = 15  # USD
        self.leverage = 10
        
        # Whale wallets to monitor (top Hyperliquid traders)
        # These are examples - need to find real profitable traders
        self.whales = {
            "0x...example1": {"name": "HLWhale1", "win_rate": 0.65},
            "0x...example2": {"name": "HLWhale2", "win_rate": 0.62},
            # TODO: Research and add real profitable Hyperliquid traders
        }
        
        # Track alerted trades
        self.alerted_file = '/Users/erik/.openclaw/workspace/.hl_whale_alerted.json'
        self.alerted_trades = self.load_alerted()
    
    def load_alerted(self):
        """Load previously alerted trade IDs"""
        try:
            with open(self.alerted_file, 'r') as f:
                return set(json.load(f))
        except:
            return set()
    
    def save_alerted(self):
        """Save alerted trade IDs"""
        with open(self.alerted_file, 'w') as f:
            json.dump(list(self.alerted_trades), f)
    
    def get_whale_positions(self, wallet):
        """Get current positions for a whale wallet"""
        try:
            state = self.info.user_state(wallet)
            positions = []
            
            for asset in state.get('assetPositions', []):
                pos = asset['position']
                if float(pos['szi']) != 0:  # Has position
                    positions.append({
                        'coin': pos['coin'],
                        'size': float(pos['szi']),
                        'side': 'LONG' if float(pos['szi']) > 0 else 'SHORT',
                        'entry_price': float(pos['entryPx']),
                        'leverage': pos['leverage']['value'],
                        'unrealized_pnl': float(pos['unrealizedPnl'])
                    })
            
            return positions
        except Exception as e:
            print(f"❌ Error fetching positions for {wallet[:10]}...: {e}")
            return []
    
    def analyze_whale_trade(self, whale_info, position):
        """Analyze if whale position should be copied"""
        # Generate unique trade ID
        trade_id = f"{whale_info['name']}_{position['coin']}_{position['side']}"
        
        # Skip if already alerted
        if trade_id in self.alerted_trades:
            return None
        
        # Calculate position value (approximate)
        position_value = abs(position['size']) * position['entry_price']
        
        # Only copy significant positions (>$1000)
        if position_value < 1000:
            return None
        
        return {
            'trade_id': trade_id,
            'whale_name': whale_info['name'],
            'win_rate': whale_info['win_rate'],
            'coin': position['coin'],
            'side': position['side'],
            'entry_price': position['entry_price'],
            'whale_size': position_value,
            'whale_leverage': position['leverage'],
            'unrealized_pnl': position['unrealized_pnl']
        }
    
    def send_telegram_alert(self, trade_data):
        """Send whale trade alert via OpenClaw"""
        mode = "📝 PAPER MODE" if self.paper_mode else "💰 LIVE TRADING"
        
        message = f"{mode}\n\n"
        message += f"🐋 HYPERLIQUID WHALE ALERT\n\n"
        message += f"👤 Trader: {trade_data['whale_name']}\n"
        message += f"📊 Win Rate: {trade_data['win_rate']*100:.0f}%\n\n"
        
        message += f"📈 Position:\n"
        message += f"  Coin: {trade_data['coin']}\n"
        message += f"  Side: {trade_data['side']}\n"
        message += f"  Entry: ${trade_data['entry_price']:,.2f}\n"
        message += f"  Whale Size: ${trade_data['whale_size']:,.0f}\n"
        message += f"  Whale Leverage: {trade_data['whale_leverage']}\n"
        message += f"  Unrealized P&L: ${trade_data['unrealized_pnl']:,.2f}\n\n"
        
        message += f"💸 Your Copy:\n"
        message += f"  Size: ${self.position_size}\n"
        message += f"  Leverage: {self.leverage}x\n"
        message += f"  Exposure: ${self.position_size * self.leverage}\n\n"
        
        message += f"⏸️  This is a signal only - no auto-execute"
        
        # Output for OpenClaw
        print("\n" + "="*70)
        print("TELEGRAM_ALERT")
        print(message)
        print("="*70)
    
    def scan_whales(self):
        """Scan all whale wallets for new positions"""
        print(f"\n{'='*60}")
        print(f"🐋 Hyperliquid Whale Scanner - {'PAPER MODE' if self.paper_mode else 'LIVE'}")
        print(f"{'='*60}")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        alerts_sent = 0
        
        for wallet, info in self.whales.items():
            print(f"\n🔍 Checking {info['name']} ({wallet[:10]}...)...")
            
            positions = self.get_whale_positions(wallet)
            
            if positions:
                print(f"  📊 {len(positions)} active position(s)")
                
                for pos in positions:
                    trade = self.analyze_whale_trade(info, pos)
                    
                    if trade:
                        print(f"  🎯 NEW: {pos['side']} {pos['coin']} @ ${pos['entry_price']:,.2f}")
                        self.send_telegram_alert(trade)
                        self.alerted_trades.add(trade['trade_id'])
                        alerts_sent += 1
            else:
                print(f"  ⏸️  No positions")
        
        # Save alerted trades
        self.save_alerted()
        
        if alerts_sent > 0:
            print(f"\n✅ {alerts_sent} whale alert(s) sent!")
        else:
            print(f"\n✅ No new whale trades")
        
        print(f"\n{'='*60}\n")

if __name__ == '__main__':
    # Run in paper mode by default
    tracker = HyperliquidWhaleTracker(paper_mode=True)
    tracker.scan_whales()
