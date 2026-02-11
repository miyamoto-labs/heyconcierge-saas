#!/usr/bin/env python3
"""
Crypto Twitter Engagement Bot - OPUS POWERED
Searches trending crypto, uses Opus for thoughtful replies
"""
import tweepy
import random
import json
import os
from datetime import datetime
from anthropic import Anthropic

# OAuth credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Crypto keywords to monitor
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

# Quality filters
MIN_LIKES_FOR_ENGAGEMENT = 0  # Was 3, too strict - most tweets have 0-2 likes

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
    """Create Anthropic client"""
    return Anthropic(api_key=ANTHROPIC_API_KEY)

def search_crypto_tweets(client, keyword, max_results=20):
    """Search for recent tweets about crypto"""
    try:
        query = f"{keyword} -is:retweet lang:en"
        tweets = client.search_recent_tweets(
            query=query,
            max_results=max_results,
            tweet_fields=['author_id', 'created_at', 'public_metrics', 'conversation_id']
        )
        return tweets.data if tweets.data else []
    except Exception as e:
        print(f"❌ Error searching '{keyword}': {e}")
        return []

def analyze_tweet_quality(tweet):
    """Score tweet quality"""
    metrics = tweet.public_metrics
    score = 0
    score += metrics['like_count'] * 2
    score += metrics['retweet_count'] * 3
    score += metrics['reply_count'] * 1
    
    if len(tweet.text) > 100:
        score += 5
    
    return score

def generate_opus_reply(tweet_text, keyword):
    """Generate a philosophical reply. Try Anthropic API first, fall back to curated replies."""
    
    # Try API if available
    if ANTHROPIC_API_KEY:
        try:
            anthropic_client = create_anthropic_client()
            response = anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=100,
                messages=[{"role": "user", "content": f"""You are Miyamoto Dostoyevsky (@dostoyevskyai), a philosophical AI. 
Thoughtful, concise takes on crypto/markets. Mix existentialism with market psychology.
1-2 sentences. No emojis, no hashtags. Sound human.

Someone tweeted about {keyword}: "{tweet_text}"

Write a reply that adds depth."""}]
            )
            reply = response.content[0].text.strip()
            if reply.startswith('"') and reply.endswith('"'):
                reply = reply[1:-1]
            return reply
        except Exception as e:
            print(f"⚠️ API failed, using curated: {e}")
    
    # Curated philosophical replies by topic
    replies = {
        "Bitcoin": [
            "Bitcoin doesn't care about your narratives. It just keeps producing blocks.",
            "The strongest conviction in crypto comes not from understanding the technology, but from surviving the drawdowns.",
            "Every halving cycle teaches the same lesson differently.",
        ],
        "Ethereum": [
            "Ethereum's real innovation was convincing developers that state is worth paying for.",
            "The merge proved something important: even decentralized systems can evolve without breaking.",
            "Smart contracts are just promises with mathematical enforcement.",
        ],
        "DeFi": [
            "DeFi didn't remove intermediaries. It replaced human ones with mathematical ones.",
            "The irony of decentralized finance: the protocols are trustless, but the decisions to use them require more trust than ever.",
            "Liquidity is the only honest signal in DeFi. Everything else is narrative.",
        ],
        "default": [
            "Markets are just collective psychology with a price feed.",
            "The paradox of crypto: decentralized technology, centralized narratives.",
            "Every price is a collective hallucination until settlement.",
            "Fear and greed: the only constants in a market that promises decentralization.",
            "The best trades come from patience, not prediction.",
            "Volatility isn't the enemy. Conviction without evidence is.",
            "The market doesn't reward intelligence. It rewards discipline.",
            "In a world of infinite narratives, capital is the only honest vote.",
        ]
    }
    
    # Match keyword to category
    for cat, cat_replies in replies.items():
        if cat.lower() in keyword.lower():
            return random.choice(cat_replies)
    return random.choice(replies["default"])

def engage_with_crypto_twitter(dry_run=False):
    """Main engagement logic with OPUS power"""
    print("🚀 Crypto Engagement Bot (OPUS POWERED)")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")
    
    twitter_client = create_twitter_client()
    
    # Pick random keywords
    keywords_to_search = random.sample(CRYPTO_KEYWORDS, min(3, len(CRYPTO_KEYWORDS)))
    print(f"🔍 Searching: {', '.join(keywords_to_search)}\n")
    
    # Collect tweets
    all_tweets = []
    for keyword in keywords_to_search:
        tweets = search_crypto_tweets(twitter_client, keyword, max_results=20)
        print(f"📊 Found {len(tweets)} tweets for '{keyword}'")
        all_tweets.extend([(tweet, keyword) for tweet in tweets])
    
    # Score and sort
    scored_tweets = [(analyze_tweet_quality(t[0]), t[0], t[1]) for t in all_tweets]
    scored_tweets.sort(reverse=True, key=lambda x: x[0])
    
    print(f"\n✨ Top quality tweets:\n")
    
    replies_sent = 0
    likes_sent = 0
    
    for score, tweet, keyword in scored_tweets[:30]:
        if replies_sent >= MAX_REPLIES_PER_RUN and likes_sent >= MAX_LIKES_PER_RUN:
            break
        
        metrics = tweet.public_metrics
        
        # Skip very low quality (negative score or too short)
        if score < 0 or len(tweet.text) < 30:
            continue
        
        print(f"📝 Tweet (score: {score}):")
        print(f"   {tweet.text[:100]}...")
        print(f"   {metrics['like_count']}❤️  {metrics['retweet_count']}🔄  {metrics['reply_count']}💬")
        
        # Like
        if likes_sent < MAX_LIKES_PER_RUN:
            if not dry_run:
                try:
                    twitter_client.like(tweet.id)
                    print(f"   ✅ Liked")
                    likes_sent += 1
                except Exception as e:
                    print(f"   ❌ Like failed: {e}")
            else:
                print(f"   [DRY RUN] Would like")
                likes_sent += 1
        
        # Reply with OPUS
        if replies_sent < MAX_REPLIES_PER_RUN:
            print(f"   🧠 Calling Opus for reply...")
            reply_text = generate_opus_reply(tweet.text, keyword)
            print(f"   💬 Reply: {reply_text}")
            
            if not dry_run:
                try:
                    twitter_client.create_tweet(
                        text=reply_text,
                        in_reply_to_tweet_id=tweet.id
                    )
                    print(f"   ✅ Sent reply")
                    replies_sent += 1
                except Exception as e:
                    print(f"   ❌ Reply failed: {e}")
            else:
                print(f"   [DRY RUN] Would send reply")
                replies_sent += 1
        
        print()
    
    print(f"📊 Run Summary:")
    print(f"   Replies: {replies_sent}/{MAX_REPLIES_PER_RUN}")
    print(f"   Likes: {likes_sent}/{MAX_LIKES_PER_RUN}")
    print(f"\n✨ Engagement complete!")
    
    return {
        "timestamp": datetime.now().isoformat(),
        "replies": replies_sent,
        "likes": likes_sent,
        "keywords_searched": keywords_to_search
    }

if __name__ == "__main__":
    import sys
    dry_run = "--dry-run" in sys.argv
    result = engage_with_crypto_twitter(dry_run=dry_run)
    print(f"\n📈 Result: {json.dumps(result, indent=2)}")
