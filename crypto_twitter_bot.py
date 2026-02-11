#!/usr/bin/env python3
"""
MIYAMOTO LABS - Crypto Twitter Engagement Bot
Searches trending crypto topics, analyzes discussions, and engages thoughtfully
AI-driven insights + autonomous trading focus
"""
import tweepy
import random
import json
from datetime import datetime
from crypto_prices import get_multiple_prices, get_market_summary, format_price, format_change

# OAuth credentials (from console.x.com)
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Crypto keywords to monitor (rotate through these)
CRYPTO_KEYWORDS = [
    "Bitcoin",
    "Ethereum",
    "crypto market",
    "DeFi",
    "altcoins",
    "blockchain",
    "BTC",
    "ETH",
    "crypto news",
    "cryptocurrency",
    "web3",
    "NFT market"
]

# Engagement limits (moderate)
MAX_REPLIES_PER_RUN = 5
MAX_LIKES_PER_RUN = 8
MAX_FOLLOWS_PER_RUN = 2

# Quality filters
MIN_LIKES_FOR_ENGAGEMENT = 3  # Only engage with tweets that have some traction
MIN_FOLLOWERS_FOR_FOLLOW = 100  # Only follow accounts with some credibility

def create_client():
    """Create authenticated Twitter client with both OAuth methods"""
    return tweepy.Client(
        bearer_token=BEARER_TOKEN,  # For search/read operations
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET  # For write operations
    )

def search_crypto_tweets(client, keyword, max_results=20):
    """Search for recent tweets about crypto topics"""
    try:
        # Search for tweets with the keyword, exclude retweets
        query = f"{keyword} -is:retweet lang:en"
        tweets = client.search_recent_tweets(
            query=query,
            max_results=max_results,
            tweet_fields=['author_id', 'created_at', 'public_metrics', 'conversation_id']
        )
        return tweets.data if tweets.data else []
    except Exception as e:
        print(f"❌ Error searching for '{keyword}': {e}")
        return []

def analyze_tweet_quality(tweet):
    """Score tweet quality based on engagement and content"""
    metrics = tweet.public_metrics
    
    # Basic quality score
    score = 0
    score += metrics['like_count'] * 2
    score += metrics['retweet_count'] * 3
    score += metrics['reply_count'] * 1
    
    # Length bonus (prefer substantial tweets)
    if len(tweet.text) > 100:
        score += 5
    
    return score

def generate_reply(tweet_text, keyword):
    """
    Generate a thoughtful reply (MIYAMOTO LABS AI analysis style) with real market data
    """
    # Fetch real prices for context
    market_data = get_multiple_prices(["BTC", "ETH", "SOL"])
    
    # Base templates (MIYAMOTO LABS - data-driven, direct, AI-focused)
    base_templates = [
        f"Solid take on {keyword}. Our bots are tracking similar signals. Data > narratives.",
        f"Interesting {keyword} insight. At MIYAMOTO LABS we automate this logic - removes emotion from the equation.",
        f"Good perspective. This is exactly why we built autonomous {keyword} trading systems - humans spot patterns, AI executes without hesitation.",
        f"Agreed on {keyword}. Speed matters. Our systems process this in milliseconds while traders debate.",
        f"{keyword} analysis checks out. Building tools that turn insights like this into executable strategies. Man + machine.",
        f"Valid point on {keyword}. The future is autonomous execution. No more watching charts 24/7.",
        f"Strong {keyword} perspective. This is the kind of edge our trading bots exploit - pattern recognition without bias."
    ]
    
    # If tweet mentions prices/markets and we have data, add context
    price_keywords = ["price", "$", "pump", "dump", "moon", "crash", "rally", "dip", "bull", "bear"]
    mentions_price = any(kw in tweet_text.lower() for kw in price_keywords)
    
    reply = random.choice(base_templates)
    
    # Add real market data when contextually relevant
    if mentions_price and market_data:
        try:
            # Pick relevant crypto based on keyword
            crypto_symbol = None
            if "bitcoin" in keyword.lower() or "btc" in keyword.lower():
                crypto_symbol = "BTC"
            elif "ethereum" in keyword.lower() or "eth" in keyword.lower():
                crypto_symbol = "ETH"
            elif "solana" in keyword.lower() or "sol" in keyword.lower():
                crypto_symbol = "SOL"
            
            if crypto_symbol and crypto_symbol in market_data:
                data = market_data[crypto_symbol]
                price_str = format_price(data["price"])
                change_str = format_change(data["change_24h"])
                reply += f"\n\n{crypto_symbol}: {price_str} {change_str}"
        except:
            pass  # Fail gracefully if price formatting fails
    
    return reply

def engage_with_crypto_twitter(dry_run=False):
    """Main engagement logic"""
    print("🚀 Crypto Twitter Engagement Bot Starting...")
    print(f"⏰ Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")
    
    client = create_client()
    
    # Pick random keywords to search
    keywords_to_search = random.sample(CRYPTO_KEYWORDS, min(3, len(CRYPTO_KEYWORDS)))
    print(f"🔍 Searching keywords: {', '.join(keywords_to_search)}\n")
    
    # Collect tweets across all keywords
    all_tweets = []
    for keyword in keywords_to_search:
        tweets = search_crypto_tweets(client, keyword, max_results=20)
        print(f"📊 Found {len(tweets)} tweets for '{keyword}'")
        all_tweets.extend([(tweet, keyword) for tweet in tweets])
    
    # Score and sort by quality
    scored_tweets = [(analyze_tweet_quality(t[0]), t[0], t[1]) for t in all_tweets]
    scored_tweets.sort(reverse=True, key=lambda x: x[0])
    
    print(f"\n✨ Top quality tweets to engage with:")
    
    # Engage with top tweets
    replies_sent = 0
    likes_sent = 0
    follows_sent = 0
    
    for score, tweet, keyword in scored_tweets[:15]:  # Look at top 15
        if replies_sent >= MAX_REPLIES_PER_RUN and likes_sent >= MAX_LIKES_PER_RUN:
            break
            
        metrics = tweet.public_metrics
        
        # Skip low-quality tweets
        if metrics['like_count'] < MIN_LIKES_FOR_ENGAGEMENT:
            continue
        
        print(f"\n📝 Tweet (score: {score}):")
        print(f"   Text: {tweet.text[:100]}...")
        print(f"   Metrics: {metrics['like_count']}❤️  {metrics['retweet_count']}🔄  {metrics['reply_count']}💬")
        
        # Like tweet
        if likes_sent < MAX_LIKES_PER_RUN:
            if not dry_run:
                try:
                    client.like(tweet.id)
                    print(f"   ✅ Liked tweet")
                    likes_sent += 1
                except Exception as e:
                    print(f"   ❌ Failed to like: {e}")
            else:
                print(f"   [DRY RUN] Would like tweet")
                likes_sent += 1
        
        # Reply to tweet
        if replies_sent < MAX_REPLIES_PER_RUN:
            reply_text = generate_reply(tweet.text, keyword)
            print(f"   💬 Reply: {reply_text}")
            
            if not dry_run:
                try:
                    client.create_tweet(
                        text=reply_text,
                        in_reply_to_tweet_id=tweet.id
                    )
                    print(f"   ✅ Sent reply")
                    replies_sent += 1
                except Exception as e:
                    print(f"   ❌ Failed to reply: {e}")
            else:
                print(f"   [DRY RUN] Would send reply")
                replies_sent += 1
    
    # Summary
    print(f"\n📊 Run Summary:")
    print(f"   Replies sent: {replies_sent}/{MAX_REPLIES_PER_RUN}")
    print(f"   Likes sent: {likes_sent}/{MAX_LIKES_PER_RUN}")
    print(f"   Follows sent: {follows_sent}/{MAX_FOLLOWS_PER_RUN}")
    print(f"\n✨ Engagement run complete!")
    
    return {
        "timestamp": datetime.now().isoformat(),
        "replies": replies_sent,
        "likes": likes_sent,
        "follows": follows_sent,
        "keywords_searched": keywords_to_search
    }

if __name__ == "__main__":
    import sys
    dry_run = "--dry-run" in sys.argv
    result = engage_with_crypto_twitter(dry_run=dry_run)
    print(f"\n📈 Result: {json.dumps(result, indent=2)}")
