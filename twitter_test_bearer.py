#!/usr/bin/env python3
import tweepy

BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

try:
    client = tweepy.Client(bearer_token=BEARER_TOKEN)
    
    # Try to get user info by username (public API, should work with just bearer token)
    user = client.get_user(username="dostoyevskyai")
    
    if user.data:
        print(f"✅ Bearer token works!")
        print(f"👤 Found account: @{user.data.username}")
        print(f"🆔 User ID: {user.data.id}")
        print(f"📝 Name: {user.data.name}")
        print("\n⚠️ Bearer token can only READ, not write.")
        print("We need the OAuth tokens (Access Token/Secret) to work for posting.")
    
except tweepy.TweepyException as e:
    print(f"❌ Error: {e}")
