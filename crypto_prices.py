#!/usr/bin/env python3
"""
Real-time crypto price fetcher using CoinGecko API (free, no key needed)
Shared module for all Twitter bots
"""
import requests
from typing import Dict, Optional

# CoinGecko API endpoint (free tier, no key required)
COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"

# Cryptocurrency ID mapping (CoinGecko format)
CRYPTO_IDS = {
    "BTC": "bitcoin",
    "Bitcoin": "bitcoin",
    "ETH": "ethereum",
    "Ethereum": "ethereum",
    "SOL": "solana",
    "Solana": "solana",
    "ADA": "cardano",
    "Cardano": "cardano",
    "XRP": "ripple",
    "Ripple": "ripple",
    "DOT": "polkadot",
    "Polkadot": "polkadot",
    "DOGE": "dogecoin",
    "Dogecoin": "dogecoin",
    "MATIC": "matic-network",
    "Polygon": "matic-network",
    "AVAX": "avalanche-2",
    "Avalanche": "avalanche-2",
    "LINK": "chainlink",
    "Chainlink": "chainlink"
}

def get_crypto_price(symbol: str) -> Optional[Dict]:
    """
    Get current price for a cryptocurrency
    
    Args:
        symbol: Crypto symbol (BTC, ETH, etc.) or name (Bitcoin, Ethereum)
    
    Returns:
        Dict with 'price' and 'change_24h' or None if error
    """
    try:
        # Convert symbol to CoinGecko ID
        crypto_id = CRYPTO_IDS.get(symbol)
        if not crypto_id:
            # Try direct lookup as lowercase
            crypto_id = symbol.lower()
        
        # Fetch price from CoinGecko
        response = requests.get(
            COINGECKO_API,
            params={
                "ids": crypto_id,
                "vs_currencies": "usd",
                "include_24hr_change": "true"
            },
            timeout=5
        )
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        if crypto_id not in data:
            return None
        
        price_data = data[crypto_id]
        
        return {
            "price": price_data.get("usd", 0),
            "change_24h": price_data.get("usd_24h_change", 0)
        }
    
    except Exception as e:
        print(f"⚠️  Price fetch failed for {symbol}: {e}")
        return None

def get_multiple_prices(symbols: list) -> Dict:
    """
    Get prices for multiple cryptocurrencies in one API call
    
    Args:
        symbols: List of crypto symbols (["BTC", "ETH", "SOL"])
    
    Returns:
        Dict mapping symbol to price data
    """
    try:
        # Convert symbols to CoinGecko IDs
        crypto_ids = [CRYPTO_IDS.get(s, s.lower()) for s in symbols]
        
        # Fetch all prices in one request
        response = requests.get(
            COINGECKO_API,
            params={
                "ids": ",".join(crypto_ids),
                "vs_currencies": "usd",
                "include_24hr_change": "true"
            },
            timeout=5
        )
        
        if response.status_code != 200:
            return {}
        
        data = response.json()
        
        # Map back to original symbols
        result = {}
        for symbol in symbols:
            crypto_id = CRYPTO_IDS.get(symbol, symbol.lower())
            if crypto_id in data:
                result[symbol] = {
                    "price": data[crypto_id].get("usd", 0),
                    "change_24h": data[crypto_id].get("usd_24h_change", 0)
                }
        
        return result
    
    except Exception as e:
        print(f"⚠️  Batch price fetch failed: {e}")
        return {}

def format_price(price: float) -> str:
    """
    Format price for display
    
    Args:
        price: Price value
    
    Returns:
        Formatted string (e.g., "$98,432" or "$0.45")
    """
    if price >= 1:
        # For prices >= $1, show no decimals
        return f"${price:,.0f}"
    elif price >= 0.01:
        # For prices $0.01-$0.99, show 2 decimals
        return f"${price:.2f}"
    else:
        # For prices < $0.01, show 4 decimals
        return f"${price:.4f}"

def format_change(change: float) -> str:
    """
    Format 24h price change with emoji
    
    Args:
        change: Percentage change (e.g., -5.5)
    
    Returns:
        Formatted string (e.g., "📉 -5.5%" or "📈 +3.2%")
    """
    emoji = "📈" if change >= 0 else "📉"
    sign = "+" if change >= 0 else ""
    return f"{emoji} {sign}{change:.1f}%"

def get_market_summary() -> str:
    """
    Get a quick market summary of major cryptocurrencies
    
    Returns:
        Formatted string with BTC, ETH, SOL prices
    """
    try:
        prices = get_multiple_prices(["BTC", "ETH", "SOL"])
        
        if not prices:
            return "Market data unavailable"
        
        summary_parts = []
        for symbol, data in prices.items():
            price_str = format_price(data["price"])
            change_str = format_change(data["change_24h"])
            summary_parts.append(f"{symbol} {price_str} {change_str}")
        
        return " | ".join(summary_parts)
    
    except Exception:
        return "Market data unavailable"

# Test function
if __name__ == "__main__":
    print("🧪 Testing Crypto Price API\n")
    
    # Test single price
    btc = get_crypto_price("BTC")
    if btc:
        print(f"✅ Bitcoin: {format_price(btc['price'])} {format_change(btc['change_24h'])}")
    
    # Test multiple prices
    print("\n📊 Market Summary:")
    prices = get_multiple_prices(["BTC", "ETH", "SOL", "ADA"])
    for symbol, data in prices.items():
        print(f"   {symbol}: {format_price(data['price'])} {format_change(data['change_24h'])}")
    
    # Test market summary
    print(f"\n🌍 Quick Summary:\n   {get_market_summary()}")
