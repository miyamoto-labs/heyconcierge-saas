#!/usr/bin/env python3
"""
Trade Execution Server for Hyperliquid
Listens on localhost:8420, executes market orders via Hyperliquid SDK.
Called by the trading terminal's Quick Trade buttons.
"""

import json
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account

app = Flask(__name__)
CORS(app)  # Allow calls from the trading terminal

# Load config
with open("/Users/erik/.openclaw/workspace/.hyperliquid_config.json", "r") as f:
    config = json.load(f)

WALLET = config["public_wallet"]
API_KEY = config["api_private_key"]

# Init SDK
info = Info(skip_ws=True)
account = Account.from_key(API_KEY)
exchange = Exchange(account, account_address=WALLET)

print(f"✅ Trade server initialized | Wallet: {WALLET[:10]}...")


def get_mid_price(asset: str) -> float:
    mids = info.all_mids()
    return float(mids[asset])


# Minimum order sizes for Hyperliquid (in asset units)
MIN_SIZES = {
    "BTC": 0.001,   # ~$70
    "ETH": 0.01,    # ~$30
    "SOL": 0.1,     # ~$20
}
DEFAULT_MIN = 0.001


@app.route("/trade", methods=["POST"])
def trade():
    data = request.json
    direction = data.get("direction")  # LONG or SHORT
    asset = data.get("asset", "BTC")
    size_usd = float(data.get("size", 25))
    leverage = int(data.get("leverage", 5))

    if direction not in ("LONG", "SHORT"):
        return jsonify({"error": "direction must be LONG or SHORT"}), 400

    try:
        # Get current price
        price = get_mid_price(asset)
        
        # Calculate size in asset units
        size = round(size_usd / price, 6)
        
        # Enforce minimum size
        min_size = MIN_SIZES.get(asset, DEFAULT_MIN)
        if size < min_size:
            size = min_size
            size_usd = size * price
        
        is_buy = direction == "LONG"

        # Set leverage
        exchange.update_leverage(leverage, asset)

        # Execute market order
        result = exchange.market_open(asset, is_buy, size, None, 0.01)

        ts = datetime.now().strftime("%H:%M:%S")

        if result.get("status") == "ok":
            # Try to get fill info
            fill_price = price  # fallback
            statuses = result.get("response", {}).get("data", {}).get("statuses", [])
            for s in statuses:
                if "filled" in s:
                    fill_price = float(s["filled"]["totalSz"]) and float(s["filled"]["avgPx"]) or price

            print(f"[{ts}] ✅ {direction} {asset} ${size_usd} @ ${price:,.2f} (lev {leverage}x)")
            return jsonify({
                "success": True,
                "direction": direction,
                "asset": asset,
                "size_usd": size_usd,
                "size": size,
                "price": price,
                "leverage": leverage,
                "result": result,
                "timestamp": ts,
            })
        else:
            print(f"[{ts}] ❌ {direction} {asset} failed: {result}")
            return jsonify({"success": False, "error": str(result)}), 500

    except Exception as e:
        print(f"❌ Trade error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/close", methods=["POST"])
def close_position():
    data = request.json or {}
    asset = data.get("asset", "BTC")

    try:
        result = exchange.market_close(asset)
        ts = datetime.now().strftime("%H:%M:%S")

        if result.get("status") == "ok":
            print(f"[{ts}] ✅ Closed {asset} position")
            return jsonify({"success": True, "result": result})
        else:
            print(f"[{ts}] ❌ Close failed: {result}")
            return jsonify({"success": False, "error": str(result)}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/position", methods=["GET"])
def get_position():
    asset = request.args.get("asset", "BTC")
    try:
        state = info.user_state(WALLET)
        for p in state.get("assetPositions", []):
            pos = p.get("position", {})
            if pos.get("coin") == asset:
                size = float(pos.get("szi", 0))
                if size != 0:
                    return jsonify({
                        "in_position": True,
                        "side": "LONG" if size > 0 else "SHORT",
                        "size": abs(size),
                        "entry_price": float(pos.get("entryPx", 0)),
                        "unrealized_pnl": float(pos.get("unrealizedPnl", 0)),
                        "leverage": pos.get("leverage", {}),
                    })
        return jsonify({"in_position": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/balance", methods=["GET"])
def get_balance():
    try:
        state = info.user_state(WALLET)
        margin = state.get("marginSummary", {})
        return jsonify({
            "account_value": float(margin.get("accountValue", 0)),
            "total_margin_used": float(margin.get("totalMarginUsed", 0)),
            "withdrawable": float(margin.get("totalRawUsd", 0)),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "wallet": WALLET[:10] + "..."})


if __name__ == "__main__":
    print(f"🚀 Trade server starting on http://localhost:8420")
    app.run(host="127.0.0.1", port=8420, debug=False)
