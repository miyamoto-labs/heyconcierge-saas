import { NextResponse } from "next/server"
import crypto from "crypto"

// OAuth 1.0a credentials - from env vars or fallback to hardcoded (for localhost)
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || "8y9S9LjBOHNmXEH0eduHJLckk"
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || "vtI12K6SPi2K3qjsVu4owbaTtlxTDabf5BmE1aUl2Crp73tUhm"
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || "2018603165633912832-5DVjB4g0yI8uQT0TcRhgHRP9uNhGbn"
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_SECRET || "wnJvQy3OI9TH4qGyikFzLbrb8ETky1DIjI5UDoK4Gohmo"

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
}

function generateOAuth1Signature(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&")

  // Create signature base string
  const signatureBase = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams)
  ].join("&")

  // Create signing key
  const signingKey = `${percentEncode(TWITTER_API_SECRET)}&${percentEncode(TWITTER_ACCESS_TOKEN_SECRET)}`

  // Generate signature
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64")

  return signature
}

function generateOAuth1Header(method: string, url: string, additionalParams: Record<string, string> = {}): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(32).toString("base64").replace(/\W/g, ""),
    oauth_version: "1.0"
  }

  // Merge with any additional params for signature
  const allParams = { ...oauthParams, ...additionalParams }

  // Generate signature
  const signature = generateOAuth1Signature(method, url, allParams)
  oauthParams.oauth_signature = signature

  // Build header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(", ")

  return `OAuth ${headerParts}`
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    if (!text || text.length === 0) {
      return NextResponse.json({ error: "Tweet text is required" }, { status: 400 })
    }
    
    if (text.length > 280) {
      return NextResponse.json({ error: "Tweet exceeds 280 characters" }, { status: 400 })
    }

    const url = "https://api.twitter.com/2/tweets"
    const body = JSON.stringify({ text })

    // For POST with JSON body, we don't include body params in signature
    const authHeader = generateOAuth1Header("POST", url)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "User-Agent": "TradingTerminal/1.0"
      },
      body: body
    })
    
    const responseData = await response.json()

    if (!response.ok) {
      console.error("Twitter API error:", responseData)
      return NextResponse.json({ 
        error: responseData.detail || responseData.title || "Failed to post tweet",
        details: responseData
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
