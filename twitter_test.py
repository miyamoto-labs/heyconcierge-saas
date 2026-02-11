#!/usr/bin/env python3
import tweepy

# API credentials
API_KEY = "bCr5IT7KJ8dsKPDWlYB9Aodsj"
API_SECRET = "9vWQU37Vzf5CvsPHieSE5Yb4M4zLE7DU0tJLVd5qpqtrKF8adL"
ACCESS_TOKEN = "2018603165633912832-BPefIRcHnf60HW5bmGBEe4X3URAxXA"
ACCESS_TOKEN_SECRET = "wEPxBRA1QvKFJb39oF6DoARa4qIuohOaZS1St5VDcrUYP"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Authenticate
client = tweepy.Client(
    bearer_token=BEARER_TOKEN,
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET
)

# Test: Get authenticated user info
try:
    me = client.get_me()
    print(f"✅ Authentication successful!")
    print(f"👤 Logged in as: @{me.data.username}")
    print(f"🆔 User ID: {me.data.id}")
    print(f"📝 Name: {me.data.name}")
    
    # Check rate limits
    print("\n📊 Checking API tier and limits...")
    # Try to get recent tweets to test access
    tweets = client.get_users_tweets(id=me.data.id, max_results=5)
    print(f"✅ Can read tweets")
    
    print("\n🚀 Ready for automation!")
    
except tweepy.TweepyException as e:
    print(f"❌ Error: {e}")
