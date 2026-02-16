import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const EXTRACT_ALL_PROMPT = `You are a property information extractor. From the given document text, extract the following 4 categories. Return ONLY valid JSON with these exact keys:

{
  "wifi_password": "the WiFi network name and password, or null if not found",
  "checkin_instructions": "check-in instructions including key location, door codes, arrival steps, parking info, or null if not found",
  "local_tips": "local tips and recommendations like restaurants, attractions, transport, shops, things to do, or null if not found",
  "house_rules": "house rules like quiet hours, smoking policy, pet policy, trash, checkout procedures, dos and don'ts, or null if not found"
}

Rules:
- Return raw JSON only, no markdown fences or extra text
- Use null (not the string "null") for categories not found in the document
- Keep extracted text concise but complete
- Preserve important details like specific times, codes, addresses, and names`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const files = formData.getAll('pdfs') as File[]
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No PDF files uploaded' }, { status: 400 })
    }

    // pdf-parse v1's index.js tries to read a test PDF on import.
    // Import the inner lib directly to avoid that.
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default

    const allTexts: string[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfData = await pdfParse(buffer)
      allTexts.push(pdfData.text)
    }

    const combinedText = allTexts.join('\n\n--- NEXT DOCUMENT ---\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: EXTRACT_ALL_PROMPT,
      messages: [
        { role: 'user', content: `Extract all property information from this document:\n\n${combinedText}` }
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    let extracted
    try {
      extracted = JSON.parse(responseText.trim())
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      wifi_password: extracted.wifi_password ?? null,
      checkin_instructions: extracted.checkin_instructions ?? null,
      local_tips: extracted.local_tips ?? null,
      house_rules: extracted.house_rules ?? null,
    })
  } catch (error) {
    console.error('PDF extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF extraction failed' },
      { status: 500 }
    )
  }
}
