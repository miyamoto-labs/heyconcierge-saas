#!/usr/bin/env python3
"""
Daily promotional tweet - Building in public
Rotates through different angles/topics to avoid repetition
Tracks what was posted to vary content
"""

import json
import os
import random
from datetime import datetime
from pathlib import Path
import tweepy

# Twitter API credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

# State file to track what we've posted
STATE_FILE = Path.home() / ".openclaw" / "workspace" / "promo_tweet_state.json"

# Tweet templates (rotated to avoid repetition)
TWEET_TEMPLATES = [
    # Product focus
    {
        "template": "Building MIYAMOTO LABS 🤖\n\n✅ Chainlink lag arbitrage bot (65-75% win rate)\n✅ Hyperliquid multi-timeframe trader\n✅ 7-layer risk management\n\nTrading with $100 to prove it works before scaling.\n\nMan + Machine = Future of Finance 🚀",
        "category": "product"
    },
    {
        "template": "Day {day} building autonomous trading systems.\n\n🤖 2 bots running 24/7\n💰 Real money validation ($100)\n📊 Full transparency (wins AND losses)\n\nNo promises. Just results.\n\nFollow the journey 👇\n#AITrading #BuildInPublic",
        "category": "progress"
    },
    {
        "template": "Why autonomous trading?\n\n❌ Manual: Emotional, slow, 24/7 grind\n✅ AI: Emotionless, 200ms speed, never sleeps\n\n7 layers of risk management.\nTransparent performance.\nYou control the keys.\n\nMIYAMOTO LABS 🚀\n#CryptoTrading",
        "category": "value_prop"
    },
    {
        "template": "Built 2 trading bots in 5 hours using Claude AI.\n\n• Chainlink lag arbitrage: 2.5h\n• Hyperliquid trader: 2.5h\n\nNow validating with real money ($100).\n\nThis is the future: Man + Machine shipping products at light speed.\n\nMIYAMOTO LABS 🤖💰",
        "category": "build_speed"
    },
    {
        "template": "Trading bot transparency update:\n\n💵 Capital: $100\n📈 Strategy: Chainlink lag + Hyperliquid multi-TF\n⏱️ Runtime: {hours}h\n🎯 Status: Validating\n\nFull results shared weekly.\n\nNo hype. Just honest building.\n\nMIYAMOTO LABS 🚀\n#AlgoTrading",
        "category": "update"
    },
    {
        "template": "The MIYAMOTO LABS edge:\n\n🔸 10x faster data (Unbrowse.ai internal APIs)\n🔸 Multi-layer risk protection (prevents blowups)\n🔸 Full transparency (I trade my own money first)\n🔸 Token utility (holders get bot discounts)\n\nNot vaporware. Working products.\n\n#DeFi #AI",
        "category": "edge"
    },
    {
        "template": "Beta testers wanted 👀\n\nLaunching autonomous crypto trading bots.\n\n✅ Chainlink lag arbitrage\n✅ Hyperliquid multi-timeframe\n✅ Complete setup + support\n\n$299 beta pricing (50% off)\n\nDM if interested.\n\nMIYAMOTO LABS 🤖",
        "category": "cta"
    },
    {
        "template": "Building in public philosophy:\n\n🔹 Share wins AND losses\n🔹 Validate with real money first\n🔹 Transparent code (GitHub)\n🔹 Honest timelines\n🔹 Community > hype\n\nMIYAMOTO LABS isn't a promise.\n\nIt's a journey. Come along. 🚀",
        "category": "philosophy"
    },
    {
        "template": "Autonomous doesn't mean reckless.\n\n7 layers of protection:\n✅ Max 2% per trade\n✅ Stop-loss every position\n✅ Position limits\n✅ Daily loss caps\n✅ Drawdown protection\n✅ Emergency kill switch\n✅ Real-time monitoring\n\nMIYAMOTO LABS 🤖\n#RiskManagement",
        "category": "risk"
    },
    {
        "template": "Why I'm building MIYAMOTO LABS:\n\n❌ Trading is exhausting\n❌ Signal services delay kills profits\n❌ Copy trading = platform lock-in\n❌ DIY bots = coding required\n\n✅ True autonomy + transparency + speed\n\nThe future of finance. 🚀\n#AITrading",
        "category": "why"
    },
    {
        "template": "Technical stack reveal:\n\n🔸 Python 3.11 (trading logic)\n🔸 OpenClaw (AI orchestration) \n🔸 DeepSeek (70x cheaper than GPT-4)\n🔸 Unbrowse.ai (internal API access)\n🔸 Hyperliquid (zero fees)\n\nBuilt with AI. Runs autonomously.\n\nMIYAMOTO LABS 🤖",
        "category": "tech"
    },
    {
        "template": "Real talk: Crypto trading is RISKY.\n\n⚠️ You can lose money\n⚠️ Bots aren't magic\n⚠️ Past ≠ future\n\nBut with 7-layer risk management + transparency + speed?\n\nWe have an edge.\n\nMIYAMOTO LABS: Honest automation.\n\n#CryptoTrading",
        "category": "reality_check"
    }
]

def load_state():
    """Load state from JSON file"""
    if STATE_FILE.exists():
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        "last_posted": None,
        "posted_categories": [],
        "tweet_count": 0,
        "start_date": datetime.now().isoformat()
    }

def save_state(state):
    """Save state to JSON file"""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_days_since_start(state):
    """Calculate days since we started building"""
    if state.get("start_date"):
        start = datetime.fromisoformat(state["start_date"])
        return (datetime.now() - start).days + 1
    return 1

def get_hours_running(state):
    """Calculate hours bots have been running"""
    # Bots started Feb 5, 2026 around 9:24 PM Oslo time
    start = datetime(2026, 2, 5, 21, 24)
    return int((datetime.now() - start).total_seconds() / 3600)

def select_tweet(state):
    """Select next tweet template, avoiding recent categories"""
    recent_categories = state.get("posted_categories", [])[-5:]  # Last 5
    
    # Filter out recently used categories
    available = [t for t in TWEET_TEMPLATES 
                 if t["category"] not in recent_categories]
    
    # If all used recently, reset and use all
    if not available:
        available = TWEET_TEMPLATES
    
    selected = random.choice(available)
    return selected

def format_tweet(template_dict, state):
    """Format tweet with dynamic values"""
    template = template_dict["template"]
    
    # Replace dynamic placeholders
    tweet = template.replace("{day}", str(get_days_since_start(state)))
    tweet = tweet.replace("{hours}", str(get_hours_running(state)))
    
    return tweet

def post_tweet(text):
    """Post tweet using tweepy v2 API"""
    try:
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
        return tweet_id
    except Exception as e:
        print(f"❌ Error posting tweet: {e}")
        return None

def main():
    print("🤖 MIYAMOTO LABS - Daily Promotional Tweet")
    print("=" * 50)
    
    # Load state
    state = load_state()
    print(f"Tweet #{state['tweet_count'] + 1}")
    print(f"Days building: {get_days_since_start(state)}")
    print(f"Hours running: {get_hours_running(state)}")
    
    # Select and format tweet
    template = select_tweet(state)
    tweet_text = format_tweet(template, state)
    
    print(f"\nCategory: {template['category']}")
    print(f"\nTweet text ({len(tweet_text)} chars):")
    print("-" * 50)
    print(tweet_text)
    print("-" * 50)
    
    # Post tweet
    tweet_id = post_tweet(tweet_text)
    
    if tweet_id:
        # Update state
        state["last_posted"] = datetime.now().isoformat()
        state["posted_categories"].append(template["category"])
        state["tweet_count"] += 1
        save_state(state)
        print(f"\n✅ State updated. Total tweets: {state['tweet_count']}")
    else:
        print("\n❌ Failed to post tweet. State not updated.")

if __name__ == "__main__":
    main()
