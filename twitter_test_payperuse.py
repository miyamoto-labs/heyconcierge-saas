#!/usr/bin/env python3
"""
Test OAuth posting with NEW pay-per-use console credentials
"""
import tweepy

# NEW credentials from console.x.com (pay-per-use)
API_KEY = "8y9S9LjBOHNmXEH0eduHJLckk"
API_SECRET = "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
ACCESS_TOKEN = "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
ACCESS_TOKEN_SECRET = "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

print("🧪 Testing OAuth 1.0a with NEW pay-per-use credentials...\n")

# Create client with OAuth 1.0a
client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET
)

# Test: Post a tweet
test_tweet = "Testing new pay-per-use API access 🚀"

try:
    print(f"📝 Attempting to post: '{test_tweet}'")
    response = client.create_tweet(text=test_tweet)
    print(f"✅ SUCCESS! Tweet posted!")
    print(f"Tweet ID: {response.data['id']}")
    print(f"\n🎉 OAuth posting WORKS with pay-per-use credentials!")
except Exception as e:
    print(f"❌ ERROR: {e}")
    print(f"\nFull error details: {type(e).__name__}: {str(e)}")
