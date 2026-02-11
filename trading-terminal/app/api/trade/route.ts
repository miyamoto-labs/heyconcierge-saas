import { NextRequest, NextResponse } from "next/server"

// Trade execution server URL - ngrok tunnel to localhost:8420
const TRADE_SERVER = process.env.TRADE_SERVER_URL || "https://untyrannic-shaneka-corporately.ngrok-free.dev"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { direction, asset, size, leverage } = body
    
    if (!direction || !asset || !size) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }
    
    // Call the trade execution server
    const tradeRes = await fetch(`${TRADE_SERVER}/trade`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ direction, asset, size, leverage })
    })
    
    if (!tradeRes.ok) {
      const error = await tradeRes.text()
      console.error("Trade server error:", error)
      return NextResponse.json({ error: `Trade server error: ${error}` }, { status: 500 })
    }
    
    const result = await tradeRes.json()
    
    return NextResponse.json({
      success: result.success,
      trade: result.trade || result,
      message: result.message || "Trade executed"
    })
    
  } catch (error: any) {
    console.error("Trade error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
