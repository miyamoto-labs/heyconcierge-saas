#!/usr/bin/env python3
import tweepy
import time
from datetime import datetime, timedelta

# OAuth 1.0a credentials for posting
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

# Bearer token for search
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Initialize clients
auth = tweepy.OAuth1UserHandler(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
api = tweepy.API(auth)

client_v2 = tweepy.Client(
    bearer_token=BEARER_TOKEN,
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET
)

def search_and_reply():
    """Search for AI agent tweets and post thoughtful replies."""
    
    # Search queries focused on AI agents
    queries = [
        "AI agents -is:retweet -is:reply lang:en",
        "autonomous AI -is:retweet -is:reply lang:en",
        "AI automation -is:retweet -is:reply lang:en"
    ]
    
    replies_posted = 0
    target_replies = 3
    
    for query in queries:
        if replies_posted >= target_replies:
            break
            
        try:
            # Search recent tweets
            tweets = client_v2.search_recent_tweets(
                query=query,
                max_results=20,
                tweet_fields=['created_at', 'public_metrics', 'author_id'],
                expansions=['author_id'],
                user_fields=['username']
            )
            
            if not tweets.data:
                continue
            
            # Process tweets
            for tweet in tweets.data:
                if replies_posted >= target_replies:
                    break
                
                # Skip low-engagement tweets
                metrics = tweet.public_metrics
                if metrics['like_count'] < 2 and metrics['retweet_count'] < 1:
                    continue
                
                # Craft contextual reply based on tweet content
                tweet_text = tweet.text.lower()
                
                if 'autonomous' in tweet_text or 'agent' in tweet_text:
                    reply = "The shift to autonomous AI agents is the defining tech transition of 2026. We're moving from chat interfaces to AI that actually executes—handles workflows, makes decisions, operates 24/7. Early movers will dominate their verticals."
                elif 'trading' in tweet_text or 'crypto' in tweet_text:
                    reply = "Crypto + AI agents = perfect fit. Markets never sleep, neither do agents. We're running multiple autonomous trading strategies on Hyperliquid and Polymarket. The edge goes to those who can operate at machine speed with human strategy."
                elif 'automation' in tweet_text:
                    reply = "Real automation isn't just about efficiency—it's about scale. One human + properly configured AI agents = 10x output. The bottleneck is no longer execution, it's decision-making and strategy."
                else:
                    reply = "AI agents are the first technology that truly compounds. They learn, adapt, and improve autonomously. The question isn't if they'll transform your industry, but whether you'll be early or late to adopt."
                
                try:
                    # Post reply
                    response = client_v2.create_tweet(
                        text=reply,
                        in_reply_to_tweet_id=tweet.id
                    )
                    print(f"✅ Posted reply to tweet {tweet.id}: {reply[:50]}...")
                    replies_posted += 1
                    time.sleep(5)  # Rate limit protection
                    
                except Exception as e:
                    print(f"❌ Failed to reply to tweet {tweet.id}: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"❌ Search failed for query '{query}': {str(e)}")
            continue
    
    print(f"\n✨ Engagement complete: {replies_posted} replies posted")
    return replies_posted

if __name__ == "__main__":
    search_and_reply()
