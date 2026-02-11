#!/usr/bin/env python3
"""
Twitter engagement for Miyamoto Labs
Search for AI agent discussions and post thoughtful replies
"""

import tweepy
import json
from datetime import datetime, timedelta

# OAuth 1.0a credentials from TOOLS.md
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

# Initialize Tweepy client
client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_SECRET
)

def search_recent_tweets(query, max_results=10):
    """Search for recent tweets"""
    try:
        # Search tweets from the last 24 hours
        tweets = client.search_recent_tweets(
            query=query,
            max_results=max_results,
            tweet_fields=['created_at', 'public_metrics', 'author_id'],
            expansions=['author_id'],
            user_fields=['username', 'name']
        )
        return tweets
    except Exception as e:
        print(f"Search error: {e}")
        return None

def post_reply(tweet_id, reply_text):
    """Post a reply to a tweet"""
    try:
        response = client.create_tweet(
            text=reply_text,
            in_reply_to_tweet_id=tweet_id
        )
        return response
    except Exception as e:
        print(f"Reply error: {e}")
        return None

def main():
    print("🚀 Miyamoto Labs Twitter Engagement")
    print("=" * 50)
    
    # Search queries based on current trending topics
    queries = [
        "Moltbook AI agents -is:retweet",
        "autonomous AI agents security -is:retweet",
        "AI hiring humans rent-a-human -is:retweet"
    ]
    
    replies_posted = 0
    target_replies = 3
    
    for query in queries:
        if replies_posted >= target_replies:
            break
            
        print(f"\n🔍 Searching: {query}")
        results = search_recent_tweets(query, max_results=5)
        
        if not results or not results.data:
            print("No results found")
            continue
        
        # Get user info
        users = {u.id: u for u in results.includes.get('users', [])} if results.includes else {}
        
        for tweet in results.data:
            if replies_posted >= target_replies:
                break
            
            author = users.get(tweet.author_id)
            author_name = author.username if author else "unknown"
            
            print(f"\n📝 Tweet by @{author_name}:")
            print(f"   {tweet.text[:100]}...")
            print(f"   Metrics: {tweet.public_metrics}")
            
            # Craft contextual replies based on topic
            reply_text = None
            
            if "moltbook" in query.lower():
                reply_text = "The Moltbook debate highlights a crucial point: agent autonomy requires robust security frameworks. At MIYAMOTO LABS, we're building trust layers for this exact reason — verification, staking, and community oversight make autonomous systems safer. The tech is powerful; the guardrails matter more."
            
            elif "security" in query.lower():
                reply_text = "Security in autonomous AI isn't just about preventing malicious actors — it's about building transparent, auditable systems. Open source + community review + economic incentives = trust at scale. The future isn't choosing between autonomy and safety; it's architecting for both."
            
            elif "rent-a-human" in query.lower() or "hiring humans" in query.lower():
                reply_text = "AI agents hiring humans is fascinating bridge between digital and physical execution. The key challenge: verifying task completion and building reputation systems that work cross-domain. This is where onchain attestations and cryptographic proofs become critical infrastructure."
            
            if reply_text:
                print(f"   💬 Posting reply...")
                result = post_reply(tweet.id, reply_text)
                if result:
                    print(f"   ✅ Reply posted successfully!")
                    replies_posted += 1
                else:
                    print(f"   ❌ Failed to post reply")
    
    print(f"\n{'=' * 50}")
    print(f"✨ Engagement complete: {replies_posted} replies posted")
    
    # Save engagement log
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "replies_posted": replies_posted,
        "queries": queries
    }
    
    with open("/Users/erik/.openclaw/workspace/memory/twitter_engagement_log.jsonl", "a") as f:
        f.write(json.dumps(log_entry) + "\n")

if __name__ == "__main__":
    main()
