#!/usr/bin/env python3
import tweepy

# API credentials (freshly regenerated)
API_KEY = "bCr5IT7KJ8dsKPDWlYB9Aodsj"
API_SECRET = "9vWQU37Vzf5CvsPHieSE5Yb4M4zLE7DU0tJLVd5qpqtrKF8adL"
ACCESS_TOKEN = "2018603165633912832-1a80k4T84SM9EU3rFMuXk0fdUOn9AH"
ACCESS_TOKEN_SECRET = "Deagxm42lNFmvgdD7CUo5c0vzSMXaPMBVwU1esAAHpEkb"

# OAuth 1.0a authentication
try:
    auth = tweepy.OAuth1UserHandler(
        API_KEY, API_SECRET,
        ACCESS_TOKEN, ACCESS_TOKEN_SECRET
    )
    api = tweepy.API(auth)
    
    # Test authentication
    me = api.verify_credentials()
    print(f"✅ AUTHENTICATION SUCCESSFUL!")
    print(f"👤 Logged in as: @{me.screen_name}")
    print(f"🆔 User ID: {me.id}")
    print(f"📝 Name: {me.name}")
    print(f"👥 Followers: {me.followers_count}")
    print(f"📊 Tweets: {me.statuses_count}")
    
    print("\n🎯 Capabilities unlocked:")
    print("  ✅ Post tweets")
    print("  ✅ Reply to tweets")
    print("  ✅ Like tweets")
    print("  ✅ Follow/unfollow users")
    print("  ✅ Search & monitor")
    print("  ✅ Read DMs (if enabled)")
    
    print("\n🚀 Ready to build crypto engagement automation!")
    
except tweepy.TweepyException as e:
    print(f"❌ Error: {e}")
