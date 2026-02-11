#!/usr/bin/env python3
"""
MIYAMOTO LABS - AI Agents Engagement
Search for AI agent discussions and reply thoughtfully
"""
import tweepy
import random
from datetime import datetime

# OAuth credentials
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

MAX_REPLIES = 3

def create_client():
    return tweepy.Client(
        bearer_token=BEARER_TOKEN,
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )

def search_ai_agent_tweets(client):
    """Search for quality tweets about AI agents"""
    keywords = [
        "AI agents",
        "autonomous agents",
        "AI automation",
        "agent frameworks"
    ]
    
    all_tweets = []
    for keyword in keywords:
        query = f"{keyword} -is:retweet lang:en"
        try:
            tweets = client.search_recent_tweets(
                query=query,
                max_results=20,
                tweet_fields=['author_id', 'created_at', 'public_metrics', 'conversation_id']
            )
            if tweets.data:
                # Filter for quality (at least 5 likes)
                quality_tweets = [t for t in tweets.data if t.public_metrics.get('like_count', 0) >= 5]
                all_tweets.extend(quality_tweets)
        except Exception as e:
            print(f"⚠️ Search error for '{keyword}': {e}")
    
    return all_tweets

def generate_helpful_reply(tweet_text):
    """Generate a substantive, helpful reply"""
    
    # Detect what the tweet is about
    lower_text = tweet_text.lower()
    
    if any(word in lower_text for word in ["build", "create", "develop", "how to"]):
        templates = [
            "At MIYAMOTO LABS we've learned: the hard part isn't building the agent, it's making it reliable in production. Start small, iterate fast.",
            "Key insight from building autonomous systems: constraint the problem space first. General purpose agents are hard. Domain-specific ones actually work.",
            "We've shipped several agent systems. Best advice: focus on the decision loop (observe→decide→act). The rest is just plumbing.",
        ]
    elif any(word in lower_text for word in ["future", "prediction", "will", "2026", "2027"]):
        templates = [
            "The agents that win won't be the smartest—they'll be the ones that ship value daily. Intelligence < reliability + speed.",
            "We're building the infrastructure. The question isn't if agents will work, it's who builds the rails they run on.",
            "Prediction: by end of 2026, every tech company has internal agents doing real work. Not demos. Real P&L impact.",
        ]
    elif any(word in lower_text for word in ["problem", "challenge", "issue", "hard"]):
        templates = [
            "Biggest challenge we've hit: trust boundaries. When do you let the agent act autonomously vs require human approval? Still iterating.",
            "The hard problems are operational, not technical. Agents fail silently, make expensive mistakes, and don't know when they're confused.",
            "We've found error recovery is 80% of the work. Building an agent that works is easy. Building one that fails gracefully is the real challenge.",
        ]
    else:
        # Generic thoughtful replies
        templates = [
            "Sharp observation. At MIYAMOTO LABS we're solving this by treating agents as team members with specific roles, not magical generalists.",
            "This aligns with what we're seeing in production. The gap between demo and deployment is massive. Reliability > features.",
            "Agreed. The agent space needs less hype, more shipping. We're focused on systems that work today, not vaporware roadmaps.",
            "Good perspective. We're building tools to make this easier. The future is autonomous systems + human oversight, not replacement.",
        ]
    
    return random.choice(templates)

def main():
    print("🤖 AI Agents Engagement Run")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    client = create_client()
    
    # Search for tweets
    print("🔍 Searching for AI agent discussions...")
    tweets = search_ai_agent_tweets(client)
    print(f"📊 Found {len(tweets)} quality tweets\n")
    
    # Score by engagement
    scored = [(t.public_metrics['like_count'] + t.public_metrics['retweet_count'] * 2, t) for t in tweets]
    scored.sort(reverse=True)
    
    # Reply to top tweets
    replies_sent = 0
    for score, tweet in scored[:10]:
        if replies_sent >= MAX_REPLIES:
            break
        
        print(f"📝 Tweet (engagement: {score}):")
        print(f"   {tweet.text[:120]}...")
        
        reply = generate_helpful_reply(tweet.text)
        print(f"   💬 Reply: {reply}")
        
        try:
            client.create_tweet(
                text=reply,
                in_reply_to_tweet_id=tweet.id
            )
            print(f"   ✅ Sent\n")
            replies_sent += 1
        except Exception as e:
            print(f"   ❌ Failed: {e}\n")
    
    print(f"✨ Complete! Sent {replies_sent} helpful replies.")
    return {"replies_sent": replies_sent, "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    result = main()
    print(f"\n📈 {result}")
