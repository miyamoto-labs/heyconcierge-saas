#!/usr/bin/env python3
"""
Twitter Launch Thread for Miyamoto Labs
Posts a 5-tweet thread and engages with relevant tweets
"""

import tweepy
import time
import json

# OAuth 1.0a credentials for posting
consumer_key = "8y9S9LjBOHNmXEH0eduHJLckk"
consumer_secret = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
access_token = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
access_token_secret = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

# Bearer token for search
bearer_token = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Initialize client with both OAuth 1.0a (for posting) and Bearer token (for search)
client = tweepy.Client(
    bearer_token=bearer_token,
    consumer_key=consumer_key,
    consumer_secret=consumer_secret,
    access_token=access_token,
    access_token_secret=access_token_secret,
    wait_on_rate_limit=True
)

# Thread content
thread = [
    "I just shipped 4 AI products in 4 days. An AI agent builder, a monitoring dashboard, a security marketplace, and a command center. All live. All free to try. Here's the story 🧵",
    
    "The flagship: AgentForge — build AI agents visually, no code. Drag triggers, AI nodes, and integrations together. 5 templates to start. Free tier. https://agent-builder-gamma.vercel.app",
    
    "AgentWatch monitors your agents in real-time. TrustClaw verifies AI skills for security. Both live: https://agent-monitor-app.vercel.app https://trustclaw.xyz",
    
    "The wild part? Most of this was built by AI agents themselves. One human + parallel AI sub-agents = a software company in days, not months.",
    
    "We're Miyamoto Labs. We build what others can't. Try AgentForge free: https://agent-builder-gamma.vercel.app 🚀"
]

def post_thread():
    """Post the launch thread"""
    print("🚀 Starting to post Miyamoto Labs launch thread...")
    print("-" * 60)
    
    tweet_ids = []
    previous_tweet_id = None
    
    for i, content in enumerate(thread, 1):
        try:
            print(f"\n📝 Posting tweet {i}/5...")
            print(f"Content: {content[:80]}...")
            
            # Post tweet, replying to previous if exists
            if previous_tweet_id:
                response = client.create_tweet(
                    text=content,
                    in_reply_to_tweet_id=previous_tweet_id
                )
            else:
                response = client.create_tweet(text=content)
            
            tweet_id = response.data['id']
            tweet_ids.append(tweet_id)
            previous_tweet_id = tweet_id
            
            print(f"✅ Tweet {i} posted! ID: {tweet_id}")
            print(f"   URL: https://twitter.com/dostoyevskyai/status/{tweet_id}")
            
            # Brief pause between tweets
            if i < len(thread):
                time.sleep(2)
                
        except Exception as e:
            print(f"❌ Error posting tweet {i}: {e}")
            raise
    
    print("\n" + "=" * 60)
    print("🎉 THREAD POSTED SUCCESSFULLY!")
    print(f"🔗 View thread: https://twitter.com/dostoyevskyai/status/{tweet_ids[0]}")
    print("=" * 60)
    
    return tweet_ids

def search_and_engage():
    """Search for relevant tweets and engage"""
    print("\n\n🔍 Searching for relevant tweets to engage with...")
    print("-" * 60)
    
    search_queries = [
        "build AI agent",
        "no-code AI",
        "AI automation tool"
    ]
    
    engaged_count = 0
    target_engagements = 5
    
    for query in search_queries:
        if engaged_count >= target_engagements:
            break
            
        try:
            print(f"\n🔎 Searching: '{query}'")
            
            # Search recent tweets
            tweets = client.search_recent_tweets(
                query=query,
                max_results=10,
                tweet_fields=['author_id', 'created_at', 'public_metrics']
            )
            
            if not tweets.data:
                print(f"   No tweets found for '{query}'")
                continue
            
            print(f"   Found {len(tweets.data)} tweets")
            
            # Engage with relevant tweets
            for tweet in tweets.data:
                if engaged_count >= target_engagements:
                    break
                
                tweet_id = tweet.id
                tweet_text = tweet.text[:100]
                
                # Skip if it's our own tweet
                if tweet.author_id == "2018603165633912832":
                    continue
                
                print(f"\n   📋 Tweet {tweet_id}: {tweet_text}...")
                
                # Generate helpful reply based on tweet content
                reply_text = generate_reply(tweet.text)
                
                if reply_text:
                    try:
                        # Post reply
                        client.create_tweet(
                            text=reply_text,
                            in_reply_to_tweet_id=tweet_id
                        )
                        print(f"   ✅ Replied: {reply_text[:80]}...")
                        engaged_count += 1
                        
                        # Like the tweet
                        client.like(tweet_id)
                        print(f"   ❤️  Liked")
                        
                        time.sleep(3)  # Pause between engagements
                        
                    except Exception as e:
                        print(f"   ⚠️  Error engaging: {e}")
                        continue
            
        except Exception as e:
            print(f"❌ Error searching '{query}': {e}")
            continue
    
    print("\n" + "=" * 60)
    print(f"🎯 Engaged with {engaged_count} tweets")
    print("=" * 60)

def generate_reply(tweet_text):
    """Generate a helpful, relevant reply"""
    tweet_lower = tweet_text.lower()
    
    # Context-aware replies
    if any(word in tweet_lower for word in ['build', 'create', 'make', 'develop']):
        return "Have you tried AgentForge? Visual AI agent builder, no code needed. 5 templates to get started fast: https://agent-builder-gamma.vercel.app"
    
    elif any(word in tweet_lower for word in ['no-code', 'nocode', 'low-code', 'visual']):
        return "Check out AgentForge — drag-and-drop AI agent builder. Built specifically for non-coders: https://agent-builder-gamma.vercel.app"
    
    elif any(word in tweet_lower for word in ['automat', 'workflow', 'task']):
        return "AgentForge might be exactly what you need. Visual automation + AI agents in one platform: https://agent-builder-gamma.vercel.app"
    
    elif any(word in tweet_lower for word in ['monitor', 'track', 'observ']):
        return "For monitoring AI agents, we built AgentWatch (real-time dashboards): https://agent-monitor-app.vercel.app"
    
    elif any(word in tweet_lower for word in ['security', 'safe', 'trust', 'verify']):
        return "Security matters! TrustClaw verifies AI skills before you run them: https://trustclaw.xyz"
    
    else:
        # Generic helpful reply
        return "We just launched AgentForge — visual AI agent builder with monitoring & security built in. Free tier available: https://agent-builder-gamma.vercel.app"

if __name__ == "__main__":
    try:
        print("\n" + "=" * 60)
        print("MIYAMOTO LABS - TWITTER LAUNCH CAMPAIGN")
        print("=" * 60)
        
        # Post the thread
        thread_ids = post_thread()
        
        # Wait a bit before engaging
        print("\n⏸️  Waiting 5 seconds before engaging...")
        time.sleep(5)
        
        # Search and engage
        search_and_engage()
        
        print("\n\n" + "=" * 60)
        print("✨ CAMPAIGN COMPLETE!")
        print("=" * 60)
        print(f"📊 Thread: https://twitter.com/dostoyevskyai/status/{thread_ids[0]}")
        print("🎯 Engaged with relevant tweets")
        print("🚀 Miyamoto Labs is live!")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
