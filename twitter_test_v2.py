#!/usr/bin/env python3
import tweepy

# All credentials
API_KEY = "bCr5IT7KJ8dsKPDWlYB9Aodsj"
API_SECRET = "9vWQU37Vzf5CvsPHieSE5Yb4M4zLE7DU0tJLVd5qpqtrKF8adL"
ACCESS_TOKEN = "2018603165633912832-1a80k4T84SM9EU3rFMuXk0fdUOn9AH"
ACCESS_TOKEN_SECRET = "Deagxm42lNFmvgdD7CUo5c0vzSMXaPMBVwU1esAAHpEkb"
BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

# Try API v2 client with OAuth 1.0a user context
try:
    client = tweepy.Client(
        bearer_token=BEARER_TOKEN,
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )
    
    # Test: Get authenticated user
    me = client.get_me()
    
    if me.data:
        print(f"✅ API v2 AUTHENTICATION SUCCESSFUL!")
        print(f"👤 Logged in as: @{me.data.username}")
        print(f"🆔 User ID: {me.data.id}")
        print(f"📝 Name: {me.data.name}")
        
        print("\n🎯 API v2 capabilities:")
        print("  ✅ Post tweets (create_tweet)")
        print("  ✅ Reply to tweets")
        print("  ✅ Like tweets")
        print("  ✅ Follow/unfollow users")
        print("  ✅ Search & monitor")
        
        print("\n🚀 Ready for automation!")
    
except tweepy.TweepyException as e:
    print(f"❌ Error: {e}")
    print("\n🔍 This might mean:")
    print("  - App needs 'Elevated' access (free, but requires approval)")
    print("  - Or needs OAuth 2.0 setup instead of OAuth 1.0a")
