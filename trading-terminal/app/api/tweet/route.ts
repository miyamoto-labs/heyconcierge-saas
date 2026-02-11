import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.accessToken) {
    return NextResponse.json({ 
      error: "Not authenticated",
      hint: "Please sign in with Twitter to post tweets"
    }, { status: 401 })
  }

  // Check for token refresh error
  if (session.error === "RefreshAccessTokenError") {
    return NextResponse.json({ 
      error: "Token expired",
      hint: "Please sign in again to refresh your session"
    }, { status: 401 })
  }
  
  try {
    const { text } = await request.json()
    
    if (!text || text.length === 0) {
      return NextResponse.json({ error: "Tweet text is required" }, { status: 400 })
    }
    
    if (text.length > 280) {
      return NextResponse.json({ error: "Tweet exceeds 280 characters" }, { status: 400 })
    }
    
    console.log("Posting tweet with OAuth 2.0...")
    
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "TradingTerminal/1.0"
      },
      body: JSON.stringify({ text })
    })
    
    const responseData = await response.json()
    
    if (!response.ok) {
      console.error("Twitter API error:", responseData)
      
      // Check for common OAuth 2.0 scope issues
      if (response.status === 403 && responseData.detail?.includes("scope")) {
        return NextResponse.json({ 
          error: "Missing required scopes",
          hint: "Please sign out and sign in again to grant tweet.write permission",
          details: responseData,
          fallback: "You can use the direct posting method as an alternative"
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: responseData.detail || responseData.title || "Failed to post tweet",
        details: responseData,
        fallback: "Try using /api/tweet-direct endpoint instead"
      }, { status: response.status })
    }
    
    return NextResponse.json({ success: true, tweet: responseData.data })
    
  } catch (error) {
    console.error("Error posting tweet:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
