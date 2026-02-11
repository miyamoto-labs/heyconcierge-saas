# Polymarket Trading Bot - Setup Guide

## 🎯 Summary

Your Polymarket account has **$77.29 USDC** but it's in a **Magic wallet** (proxy wallet) that we can't sign orders for programmatically. The solution is to transfer funds to your EOA wallet.

## 📊 Current Situation

| Wallet Type | Balance | Can Trade via Bot |
|-------------|---------|-------------------|
| Magic Wallet (signature_type=1) | **$77.29 USDC** | ❌ No - signature rejected |
| EOA Wallet (signature_type=0) | $0.00 USDC | ✅ Yes - working |

Both wallets use the same address: `0x114B7A51A4cF04897434408bd9003626705a2208`

The difference is how Polymarket verifies signatures:
- **Magic wallet**: Uses Polymarket's Magic Link SDK for signing (web UI only)
- **EOA wallet**: Uses standard Ethereum signatures (bot-compatible)

## ✅ Solution: Transfer Funds to EOA

### Option A: Withdraw via Polymarket UI (Recommended)

1. Go to https://polymarket.com
2. Log in with your email (Magic wallet)
3. Click your profile → **Wallet** → **Withdraw**
4. Withdraw to an external wallet
5. Deposit directly to Polymarket as an EOA wallet (not Magic)

### Option B: Use a New/Existing EOA Wallet

1. Create a new wallet or use an existing Polygon wallet
2. Deposit USDC on Polygon to this wallet
3. Update the private key in the bot configuration

## 🔧 Bot Configuration

The bot is located at: `/Users/erik/.openclaw/workspace/polymarket_production_trader.py`

Key configuration in the `Config` class:

```python
# Wallet - EOA (signature_type=0)
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
SIGNATURE_TYPE = 0  # EOA signing - IMPORTANT!

# Trading
PAPER_TRADING = True  # Set to False for live trading
POSITION_SIZE_USD = 5.0  # Default position size
```

## 🚀 Running the Bot

### Test Mode (Recommended First)
```bash
python3 polymarket_production_trader.py test
```

### Full Autonomous Mode
```bash
python3 polymarket_production_trader.py
```

## 📋 What Was Built

### Files Created/Modified
- `polymarket_production_trader.py` - New production trading bot
- `polymarket_autonomous_trader.py` - Original bot (unchanged)

### Libraries Installed (from Polymarket's official repos)
- `py-clob-client` - CLOB API client
- `py-order-utils` - Order building and EIP-712 signing
- `poly-eip712-structs` - EIP-712 struct encoding

### Features Implemented
- ✅ Proper EIP-712 signing for orders
- ✅ API credential creation/derivation
- ✅ Balance and allowance checking
- ✅ Market discovery (via Gamma API)
- ✅ Limit orders (GTC, GTD, FOK, FAK)
- ✅ Market orders (FOK)
- ✅ Order cancellation
- ✅ Trade history
- ✅ Paper trading mode
- ✅ Safety limits (daily loss, consecutive losses, rate limits)

## 🔐 Security Notes

1. **Never share your private key**
2. The private key is stored in the code - move to environment variables for production
3. Paper trading mode is ON by default - set `PAPER_TRADING = False` for real trading
4. The bot has built-in safety limits

## 🧪 Verified Working

- ✅ Authentication with Polymarket CLOB API
- ✅ Balance queries (both signature types)
- ✅ Market discovery
- ✅ Orderbook access
- ✅ Order signing (EIP-712)
- ⚠️ Order submission - requires EOA balance

## 📝 Technical Details

### Why Magic Wallet Signatures Don't Work

Polymarket uses different signature verification for different wallet types:

1. **EOA (signature_type=0)**: Standard ecrecover verification
2. **Magic/Proxy (signature_type=1)**: EIP-1271 smart contract verification

When you logged into Polymarket with email, it created a Magic wallet. Magic's private key is managed by their infrastructure, not by you. The private key you have derives to the same address but isn't the key Magic uses for signing.

### EIP-712 Signing Implementation

The bot uses Polymarket's official libraries:

```python
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# Create authenticated client
client = ClobClient(
    host="https://clob.polymarket.com",
    key=PRIVATE_KEY,
    chain_id=137,
    signature_type=0,  # EOA
)

# Create and sign order
order_args = OrderArgs(
    token_id=TOKEN_ID,
    price=0.50,
    size=10.0,
    side=BUY,
)
signed = client.create_order(order_args)
response = client.post_order(signed, OrderType.GTC)
```

---

## Next Steps

1. **Transfer funds** from Magic wallet to EOA (see options above)
2. **Test with paper trading** to verify everything works
3. **Enable live trading** by setting `PAPER_TRADING = False`
4. **Monitor** the bot and adjust parameters as needed

Questions? The bot's code is well-documented and follows Polymarket's official examples.

---

*Built by MIYAMOTO LABS - 2026-02-06*
