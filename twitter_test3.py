#!/usr/bin/env python3
import tweepy

# API credentials (updated tokens)
API_KEY = "bCr5IT7KJ8dsKPDWlYB9Aodsj"
API_SECRET = "9vWQU37Vzf5CvsPHieSE5Yb4M4zLE7DU0tJLVd5qpqtrKF8adL"
ACCESS_TOKEN = "2018603165633912832-yntzCrJ804sqWOd0mMDXOKuNtJKvMW"
ACCESS_TOKEN_SECRET = "dlrzm3VIVJ7jA3eFnulhkzdsP6zRf8hAM6X7S7aQGv3er"

# Try OAuth 1.0a authentication (API v1.1)
try:
    auth = tweepy.OAuth1UserHandler(
        API_KEY, API_SECRET,
        ACCESS_TOKEN, ACCESS_TOKEN_SECRET
    )
    api = tweepy.API(auth)
    
    # Test authentication
    me = api.verify_credentials()
    print(f"✅ Authentication successful!")
    print(f"👤 Logged in as: @{me.screen_name}")
    print(f"🆔 User ID: {me.id}")
    print(f"📝 Name: {me.name}")
    print(f"👥 Followers: {me.followers_count}")
    print(f"📊 Tweets: {me.statuses_count}")
    print(f"🔒 Protected: {me.protected}")
    
    print("\n🚀 API access confirmed! Ready to build engagement tools.")
    
except tweepy.TweepyException as e:
    print(f"❌ Error: {e}")
