import { NextResponse } from "next/server"

// Bearer token for app-only auth (search/read)
const BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAMWH7QEAAAAAj9hs7gEWOFr9gV3xkQhXb37VyYg%3DwkXxm6KSCiY1Z1H3Iu7E36L3vVJqPvTzFmkysHYfkQorcrcSl4"

export async function GET() {
  try {
    // Search for crypto tweets from popular accounts
    const url = "https://api.twitter.com/2/tweets/search/recent"
    const params = new URLSearchParams({
      query: "(crypto OR bitcoin OR ethereum OR trading) -is:retweet lang:en",
      max_results: "15",
      "tweet.fields": "created_at,public_metrics,author_id",
      "expansions": "author_id",
      "user.fields": "name,username,profile_image_url"
    })
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        "Authorization": `Bearer ${BEARER_TOKEN}`,
        "User-Agent": "TradingTerminal/1.0"
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error("Twitter search error:", response.status, error)
      // Return mock data as fallback
      return NextResponse.json(getMockTweets())
    }

    const data = await response.json()
    
    // Map tweets with author info
    const users = data.includes?.users || []
    const tweets = (data.data || []).map((tweet: any) => {
      const author = users.find((u: any) => u.id === tweet.author_id) || {}
      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        likeCount: tweet.public_metrics?.like_count || 0,
        retweetCount: tweet.public_metrics?.retweet_count || 0,
        author: {
          name: author.name || "Crypto Trader",
          username: author.username || "trader",
          avatar: author.profile_image_url
        }
      }
    })
    
    return NextResponse.json(tweets.length > 0 ? tweets : getMockTweets())
  } catch (error: any) {
    console.error("Error fetching tweets:", error.message)
    return NextResponse.json(getMockTweets())
  }
}

function getMockTweets() {
  return [
    {
      id: "1",
      text: "BTC looking strong above $69k. Key resistance at $70k - break that and we're looking at new ATH territory. 📈",
      createdAt: new Date().toISOString(),
      likeCount: 245,
      retweetCount: 42,
      author: { name: "Crypto Analyst", username: "cryptoanalyst", avatar: null }
    },
    {
      id: "2", 
      text: "ETH gas fees finally reasonable. Time to deploy some contracts. DeFi summer 2.0 loading... 🔥",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likeCount: 189,
      retweetCount: 31,
      author: { name: "DeFi Degen", username: "defidegen", avatar: null }
    },
    {
      id: "3",
      text: "Funding rates negative across the board. Shorts getting crowded. You know what that means... 🚀",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likeCount: 312,
      retweetCount: 67,
      author: { name: "Trading Pro", username: "tradingpro", avatar: null }
    }
  ]
}
