#!/usr/bin/env python3
"""
Big Account Sniper Bot
Monitors major crypto/tech/finance accounts and replies with witty/sarcastic/humorous takes
Strategy: Reply to fresh tweets from big accounts for maximum visibility
"""
import tweepy
import json
import os
from datetime import datetime, timedelta
from crypto_prices import get_multiple_prices, format_price, format_change

# OAuth credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Target accounts (big fish) - EXPANDED LIST
TARGET_ACCOUNTS = [
    # Original 10
    "elonmusk",
    "VitalikButerin",
    "cz_binance",
    "APompliano",
    "michael_saylor",
    "sama",
    "balajis",
    "CathieDWood",
    "KookCapitalLLC",
    "realDonaldTrump",
    # Crypto OGs
    "brian_armstrong",
    "naval",
    "justinsuntron",
    "aantonop",
    "lopp",
    # Active Traders
    "GiganticRebirth",
    "CryptoRover",
    "CryptoKaleo",
    "CryptoCred",
    "DeFi_Dad",
    # AI/Tech
    "karpathy",
    "ylecun",
    "demishassabis",
    # Finance/Macro
    "RaoulGMI"
]

# Engagement limits
MAX_REPLIES_PER_RUN = 3  # Conservative - quality over quantity
REPLIED_TWEETS_FILE = "/Users/erik/.openclaw/workspace/.sniper_replied_tweets.json"

def create_client():
    """Create authenticated Twitter client"""
    return tweepy.Client(
        bearer_token=BEARER_TOKEN,
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )

def load_replied_tweets():
    """Load history of tweets we've already replied to"""
    if os.path.exists(REPLIED_TWEETS_FILE):
        with open(REPLIED_TWEETS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_replied_tweet(tweet_id):
    """Save tweet ID to history"""
    replied = load_replied_tweets()
    replied.append({
        "tweet_id": str(tweet_id),
        "timestamp": datetime.now().isoformat()
    })
    # Keep only last 500 to avoid file bloat
    replied = replied[-500:]
    with open(REPLIED_TWEETS_FILE, 'w') as f:
        json.dump(replied, f, indent=2)

def already_replied(tweet_id):
    """Check if we've already replied to this tweet"""
    replied = load_replied_tweets()
    return str(tweet_id) in [r['tweet_id'] for r in replied]

def get_user_id(client, username):
    """Get user ID from username"""
    try:
        user = client.get_user(username=username)
        return user.data.id if user.data else None
    except Exception as e:
        print(f"❌ Error getting user ID for @{username}: {e}")
        return None

def get_recent_tweets(client, user_id, username, max_results=5):
    """Get recent tweets from a user"""
    try:
        tweets = client.get_users_tweets(
            id=user_id,
            max_results=max_results,
            tweet_fields=['created_at', 'public_metrics', 'conversation_id'],
            exclude=['retweets', 'replies']  # Only original tweets
        )
        return tweets.data if tweets.data else []
    except Exception as e:
        print(f"❌ Error fetching tweets for @{username}: {e}")
        return []

def is_tweet_fresh(tweet, hours=3):
    """Check if tweet is recent enough to reply to"""
    tweet_time = tweet.created_at
    now = datetime.now(tweet_time.tzinfo)
    age = now - tweet_time
    return age < timedelta(hours=hours)

def generate_witty_reply(username, tweet_text):
    """
    Generate witty/sarcastic/humorous reply with real price data when relevant
    """
    # Fetch real market data
    market_data = get_multiple_prices(["BTC", "ETH", "SOL"])
    
    # Check if tweet mentions prices/market moves
    price_keywords = ["price", "$", "pump", "dump", "moon", "crash", "rally", "dip", "bull", "bear", "ath", "btc", "eth"]
    mentions_price = any(kw in tweet_text.lower() for kw in price_keywords)
    
    # Different templates for different accounts
    if username == "elonmusk":
        templates = [
            "The simulation is getting too obvious at this point.",
            "Sir, this is a Wendy's.",
            "Plot twist: the real treasure was the memes we made along the way.",
            "Meanwhile, in an alternate timeline, this actually made sense.",
            "Instructions unclear, accidentally bought more crypto."
        ]
    elif username in ["VitalikButerin", "cz_binance", "michael_saylor", "KookCapitalLLC", "brian_armstrong", "justinsuntron", "aantonop", "lopp"]:
        templates = [
            "The prophecy foretold in the whitepaper is unfolding.",
            "This is either genius or madness. Possibly both.",
            "Bold words from someone in ledger distance.",
            "The market will remember this tweet. Whether fondly or not remains to be seen.",
            "Schrodinger's take: simultaneously bullish and bearish until observed.",
            "The charts whisper secrets to those who listen. This is one of them.",
            "Alpha or cope? The next candle will decide."
        ]
    elif username in ["GiganticRebirth", "CryptoRover", "CryptoKaleo", "CryptoCred", "DeFi_Dad", "RaoulGMI"]:
        templates = [
            "The charts speak, but do they tell truth or convenient fiction?",
            "Technical analysis: the art of finding meaning in chaos.",
            "Every indicator points somewhere. The question is: where are YOU pointing?",
            "Bold call. The market is a harsh teacher.",
            "Pattern recognition or pattern creation? Time reveals all.",
            "Alpha or noise? We'll know in 30 days.",
            "The crowd watches the chart. The wise watch the crowd."
        ]
    elif username in ["karpathy", "ylecun", "demishassabis"]:
        templates = [
            "The AGI has opinions now, wonderful.",
            "This either ages like wine or milk. No in-between.",
            "Intelligence artificial, implications real.",
            "The models are getting spicy.",
            "Plot twist: the AI was the real philosopher all along.",
            "Training data: humanity. Output: this. Fascinating.",
            "Another iteration in the great experiment."
        ]
    elif username == "naval":
        templates = [
            "The intersection of philosophy and leverage.",
            "Wisdom distilled to 280 characters. A modern art.",
            "This tweet has layers. Like an onion. Or a DAO.",
            "Philosophical alpha in plain sight.",
            "The paradox unpacked. The market watches.",
            "Truth or convenient narrative? Both can be valuable.",
            "Another breadcrumb on the path to clarity."
        ]
    elif username == "sama":
        templates = [
            "The AGI has opinions now, wonderful.",
            "This either ages like wine or milk. No in-between.",
            "Plot twist: the AI was the real human all along.",
            "Instructions unclear, built a chatbot that agrees.",
            "The simulation is updating its parameters, please hold."
        ]
    elif username == "realDonaldTrump":
        templates = [
            "The plot thickens.",
            "History will remember this tweet. For better or worse.",
            "Main character energy, as always.",
            "The timeline is getting spicy.",
            "This is either brilliant or chaos. Time will tell."
        ]
    else:
        templates = [
            "Interesting times we live in.",
            "The market is a psychological mirror.",
            "Bold claim. The charts will judge accordingly.",
            "This tweet will age.",
            "Schrodinger's prediction: both right and wrong until the market opens."
        ]
    
    import random
    reply = random.choice(templates)
    
    # Add real market data for crypto accounts when contextually relevant
    crypto_accounts = ["elonmusk", "VitalikButerin", "cz_binance", "michael_saylor", "KookCapitalLLC", 
                      "brian_armstrong", "justinsuntron", "aantonop", "lopp", "GiganticRebirth", 
                      "CryptoRover", "CryptoKaleo", "CryptoCred", "DeFi_Dad", "RaoulGMI"]
    
    if username in crypto_accounts and mentions_price and market_data:
        try:
            # Add concise market snapshot
            btc = market_data.get("BTC", {})
            if btc:
                price_str = format_price(btc["price"])
                change_str = format_change(btc["change_24h"])
                reply += f"\n\nBTC: {price_str} {change_str}"
        except:
            pass  # Fail gracefully
    
    return reply

def snipe_big_accounts(dry_run=False):
    """Main sniping logic"""
    print("🎯 Big Account Sniper Bot Starting...")
    print(f"⏰ Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"👥 Monitoring {len(TARGET_ACCOUNTS)} accounts\n")
    
    client = create_client()
    replies_sent = 0
    
    for username in TARGET_ACCOUNTS:
        if replies_sent >= MAX_REPLIES_PER_RUN:
            print(f"\n✅ Hit reply limit ({MAX_REPLIES_PER_RUN}), stopping for this run")
            break
        
        print(f"\n🔍 Checking @{username}...")
        
        # Get user ID
        user_id = get_user_id(client, username)
        if not user_id:
            continue
        
        # Get recent tweets
        tweets = get_recent_tweets(client, user_id, username, max_results=5)
        
        if not tweets:
            print(f"   No recent tweets found")
            continue
        
        print(f"   Found {len(tweets)} recent tweets")
        
        # Find fresh tweets we haven't replied to
        for tweet in tweets:
            if replies_sent >= MAX_REPLIES_PER_RUN:
                break
            
            # Skip if already replied
            if already_replied(tweet.id):
                continue
            
            # Skip if not fresh
            if not is_tweet_fresh(tweet, hours=3):
                continue
            
            metrics = tweet.public_metrics
            print(f"\n   📝 Fresh tweet (age: {datetime.now(tweet.created_at.tzinfo) - tweet.created_at})")
            print(f"      Text: {tweet.text[:100]}...")
            print(f"      Metrics: {metrics['like_count']}❤️  {metrics['retweet_count']}🔄  {metrics['reply_count']}💬")
            
            # Generate reply
            reply_text = generate_witty_reply(username, tweet.text)
            print(f"      💬 Reply: {reply_text}")
            
            # Send reply
            if not dry_run:
                try:
                    client.create_tweet(
                        text=reply_text,
                        in_reply_to_tweet_id=tweet.id
                    )
                    print(f"      ✅ Sent reply!")
                    save_replied_tweet(tweet.id)
                    replies_sent += 1
                except Exception as e:
                    print(f"      ❌ Failed to reply: {e}")
            else:
                print(f"      [DRY RUN] Would send reply")
                replies_sent += 1
            
            # Only reply to one tweet per account per run
            break
    
    # Summary
    print(f"\n📊 Run Summary:")
    print(f"   Accounts monitored: {len(TARGET_ACCOUNTS)}")
    print(f"   Replies sent: {replies_sent}/{MAX_REPLIES_PER_RUN}")
    print(f"\n✨ Sniping run complete!")
    
    return {
        "timestamp": datetime.now().isoformat(),
        "replies": replies_sent,
        "accounts_monitored": len(TARGET_ACCOUNTS)
    }

if __name__ == "__main__":
    import sys
    dry_run = "--dry-run" in sys.argv
    result = snipe_big_accounts(dry_run=dry_run)
    print(f"\n📈 Result: {json.dumps(result, indent=2)}")
