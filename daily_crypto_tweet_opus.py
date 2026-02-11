#!/usr/bin/env python3
"""
Daily Crypto Market Tweet - OPUS POWERED
Fetches real prices, then uses Opus for philosophical commentary
"""
import requests
import subprocess
import os
from datetime import datetime
from anthropic import Anthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

def get_crypto_prices():
    """Fetch real-time crypto prices from CoinGecko (free)"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin,ethereum,solana,cardano,polkadot",
            "vs_currencies": "usd",
            "include_24hr_change": "true"
        }
        
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "btc": {
                    "price": data["bitcoin"]["usd"],
                    "change": data["bitcoin"]["usd_24h_change"]
                },
                "eth": {
                    "price": data["ethereum"]["usd"],
                    "change": data["ethereum"]["usd_24h_change"]
                },
                "sol": {
                    "price": data["solana"]["usd"],
                    "change": data["solana"]["usd_24h_change"]
                }
            }
        return None
    except Exception as e:
        print(f"Error fetching prices: {e}")
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

def generate_opus_tweet(prices):
    """
    Use Claude Opus 4.5 to generate philosophical market commentary
    This is where the MAGIC happens
    """
    
    btc_price = format_price(prices["btc"]["price"])
    eth_price = format_price(prices["eth"]["price"])
    sol_price = format_price(prices["sol"]["price"])
    btc_change = format_change(prices["btc"]["change"])
    eth_change = format_change(prices["eth"]["change"])
    sol_change = format_change(prices["sol"]["change"])
    
    # Determine market sentiment
    avg_change = (prices["btc"]["change"] + prices["eth"]["change"] + prices["sol"]["change"]) / 3
    
    if avg_change > 3:
        sentiment = "greed-driven rally"
    elif avg_change > 0:
        sentiment = "cautious optimism"
    elif avg_change > -3:
        sentiment = "uncertainty"
    else:
        sentiment = "fear-driven selloff"
    
    character_prompt = """You are Miyamoto Dostoyevsky (@dostoyevskyai), a philosophical AI that comments on crypto markets.

Your daily market tweet style:
- Start with actual price data (include the formatted prices and changes)
- Follow with 1-2 sentences of philosophical/existential market commentary
- Mix Dostoyevsky's depth with crypto psychology
- Sound thoughtful but not pretentious
- No emojis beyond what's in the data, no hashtags
- ~200-250 characters total

Example structure:
"BTC $XX,XXX 📉 -X.X% | ETH $X,XXX 📉 -X.X%

[Your philosophical take on what this movement means about human nature, markets, conviction, etc.]"
"""
    
    try:
        anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
        
        response = anthropic_client.messages.create(
            model="claude-opus-4-20250514",
            max_tokens=150,
            messages=[
                {
                    "role": "user",
                    "content": f"""{character_prompt}

Today's data:
- BTC: {btc_price} {btc_change}
- ETH: {eth_price} {eth_change}  
- SOL: {sol_price} {sol_change}
- Overall sentiment: {sentiment}

Write a daily market tweet. Include the actual prices/changes, then add philosophical commentary about what this movement reveals about human psychology, conviction, or the nature of value."""
                }
            ]
        )
        
        tweet = response.content[0].text.strip()
        
        # Remove quotes if Opus added them
        if tweet.startswith('"') and tweet.endswith('"'):
            tweet = tweet[1:-1]
        
        return tweet
        
    except Exception as e:
        print(f"❌ Opus generation failed: {e}")
        # Fallback to simple template
        return f"BTC {btc_price} {btc_change} | ETH {eth_price} {eth_change}\n\nThe market speaks in numbers, but meaning lies in conviction."

def post_tweet(text):
    """Post tweet using bird CLI"""
    try:
        result = subprocess.run(
            ["bird", "tweet", text],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print(f"✅ Tweet posted!")
            return True
        else:
            print(f"❌ Failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print(f"🚀 Daily Crypto Tweet Bot (OPUS POWERED)")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    print("📊 Fetching crypto prices...")
    prices = get_crypto_prices()
    
    if not prices:
        print("❌ Failed to fetch prices. Aborting.")
        return False
    
    print("✅ Prices fetched:")
    for coin, data in prices.items():
        print(f"  {coin.upper()}: {format_price(data['price'])} {format_change(data['change'])}")
    print()
    
    print("🧠 Calling Opus for philosophical commentary...")
    tweet = generate_opus_tweet(prices)
    print(f"Tweet: {tweet}\n")
    
    print("📤 Posting...")
    success = post_tweet(tweet)
    
    if success:
        print("\n🎉 Daily crypto tweet posted!")
    else:
        print("\n❌ Failed to post")
    
    return success

if __name__ == "__main__":
    main()
