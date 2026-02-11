import tweepy

client = tweepy.Client(
    consumer_key='8y9S9LjBOHNmXEH0eduHJLckk',
    consumer_secret='vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm',
    access_token='2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn',
    access_token_secret='wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo'
)

# Get recent tweets (can't search with free tier, use timeline)
me = client.get_me()
print(f'Logged in as: {me.data.username}')

# Updated tweet with unique content
tweet = client.create_tweet(text='Autonomous trading systems update: Hyperliquid scalper now uses multi-timeframe trend analysis, Polymarket bot exploits Chainlink oracle lag. Both learning from every trade. #AIagents #crypto')
print(f'Posted: {tweet.data}')