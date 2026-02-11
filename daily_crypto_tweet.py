#!/usr/bin/env python3
"""
MIYAMOTO LABS - Daily Crypto Market Tweet
Fetches real-time prices from Hyperliquid (trader-grade data, same feed our bots use)
Generates AI-driven market analysis with actual trading signals
Website: https://miyamotolabs.com
"""
import requests
import json
from datetime import datetime

def get_crypto_prices():
    """Fetch real-time crypto prices from Hyperliquid (fast, accurate, trader-grade data)"""
    try:
        from hyperliquid.info import Info
        from hyperliquid.utils import constants
        
        # Initialize Hyperliquid Info API (read-only, no auth needed)
        info = Info(constants.MAINNET_API_URL, skip_ws=True)
        
        # Get all mid prices
        mids = info.all_mids()
        
        # Calculate 24h changes using market snapshot
        def get_24h_change(asset: str) -> float:
            try:
                # Get meta data which includes 24h stats
                meta = info.meta()
                for coin_info in meta.get('universe', []):
                    if coin_info.get('name') == asset:
                        # Use funding rate as proxy for directional bias
                        # Or calculate from day candles
                        day_candles = info.candles_snapshot(
                            coin=asset,
                            interval="1d",
                            startTime=int((datetime.now().timestamp() - 172800) * 1000),  # 2 days back
                            endTime=int(datetime.now().timestamp() * 1000)
                        )
                        if day_candles and len(day_candles) >= 2:
                            yesterday_close = float(day_candles[-2].get('c', 0))
                            current = float(mids.get(asset, 0))
                            if yesterday_close > 0:
                                return ((current - yesterday_close) / yesterday_close) * 100
                return 0.0
            except Exception as e:
                print(f"  ⚠️  24h change calc failed for {asset}: {e}")
                return 0.0
        
        return {
            "btc": {
                "price": float(mids.get("BTC", 0)),
                "change": get_24h_change("BTC")
            },
            "eth": {
                "price": float(mids.get("ETH", 0)),
                "change": get_24h_change("ETH")
            },
            "sol": {
                "price": float(mids.get("SOL", 0)),
                "change": get_24h_change("SOL")
            }
        }
    except Exception as e:
        print(f"Error fetching Hyperliquid prices: {e}")
        return None

def format_price(price):
    """Format price nicely"""
    if price >= 1000:
        return f"${price:,.0f}"
    elif price >= 1:
        return f"${price:.2f}"
    else:
        return f"${price:.4f}"

def format_change(change):
    """Format 24h change with emoji"""
    emoji = "📈" if change > 0 else "📉"
    return f"{emoji} {change:+.1f}%"

def generate_philosophical_take(prices):
    """Generate MIYAMOTO LABS market analysis"""
    btc_price = format_price(prices["btc"]["price"])
    eth_price = format_price(prices["eth"]["price"])
    btc_change = format_change(prices["btc"]["change"])
    eth_change = format_change(prices["eth"]["change"])
    
    # Determine market sentiment
    avg_change = (prices["btc"]["change"] + prices["eth"]["change"]) / 2
    
    if avg_change > 2:
        sentiment = "momentum building"
        action = "Bots are positioning long"
    elif avg_change > 0:
        sentiment = "steady accumulation phase"
        action = "Systems monitoring for entry"
    elif avg_change > -2:
        sentiment = "consolidation zone"
        action = "Waiting for confirmation"
    else:
        sentiment = "volatility spike detected"
        action = "Risk management active"
    
    # Get SOL price for full market view
    sol_price = format_price(prices["sol"]["price"]) if "sol" in prices else None
    sol_change = format_change(prices["sol"]["change"]) if "sol" in prices else None
    
    # Generate MIYAMOTO LABS branded tweet
    templates = [
        f"Market Scan 🤖\n\nBTC {btc_price} {btc_change}\nETH {eth_price} {eth_change}\nSOL {sol_price} {sol_change}\n\n{sentiment.capitalize()}. {action}.\n\nTrader-grade data. Hyperliquid real-time.\n\n— MIYAMOTO LABS",
        
        f"Daily Analysis 📊\n\nBitcoin {btc_price} {btc_change}\nEthereum {eth_price} {eth_change}\nSolana {sol_price} {sol_change}\n\n{sentiment} | {action}\n\nSame data our bots trade on. Hyperliquid API.\n\n— MIYAMOTO LABS",
        
        f"Market Update:\n• BTC {btc_price} {btc_change}\n• ETH {eth_price} {eth_change}\n• SOL {sol_price} {sol_change}\n\nStatus: {sentiment.capitalize()}\nAction: {action}\n\nReal-time. Trader-grade. No delays.\n\n— MIYAMOTO LABS 🚀",
        
        f"BTC {btc_price} {btc_change} | ETH {eth_price} {eth_change} | SOL {sol_price} {sol_change}\n\n{sentiment.capitalize()}. {action}.\n\nHyperliquid real-time data. Same feed our bots use.\n\n— MIYAMOTO LABS",
    ]
    
    import random
    return random.choice(templates)

def post_tweet(text):
    """Post tweet using tweepy v2 API"""
    try:
        import tweepy
        
        # OAuth credentials
        API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
        API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
        ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
        ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
        
        # Use v2 Client (pay-per-use accounts require v2, not v1.1)
        client = tweepy.Client(
            consumer_key=API_KEY,
            consumer_secret=API_SECRET,
            access_token=ACCESS_TOKEN,
            access_token_secret=ACCESS_TOKEN_SECRET
        )
        
        # Post tweet using v2 API
        result = client.create_tweet(text=text)
        tweet_id = result.data['id']
        print(f"✅ Tweet posted successfully!")
        print(f"Tweet ID: {tweet_id}")
        print(f"URL: https://twitter.com/dostoyevskyai/status/{tweet_id}")
        return True
    except Exception as e:
        print(f"❌ Error posting tweet: {e}")
        return False

def main():
    print(f"🚀 Daily Crypto Tweet Bot")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Fetch real prices
    print("📊 Fetching crypto prices...")
    prices = get_crypto_prices()
    
    if not prices:
        print("❌ Failed to fetch prices. Aborting to avoid posting fake data.")
        return False
    
    print("✅ Prices fetched:")
    for coin, data in prices.items():
        print(f"  {coin.upper()}: {format_price(data['price'])} {format_change(data['change'])}")
    print()
    
    # Generate tweet
    print("✍️  Generating philosophical take...")
    tweet = generate_philosophical_take(prices)
    print(f"Tweet: {tweet}")
    print()
    
    # Post
    print("📤 Posting tweet...")
    success = post_tweet(tweet)
    
    if success:
        print("\n🎉 Daily crypto tweet posted successfully!")
    else:
        print("\n❌ Failed to post tweet")
    
    return success

if __name__ == "__main__":
    main()
