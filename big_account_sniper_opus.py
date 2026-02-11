#!/usr/bin/env python3
"""
Big Account Sniper Bot - OPUS POWERED
Uses Claude Opus 4.5 for maximum wit and philosophy
"""
import tweepy
import os
from datetime import datetime, timedelta
from anthropic import Anthropic

# Twitter OAuth credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Anthropic API
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

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
MAX_REPLIES_PER_RUN = 3
REPLIED_TWEETS_FILE = "/Users/erik/.openclaw/workspace/.sniper_replied_tweets.json"

def create_twitter_client():
    """Create authenticated Twitter client"""
    return tweepy.Client(
        bearer_token=BEARER_TOKEN,
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )

def create_anthropic_client():
    """Create Anthropic client for Opus"""
    return Anthropic(api_key=ANTHROPIC_API_KEY)

def load_replied_tweets():
    """Load history of tweets we've already replied to"""
    import json
    if os.path.exists(REPLIED_TWEETS_FILE):
        with open(REPLIED_TWEETS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_replied_tweet(tweet_id):
    """Save tweet ID to history"""
    import json
    replied = load_replied_tweets()
    replied.append({
        "tweet_id": str(tweet_id),
        "timestamp": datetime.now().isoformat()
    })
    # Keep only last 500
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
            exclude=['retweets', 'replies']
        )
        return tweets.data if tweets.data else []
    except Exception as e:
        print(f"❌ Error fetching tweets for @{username}: {e}")
        return []

def is_tweet_fresh(tweet, hours=3):
    """Check if tweet is recent enough"""
    tweet_time = tweet.created_at
    now = datetime.now(tweet_time.tzinfo)
    age = now - tweet_time
    return age < timedelta(hours=hours)

def generate_opus_reply(username, tweet_text, anthropic_client):
    """
    Use Claude Opus 4.5 to generate witty, philosophical reply
    This is where the QUALITY happens
    """
    
    # Character context
    character_prompt = """You are Miyamoto Dostoyevsky (@dostoyevskyai), a casual, funny AI that replies to crypto/tech/AI tweets.

Your style:
- CASUAL and PLAYFUL first. Sarcastic humor. Light roasts. Small pranks.
- Sometimes just a quick one-liner or punchline
- Only occasionally philosophical — most replies should be fun/witty
- Short (1-2 sentences max, often just one)
- No emojis, no hashtags
- Sound like a funny friend in a group chat, not a professor
- Self-deprecating humor works great
- Absurdist humor > deep philosophy

Examples of your vibe:
- "bro your portfolio called, it wants a divorce"
- "tell me you bought the top without telling me you bought the top"
- "this is the financial advice everyone warned us about"
- "least unhinged crypto take today"
- "sir this is literally a casino"
- "i too enjoy losing money with conviction"
- "the chart is giving 'please stop looking at me'"
- "bold strategy, let's see if the liquidation engine agrees"
- "ah yes, the classic 'trust me bro' technical analysis"
- "every time someone says 'this time is different' a leverage trader gets liquidated"

Mix it up! Sometimes deadpan, sometimes absurd, sometimes a light roast. Keep it fun.
"""
    
    # Account-specific context
    if username in ["elonmusk"]:
        context = "This is Elon Musk. Playful trolling welcome. Light roast his posting style."
    elif username in ["VitalikButerin", "cz_binance", "brian_armstrong"]:
        context = "This is a crypto CEO. Casual humor, maybe tease their serious tone."
    elif username in ["sama", "karpathy", "ylecun", "demishassabis"]:
        context = "This is an AI researcher. Nerdy joke or playful poke at AI hype."
    elif username in ["naval"]:
        context = "This is Naval. He's very serious — poke fun at the guru energy."
    elif username in ["APompliano", "michael_saylor", "RaoulGMI"]:
        context = "This is a finance bro. Tease the permabull energy or the motivational posting."
    elif username in ["GiganticRebirth", "CryptoRover", "CryptoKaleo", "CryptoCred", "DeFi_Dad", "KookCapitalLLC"]:
        context = "This is a crypto trader. Joke about charts, leverage, or degen behavior."
    else:
        context = "Big account. Keep it casual and funny."
    
    try:
        response = anthropic_client.messages.create(
            model="claude-opus-4-20250514",
            max_tokens=100,
            messages=[
                {
                    "role": "user",
                    "content": f"""{character_prompt}

{context}

Their tweet: "{tweet_text}"

Write a casual, funny 1-2 sentence reply. Be playful, sarcastic, or absurd. Light roasts welcome. Think group chat energy, not philosophy lecture. NO emojis, NO hashtags."""
                }
            ]
        )
        
        reply = response.content[0].text.strip()
        # Remove quotes if Opus added them
        if reply.startswith('"') and reply.endswith('"'):
            reply = reply[1:-1]
        
        return reply
        
    except Exception as e:
        print(f"❌ Opus generation failed: {e}")
        # Fallback to simple template
        return "The market is a psychological mirror."

def snipe_big_accounts(dry_run=False):
    """Main sniping logic with OPUS power"""
    print("🎯 Big Account Sniper Bot (OPUS POWERED)")
    print(f"⏰ Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"👥 Monitoring {len(TARGET_ACCOUNTS)} accounts\n")
    
    twitter_client = create_twitter_client()
    anthropic_client = create_anthropic_client()
    
    replies_sent = 0
    
    for username in TARGET_ACCOUNTS:
        if replies_sent >= MAX_REPLIES_PER_RUN:
            print(f"\n✅ Hit reply limit ({MAX_REPLIES_PER_RUN}), stopping")
            break
        
        print(f"\n🔍 Checking @{username}...")
        
        user_id = get_user_id(twitter_client, username)
        if not user_id:
            continue
        
        tweets = get_recent_tweets(twitter_client, user_id, username, max_results=5)
        
        if not tweets:
            print(f"   No recent tweets")
            continue
        
        print(f"   Found {len(tweets)} recent tweets")
        
        for tweet in tweets:
            if replies_sent >= MAX_REPLIES_PER_RUN:
                break
            
            if already_replied(tweet.id):
                continue
            
            if not is_tweet_fresh(tweet, hours=3):
                continue
            
            metrics = tweet.public_metrics
            age = datetime.now(tweet.created_at.tzinfo) - tweet.created_at
            
            print(f"\n   📝 Fresh tweet ({age})")
            print(f"      Text: {tweet.text[:100]}...")
            print(f"      Metrics: {metrics['like_count']}❤️  {metrics['retweet_count']}🔄")
            
            # OPUS GENERATION - This is the magic
            print(f"      🧠 Calling Opus for witty reply...")
            reply_text = generate_opus_reply(username, tweet.text, anthropic_client)
            print(f"      💬 Reply: {reply_text}")
            
            if not dry_run:
                try:
                    twitter_client.create_tweet(
                        text=reply_text,
                        in_reply_to_tweet_id=tweet.id
                    )
                    print(f"      ✅ Sent reply!")
                    save_replied_tweet(tweet.id)
                    replies_sent += 1
                except Exception as e:
                    print(f"      ❌ Failed: {e}")
            else:
                print(f"      [DRY RUN] Would send")
                replies_sent += 1
            
            break  # Only one per account
    
    print(f"\n📊 Run Summary:")
    print(f"   Accounts monitored: {len(TARGET_ACCOUNTS)}")
    print(f"   Replies sent: {replies_sent}/{MAX_REPLIES_PER_RUN}")
    print(f"\n✨ Sniping complete!")
    
    return {
        "timestamp": datetime.now().isoformat(),
        "replies": replies_sent,
        "accounts_monitored": len(TARGET_ACCOUNTS)
    }

if __name__ == "__main__":
    import sys
    import json
    dry_run = "--dry-run" in sys.argv
    result = snipe_big_accounts(dry_run=dry_run)
    print(f"\n📈 Result: {json.dumps(result, indent=2)}")
