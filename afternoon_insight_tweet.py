#!/usr/bin/env python3
"""
MIYAMOTO LABS - Afternoon Insight Tweet (2 PM Oslo)
Mixes: Market insights, trading wisdom, memes, hot takes
Fills content gap between morning data (9 AM) and evening promo (8 PM)
"""
import random
import json
from datetime import datetime
from pathlib import Path
import tweepy
from crypto_prices import get_multiple_prices, format_price, format_change

# Twitter OAuth
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

# State file to track what we've posted
STATE_FILE = Path.home() / ".openclaw" / "workspace" / "afternoon_tweet_state.json"

# Tweet templates by category
TWEET_TEMPLATES = {
    "insight": [
        "Why most traders lose:\n\n❌ Emotion-driven entries\n❌ No risk management\n❌ Revenge trading\n❌ Position sizing by feel\n\nWhy bots win:\n\n✅ Zero emotion\n✅ Strict stop losses\n✅ Position limits enforced\n✅ No ego\n\n— MIYAMOTO LABS 🤖",
        
        "The autonomous trading edge:\n\n🔹 Humans: See pattern, hesitate, miss entry\n🔹 Bots: See pattern, execute in 200ms\n\nSpeed isn't everything. But it's a LOT.\n\nMIYAMOTO LABS - Man + Machine",
        
        "Unpopular opinion:\n\nMost algo traders overcomplicate.\n\n❌ Complex ML models\n❌ 47 indicators\n❌ Curve-fitted to history\n\n✅ Simple strategy\n✅ Strict risk rules\n✅ Fast execution\n\nSurvival > genius.\n\n— MIYAMOTO LABS",
        
        "7 layers of risk management > 1 genius strategy.\n\nYou can be right 80% of the time.\n\nBut if that 20% blows up your account?\n\nYou lose.\n\nMIYAMOTO LABS: Survival first. Alpha second. 🛡️",
        
        "Chainlink lag arbitrage explained:\n\n1. Oracles update every N blocks\n2. Price moves BEFORE oracle updates\n3. Fast bots front-run the update\n4. Profit = speed advantage\n\nWe're building one.\n\nMIYAMOTO LABS 🚀 #DeFi",
        
        "Why I built MIYAMOTO LABS:\n\n❌ Manual trading = 24/7 grind\n❌ Signal groups = delayed (you're exit liquidity)\n❌ Copy trading = trust random people\n❌ DIY bots = need to code\n\n✅ Autonomous + transparent + fast\n\nThis is the future.",
        
        "The only 3 things that matter in trading:\n\n1. Edge (do you have one?)\n2. Risk (will you survive drawdowns?)\n3. Execution (can you actually do it?)\n\nBots solve #3.\nHumans provide #1.\n\n#2 is where most die.\n\nMIYAMOTO LABS",
        
        "Real talk: Crypto trading is RISKY.\n\n⚠️ You can lose money\n⚠️ Bots aren't magic\n⚠️ Past ≠ future\n\nBut:\n\n✅ 7-layer risk management\n✅ Full transparency\n✅ Speed edge (200ms)\n\nWe have a shot.\n\n— MIYAMOTO LABS",
    ],
    
    "data_driven": [
        "{market_snapshot}\n\nVolatility = opportunity.\n\nOur bots:\n• Chainlink lag arb: Watching\n• Hyperliquid multi-TF: Positioned\n• Risk mgmt: Active\n\nThis is how you trade: Data, not emotion.\n\nMIYAMOTO LABS 🤖",
        
        "Market check 📊\n\n{market_snapshot}\n\n{sentiment_line}\n\nFast data. Fast execution. No emotion.\n\nSame feed our bots use.\n\n— MIYAMOTO LABS",
        
        "{market_snapshot}\n\nThe edge:\n\n🔸 10x faster data (internal APIs)\n🔸 200ms execution speed\n🔸 Zero emotional bias\n🔸 Risk caps enforced by code\n\nMan + Machine.\n\nMIYAMOTO LABS 🚀",
    ],
    
    "build_story": [
        "Built 2 trading bots in 5 hours using Claude AI.\n\n• Chainlink lag arbitrage: 2.5h\n• Hyperliquid multi-TF trader: 2.5h\n\nNow validating with real money ($100).\n\nThis is the future: Man + Machine shipping at light speed.\n\nMIYAMOTO LABS 🤖💰",
        
        "Why autonomous doesn't mean reckless:\n\n✅ Max 2% risk per trade\n✅ Stop-loss on EVERY position\n✅ Daily loss caps\n✅ Drawdown protection\n✅ Emergency kill switch\n✅ Real-time monitoring\n✅ Manual override\n\nMIYAMOTO LABS = controlled automation.",
        
        "Tech stack reveal:\n\n🔸 Python 3.11 (trading logic)\n🔸 OpenClaw (AI orchestration)\n🔸 DeepSeek (70x cheaper than GPT-4)\n🔸 Unbrowse.ai (internal API access = 10x faster)\n🔸 Hyperliquid (zero fees, fast fills)\n\nBuilt with AI. Runs autonomously.\n\nMIYAMOTO LABS 🤖",
        
        "The MIYAMOTO LABS philosophy:\n\n🔹 Automate what's boring (execution)\n🔹 Enhance what's hard (pattern recognition)\n🔹 Keep what matters (human oversight)\n\nNot replacing traders.\n\nAmplifying them.\n\n#AITrading",
    ],
    
    "humor": [
        "Me: I'll just check the charts once.\n\nAlso me: *opens TradingView at 3 AM on a Sunday*\n\n(This is why bots are better. They don't check charts at 3 AM. They just trade.)\n\nMIYAMOTO LABS 🤖😴",
        
        "Bears: Crypto is dead 💀\nBulls: To the moon! 🚀\nBots: *calculating optimal entry*\n\nEmotion-free since 2026.\n\nMIYAMOTO LABS",
        
        "Humans: \"What if I'm wrong?\"\nBots: \"Stop loss set. Next trade.\"\n\nBe like bots.\n\n— MIYAMOTO LABS 🤖",
        
        "Trading without bots:\n- Watch charts 24/7 ☠️\n- Miss entries while sleeping 😴\n- Emotional decisions 😱\n- Revenge trading 🤬\n\nTrading WITH bots:\n- Go touch grass 🌿\n\nMIYAMOTO LABS",
    ],
    
    "question": [
        "Question for crypto Twitter:\n\nWhat's the biggest mistake you made in trading?\n\nMine: Trading based on \"feeling\" instead of data.\n\nThat's why I built bots. They don't feel.\n\nMIYAMOTO LABS 🤖",
        
        "Poll time:\n\nWhat's your biggest challenge in crypto trading?\n\nA) Finding good entries\nB) Risk management\nC) Emotional discipline\nD) Staying awake 24/7\n\n(Hint: Bots solve all except B)\n\nMIYAMOTO LABS",
        
        "Real talk: Would you trust a fully autonomous trading bot with your crypto?\n\nConditions:\n- Open source strategy\n- Transparent P&L\n- 7-layer risk management\n- You hold the keys\n\nThis is what we're building.\n\nMIYAMOTO LABS 🤖",
    ]
}

def load_state():
    """Load tweet state"""
    if STATE_FILE.exists():
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        "last_posted": None,
        "posted_categories": [],
        "tweet_count": 0
    }

def save_state(state):
    """Save tweet state"""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_market_snapshot():
    """Get quick market summary for data-driven tweets"""
    try:
        prices = get_multiple_prices(["BTC", "ETH", "SOL"])
        if not prices:
            return None
        
        snapshot = []
        for symbol, data in prices.items():
            price = format_price(data["price"])
            change = format_change(data["change_24h"])
            snapshot.append(f"{symbol} {price} {change}")
        
        return " | ".join(snapshot)
    except:
        return None

def get_market_sentiment(prices):
    """Determine market sentiment line"""
    if not prices:
        return "Sideways action. Bots waiting."
    
    avg_change = sum(p["change_24h"] for p in prices.values()) / len(prices)
    
    if avg_change > 3:
        return "Bullish momentum. Systems long-biased."
    elif avg_change > 1:
        return "Steady uptrend. Bots accumulating."
    elif avg_change > -1:
        return "Consolidation zone. Waiting for confirmation."
    elif avg_change > -3:
        return "Dip territory. Risk-on or wait?"
    else:
        return "Volatility spike. Risk management active."

def select_tweet(state):
    """Select next tweet, rotating categories"""
    recent = state.get("posted_categories", [])[-5:]  # Last 5
    
    # Category weights (more insights/data, less humor)
    weights = {
        "insight": 3,
        "data_driven": 2,
        "build_story": 2,
        "humor": 1,
        "question": 1
    }
    
    # Reduce weight for recently used categories
    for cat in recent:
        if cat in weights:
            weights[cat] = max(0.5, weights[cat] - 1)
    
    # Weighted random selection
    categories = list(weights.keys())
    category_weights = [weights[c] for c in categories]
    selected_category = random.choices(categories, weights=category_weights)[0]
    
    # Pick random template from category
    template = random.choice(TWEET_TEMPLATES[selected_category])
    
    return selected_category, template

def format_tweet(template):
    """Format tweet with dynamic data"""
    # If template needs market data
    if "{market_snapshot}" in template:
        snapshot = get_market_snapshot()
        if not snapshot:
            # Fallback to non-data tweet if API fails
            return random.choice(TWEET_TEMPLATES["insight"])
        
        template = template.replace("{market_snapshot}", snapshot)
        
        # Add sentiment if needed
        if "{sentiment_line}" in template:
            prices = get_multiple_prices(["BTC", "ETH", "SOL"])
            sentiment = get_market_sentiment(prices)
            template = template.replace("{sentiment_line}", sentiment)
    
    return template

def post_tweet(text):
    """Post tweet via tweepy v2"""
    try:
        client = tweepy.Client(
            consumer_key=API_KEY,
            consumer_secret=API_SECRET,
            access_token=ACCESS_TOKEN,
            access_token_secret=ACCESS_TOKEN_SECRET
        )
        
        result = client.create_tweet(text=text)
        tweet_id = result.data['id']
        
        print(f"✅ Tweet posted!")
        print(f"URL: https://twitter.com/dostoyevskyai/status/{tweet_id}")
        return tweet_id
    except Exception as e:
        print(f"❌ Post failed: {e}")
        return None

def main():
    print("🌅 Afternoon Insight Tweet - MIYAMOTO LABS")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Load state
    state = load_state()
    print(f"Tweet #{state['tweet_count'] + 1}\n")
    
    # Select tweet
    category, template = select_tweet(state)
    tweet_text = format_tweet(template)
    
    print(f"Category: {category}")
    print(f"Length: {len(tweet_text)} chars\n")
    print("-" * 60)
    print(tweet_text)
    print("-" * 60)
    
    # Post
    tweet_id = post_tweet(tweet_text)
    
    if tweet_id:
        state["last_posted"] = datetime.now().isoformat()
        state["posted_categories"].append(category)
        state["tweet_count"] += 1
        save_state(state)
        print(f"\n✅ Success! Total tweets: {state['tweet_count']}")
    else:
        print("\n❌ Failed to post")

if __name__ == "__main__":
    main()
