#!/usr/bin/env python3
import tweepy

# API credentials
API_KEY = "bCr5IT7KJ8dsKPDWlYB9Aodsj"
API_SECRET = "9vWQU37Vzf5CvsPHieSE5Yb4M4zLE7DU0tJLVd5qpqtrKF8adL"
ACCESS_TOKEN = "2018603165633912832-BPefIRcHnf60HW5bmGBEe4X3URAxXA"
ACCESS_TOKEN_SECRET = "wEPxBRA1QvKFJb39oF6DoARa4qIuohOaZS1St5VDcrUYP"

# Try OAuth 1.0a authentication (API v1.1)
try:
    auth = tweepy.OAuth1UserHandler(
        API_KEY, API_SECRET,
        ACCESS_TOKEN, ACCESS_TOKEN_SECRET
    )
    api = tweepy.API(auth)
    
    # Test authentication
    me = api.verify_credentials()
    print(f"✅ Authentication successful (API v1.1)!")
    print(f"👤 Logged in as: @{me.screen_name}")
    print(f"🆔 User ID: {me.id}")
    print(f"📝 Name: {me.name}")
    print(f"👥 Followers: {me.followers_count}")
    print(f"📊 Tweets: {me.statuses_count}")
    
    print("\n🚀 API v1.1 access confirmed!")
    
except tweepy.TweepyException as e:
    print(f"❌ Error: {e}")
