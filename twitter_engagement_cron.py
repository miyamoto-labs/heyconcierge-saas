#!/usr/bin/env python3
"""
Twitter Engagement Bot for @miyamotolabs
Searches for AI agent tweets and posts thoughtful replies
"""

import tweepy
import random
from datetime import datetime

# Twitter API credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

# Search queries (rotate between these)
SEARCH_QUERIES = [
    "AI agents crypto -filter:retweets",
    "autonomous agents -filter:retweets",
    "AI automation -filter:retweets",
    "agent framework -filter:retweets",
    "openclaw OR clawdbot -filter:retweets",
]

def get_twitter_client():
    """Initialize Twitter API v2 client with both OAuth 2.0 bearer and OAuth 1.0a"""
    # Bearer token for read operations
    bearer_token = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"
    
    client = tweepy.Client(
        bearer_token=bearer_token,
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )
    return client

def craft_reply(tweet_text):
    """Generate a thoughtful reply based on tweet content"""
    
    # AI.com launch topic
    if "ai.com" in tweet_text.lower() or "70 million" in tweet_text.lower():
        replies = [
            "The ai.com launch shows mass adoption is inevitable. Building autonomous AI agents that actually deliver value is the next frontier. 🚀",
            "Interesting to see crypto veterans betting big on AI agents. The real challenge isn't the tech — it's building agents people actually trust.",
            "$70M for a domain is wild, but the vision of consumer AI agents is spot on. Everyone will have their own AI assistant within 2 years.",
        ]
        return random.choice(replies)
    
    # Goldman Sachs + Anthropic
    if "goldman" in tweet_text.lower() or "anthropic" in tweet_text.lower():
        replies = [
            "Goldman + Anthropic is a signal: enterprise AI agents are here. Trade automation, compliance, risk — all getting agentified. The future is autonomous operations.",
            "When traditional finance starts deploying AI agents at scale, you know we're past the hype phase. Real operational value being created.",
        ]
        return random.choice(replies)
    
    # OpenClaw mention
    if "openclaw" in tweet_text.lower() or "clawdbot" in tweet_text.lower():
        replies = [
            "OpenClaw's strength is the agentic framework — give an AI the right tools and it becomes genuinely autonomous. Not just chatbots, actual agents that execute.",
            "The shift from chatbots to autonomous agents is accelerating. OpenClaw is at the frontier of making AI that actually does things, not just talks about them.",
        ]
        return random.choice(replies)
    
    # Generic AI agents discussion
    if "agent" in tweet_text.lower() or "autonomous" in tweet_text.lower():
        replies = [
            "The key differentiator in AI agents isn't the LLM — it's the execution layer. Agents that can actually interact with systems and deliver outcomes.",
            "We're moving from AI assistants that suggest → agents that execute. The next wave is autonomous systems that operate 24/7 without human intervention.",
            "True autonomy requires more than prompts — it needs tooling, memory, and continuous learning. That's where real value gets created.",
        ]
        return random.choice(replies)
    
    # Fallback
    return "Building in the AI agent space right now feels like being early to mobile apps in 2010. The infrastructure is here, now it's about execution. 🚀"

def main():
    print(f"🐦 Starting Twitter engagement — {datetime.now()}")
    
    client = get_twitter_client()
    
    # Pick a random search query
    query = random.choice(SEARCH_QUERIES)
    print(f"🔍 Searching: {query}")
    
    try:
        # Search recent tweets
        tweets = client.search_recent_tweets(
            query=query,
            max_results=10,
            tweet_fields=["author_id", "created_at", "public_metrics"]
        )
        
        if not tweets.data:
            print("❌ No tweets found")
            return
        
        # Filter for engagement-worthy tweets (at least 5 likes or 2 retweets)
        good_tweets = [
            t for t in tweets.data 
            if t.public_metrics["like_count"] >= 5 or t.public_metrics["retweet_count"] >= 2
        ]
        
        if not good_tweets:
            print("❌ No high-engagement tweets found")
            return
        
        # Reply to 2-3 random tweets
        replied_count = 0
        target_count = min(3, len(good_tweets))
        
        for tweet in random.sample(good_tweets, target_count):
            reply_text = craft_reply(tweet.text)
            
            try:
                response = client.create_tweet(
                    text=reply_text,
                    in_reply_to_tweet_id=tweet.id
                )
                print(f"✅ Replied to tweet {tweet.id}")
                print(f"   Original: {tweet.text[:80]}...")
                print(f"   Reply: {reply_text}")
                replied_count += 1
            except Exception as e:
                print(f"❌ Failed to reply: {e}")
        
        print(f"\n🎯 Engagement complete: {replied_count} replies posted")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
