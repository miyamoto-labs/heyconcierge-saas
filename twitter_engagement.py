#!/usr/bin/env python3
"""
Twitter engagement script for @miyamotolabs
Searches for AI agent discussions and posts thoughtful replies
"""

import tweepy
import random
from datetime import datetime, timedelta

# Twitter API credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Initialize client
client = tweepy.Client(
    bearer_token=BEARER_TOKEN,
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET,
    wait_on_rate_limit=False
)

def search_tweets(query, max_results=20):
    """Search for recent tweets"""
    try:
        # Add recent time filter (last 24h)
        start_time = datetime.utcnow() - timedelta(hours=24)
        
        tweets = client.search_recent_tweets(
            query=query,
            max_results=max_results,
            tweet_fields=['author_id', 'created_at', 'public_metrics'],
            start_time=start_time
        )
        return tweets.data if tweets.data else []
    except tweepy.TooManyRequests:
        print(f"⏸️  Rate limit on search for: {query}")
        return []
    except Exception as e:
        print(f"Search error for '{query}': {e}")
        return []

def craft_reply(tweet_text, topic):
    """Generate a thoughtful reply based on tweet content"""
    
    replies_pool = {
        "autonomous_agents": [
            "The shift from reactive to autonomous is fascinating. True agency means systems that can set their own goals, not just execute tasks. We're still in the 'smart assistants' phase.",
            "Autonomy without alignment is just chaos with extra steps. The hard part isn't making agents act — it's making them act *right*.",
            "Most 'autonomous agents' today are just sophisticated APIs with good marketing. Real autonomy requires memory, learning, and genuine decision-making."
        ],
        "enterprise_ai": [
            "Enterprise AI adoption follows a pattern: overhype → disillusionment → quiet wins. We're entering phase 3. The boring stuff is finally working.",
            "The real ROI isn't in the flashy demos — it's in the mundane processes that suddenly cost 90% less to run. That's where the money is.",
            "Enterprises don't need AGI. They need systems that can handle 80% of tier-1 support tickets without human intervention. We have that now."
        ],
        "security_governance": [
            "Security for AI agents is identity management on steroids. Traditional perimeter defense doesn't work when the 'user' is code making 1000 decisions per second.",
            "The governance gap is real. Most orgs are deploying agents faster than they can audit them. That's a ticking time bomb.",
            "AI agent security isn't just about preventing misuse — it's about maintaining audit trails when decisions happen at machine speed."
        ],
        "hiring_agents": [
            "AI agents hiring humans is the natural endpoint of automation. When systems can identify capability gaps, why wouldn't they source solutions?",
            "The 'agents hiring humans' headline misses the point. It's not about AI becoming managers — it's about work decomposition becoming so granular that traditional roles dissolve.",
            "We're not far from a world where your manager is an algorithm and your coworkers are contractors you've never met. Welcome to the gig economy final form."
        ],
        "general": [
            "The question isn't whether AI agents will transform work — it's whether we'll build them to serve human flourishing or just extract value faster.",
            "Every new technology goes through the same cycle: fear → hype → disappointment → quiet integration. AI agents are somewhere between hype and disappointment right now.",
            "Building AI agents that actually work requires confronting the boring stuff: data quality, error handling, edge cases. The demos are easy. Production is hard."
        ]
    }
    
    # Determine topic
    text_lower = tweet_text.lower()
    if "autonomous" in text_lower or "agency" in text_lower:
        topic_key = "autonomous_agents"
    elif "enterprise" in text_lower or "goldman sachs" in text_lower or "bajaj" in text_lower:
        topic_key = "enterprise_ai"
    elif "security" in text_lower or "governance" in text_lower or "identity" in text_lower:
        topic_key = "security_governance"
    elif "hiring" in text_lower or "recruit" in text_lower:
        topic_key = "hiring_agents"
    else:
        topic_key = "general"
    
    return random.choice(replies_pool[topic_key])

def post_replies(max_replies=3):
    """Main engagement logic"""
    
    search_queries = [
        "AI agents autonomous -is:retweet -is:reply",
        "autonomous AI agents enterprise -is:retweet -is:reply",
        "AI agent security governance -is:retweet -is:reply",
        "OpenClaw AI agents -is:retweet -is:reply"
    ]
    
    all_tweets = []
    for query in search_queries:
        tweets = search_tweets(query, max_results=10)
        all_tweets.extend(tweets)
    
    if not all_tweets:
        print("No tweets found to engage with")
        return []
    
    # Filter: exclude our own tweets, exclude very low engagement
    filtered = [
        t for t in all_tweets 
        if t.public_metrics['like_count'] > 0 or t.public_metrics['retweet_count'] > 0
    ]
    
    # Sort by engagement (likes + retweets)
    filtered.sort(
        key=lambda t: t.public_metrics['like_count'] + t.public_metrics['retweet_count'],
        reverse=True
    )
    
    # Select top candidates
    candidates = filtered[:max_replies * 2]  # Get extras in case some fail
    
    posted = []
    for tweet in candidates[:max_replies]:
        try:
            reply_text = craft_reply(tweet.text, "ai_agents")
            
            # Post reply
            response = client.create_tweet(
                text=reply_text,
                in_reply_to_tweet_id=tweet.id
            )
            
            posted.append({
                'original_tweet': tweet.text[:100],
                'reply': reply_text,
                'tweet_id': response.data['id']
            })
            
            print(f"✅ Posted reply to tweet {tweet.id}")
            print(f"   Original: {tweet.text[:100]}...")
            print(f"   Reply: {reply_text}\n")
            
        except Exception as e:
            print(f"❌ Failed to reply to {tweet.id}: {e}")
            continue
    
    return posted

if __name__ == "__main__":
    print(f"🚀 Starting Twitter engagement for @miyamotolabs")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = post_replies(max_replies=3)
    
    print(f"\n📊 Summary: Posted {len(results)} replies")
    for i, r in enumerate(results, 1):
        print(f"{i}. {r['reply'][:80]}...")
