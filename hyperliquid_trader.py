#!/usr/bin/env python3
"""
Hyperliquid Trading Integration for OpenClaw
Automated trading on Hyperliquid decentralized perpetuals exchange
"""
import json
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants

class HyperliquidTrader:
    """Hyperliquid trading client with approval workflow"""
    
    def __init__(self, public_address, api_private_key, testnet=False):
        """
        Initialize Hyperliquid trader
        
        Args:
            public_address: Your main wallet address (0x...)
            api_private_key: Private key of API wallet (0x...)
            testnet: Use testnet (True) or mainnet (False)
        """
        self.public_address = public_address
        self.api_private_key = api_private_key
        self.testnet = testnet
        
        # API URL
        if testnet:
            self.api_url = constants.TESTNET_API_URL
        else:
            self.api_url = constants.MAINNET_API_URL
        
        # Initialize Info (read-only) and Exchange (trading)
        self.info = Info(self.api_url, skip_ws=True)
        
        # For Exchange, we need to create the wallet object
        from eth_account import Account
        wallet = Account.from_key(self.api_private_key)
        
        self.exchange = Exchange(
            wallet,
            self.api_url,
            account_address=self.public_address
        )
        
        print(f"✅ Connected to Hyperliquid {'Testnet' if testnet else 'Mainnet'}")
        print(f"📊 Account: {public_address[:10]}...{public_address[-8:]}")
    
    def get_account_state(self):
        """Get current account state (balances, positions, etc.)"""
        try:
            state = self.info.user_state(self.public_address)
            return state
        except Exception as e:
            print(f"❌ Error fetching account state: {e}")
            return None
    
    def get_positions(self):
        """Get current open positions"""
        try:
            state = self.get_account_state()
            if not state:
                return []
            
            positions = state.get("assetPositions", [])
            return [p for p in positions if float(p.get("position", {}).get("szi", 0)) != 0]
        except Exception as e:
            print(f"❌ Error fetching positions: {e}")
            return []
    
    def get_balance(self):
        """Get account balance"""
        try:
            state = self.get_account_state()
            if not state:
                return None
            
            margin_summary = state.get("marginSummary", {})
            return {
                "account_value": float(margin_summary.get("accountValue", 0)),
                "total_margin_used": float(margin_summary.get("totalMarginUsed", 0)),
                "withdrawable": float(state.get("withdrawable", 0))
            }
        except Exception as e:
            print(f"❌ Error fetching balance: {e}")
            return None
    
    def set_leverage(self, asset, leverage, is_cross=True):
        """
        Set leverage for an asset
        
        Args:
            asset: Asset name (e.g., "BTC", "ETH")
            leverage: Leverage value (e.g., 5, 10, 20)
            is_cross: True for cross margin, False for isolated
        """
        try:
            print(f"🎯 Setting {asset} leverage to {leverage}x ({'cross' if is_cross else 'isolated'})")
            
            result = self.exchange.update_leverage(
                leverage,
                asset,
                is_cross
            )
            
            print(f"✅ Leverage updated successfully!")
            print(f"   Result: {result}")
            return result
            
        except Exception as e:
            print(f"❌ Error setting leverage: {e}")
            return None
    
    def place_order(self, asset, is_buy, size, price=None, order_type="Limit", reduce_only=False):
        """
        Place an order
        
        Args:
            asset: Asset name (e.g., "BTC")
            is_buy: True for buy, False for sell
            size: Order size in base currency
            price: Limit price (None for market order)
            order_type: "Limit" or "Market"
            reduce_only: Only reduce position (don't increase)
        """
        try:
            side = "Buy" if is_buy else "Sell"
            print(f"📈 Placing {order_type} {side} order: {size} {asset} @ {price if price else 'Market'}")
            
            order = {
                "coin": asset,
                "is_buy": is_buy,
                "sz": size,
                "limit_px": price if price else 0,
                "order_type": {"limit": {"tif": "Gtc"}} if order_type == "Limit" else {"market": {}},
                "reduce_only": reduce_only
            }
            
            result = self.exchange.order(order, self.public_address)
            
            print(f"✅ Order placed successfully!")
            print(f"   Result: {result}")
            return result
            
        except Exception as e:
            print(f"❌ Error placing order: {e}")
            return None
    
    def close_position(self, asset):
        """Close an entire position for an asset"""
        try:
            positions = self.get_positions()
            position = next((p for p in positions if p.get("position", {}).get("coin") == asset), None)
            
            if not position:
                print(f"⚠️  No open position found for {asset}")
                return None
            
            size = abs(float(position.get("position", {}).get("szi", 0)))
            is_long = float(position.get("position", {}).get("szi", 0)) > 0
            
            print(f"🔒 Closing {asset} position: {size} ({'Long' if is_long else 'Short'})")
            
            # Close = sell if long, buy if short
            return self.place_order(
                asset=asset,
                is_buy=not is_long,
                size=size,
                order_type="Market",
                reduce_only=True
            )
            
        except Exception as e:
            print(f"❌ Error closing position: {e}")
            return None
    
    def get_market_price(self, asset):
        """Get current market price for an asset"""
        try:
            meta = self.info.all_mids()
            return float(meta.get(asset, 0))
        except Exception as e:
            print(f"❌ Error fetching price: {e}")
            return None

# Test/Demo function
def test_connection(public_address, api_private_key, testnet=False):
    """Test Hyperliquid connection and display account info"""
    print("=" * 60)
    print("🚀 Hyperliquid Trading Integration Test")
    print("=" * 60)
    print()
    
    # Initialize trader
    trader = HyperliquidTrader(public_address, api_private_key, testnet)
    
    # Get account balance
    print("\n💰 Account Balance:")
    balance = trader.get_balance()
    if balance:
        print(f"   Account Value: ${balance['account_value']:,.2f}")
        print(f"   Margin Used: ${balance['total_margin_used']:,.2f}")
        print(f"   Withdrawable: ${balance['withdrawable']:,.2f}")
    
    # Get current positions
    print("\n📊 Current Positions:")
    positions = trader.get_positions()
    if positions:
        for pos in positions:
            coin = pos.get("position", {}).get("coin")
            size = float(pos.get("position", {}).get("szi", 0))
            entry_px = float(pos.get("position", {}).get("entryPx", 0))
            pnl = float(pos.get("position", {}).get("unrealizedPnl", 0))
            
            side = "LONG" if size > 0 else "SHORT"
            print(f"   {coin}: {side} {abs(size)} @ ${entry_px:,.2f} | PnL: ${pnl:,.2f}")
    else:
        print("   No open positions")
    
    # Get BTC price
    print("\n💵 Market Prices:")
    btc_price = trader.get_market_price("BTC")
    eth_price = trader.get_market_price("ETH")
    print(f"   BTC: ${btc_price:,.2f}")
    print(f"   ETH: ${eth_price:,.2f}")
    
    print("\n" + "=" * 60)
    print("✅ Connection test complete!")
    print("=" * 60)
    
    return trader

if __name__ == "__main__":
    # Example usage (replace with real keys)
    PUBLIC_ADDRESS = "0x9648b853390084************B606cF93D360112"
    API_PRIVATE_KEY = "0x3f55516bef*********************e5a52a1a6"
    
    print("⚠️  DEMO MODE - Replace with real keys to test")
    print()
    
    # Test connection
    # trader = test_connection(PUBLIC_ADDRESS, API_PRIVATE_KEY, testnet=True)
    
    # To set leverage (uncomment when ready):
    # trader.set_leverage("BTC", 7, is_cross=True)
