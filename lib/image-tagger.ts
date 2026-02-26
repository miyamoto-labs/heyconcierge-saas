import Anthropic from '@anthropic-ai/sdk'

const VALID_TAGS = ['entry', 'keybox', 'checkin', 'parking', 'exterior', 'interior', 'view', 'amenity', 'other'] as const

const TAG_PROMPT = `You are an image classifier for vacation rental properties.
Analyze this image and the surrounding context text from a property document.

Return ONLY valid JSON:
{
  "description": "Brief description of what the image shows (1-2 sentences)",
  "tags": ["tag1", "tag2"]
}

Valid tags: ${VALID_TAGS.join(', ')}

Tag meanings:
- "entry" = doors, entrances, building exterior entrance areas, how to get in
- "keybox" = lockboxes, key safes, key storage devices, key handover
- "checkin" = check-in related (maps, directions, building numbers, floor plans)
- "parking" = parking spots, garages, parking instructions or signs
- "exterior" = building exterior, facade, street view
- "interior" = indoor rooms, living spaces, bedrooms, bathrooms, kitchen
- "view" = scenic views from the property, balcony views
- "amenity" = pools, gyms, shared facilities, appliances, laundry
- "other" = anything that doesn't fit above

Rules:
- Select 1-3 most relevant tags
- Return raw JSON only, no markdown fences`

export interface TagResult {
  description: string
  tags: string[]
}

export async function tagImage(
  imageBuffer: Buffer,
  mimeType: string,
  contextText: string
): Promise<TagResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  })

  const base64 = imageBuffer.toString('base64')
  const mediaType = normalizeMediaType(mimeType)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: TAG_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: contextText
                ? `Context from document: "${contextText.substring(0, 500)}"\n\nClassify this property image.`
                : 'Classify this property image.',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    return {
      description: parsed.description || 'Property image',
      tags: (parsed.tags || ['other']).filter((t: string) =>
        VALID_TAGS.includes(t as typeof VALID_TAGS[number])
      ),
    }
  } catch (error) {
    console.error('Image tagging failed:', error)
    return {
      description: 'Property image',
      tags: ['other'],
    }
  }
}

function normalizeMediaType(
  mimeType: string
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'image/jpeg'
  if (mimeType.includes('png')) return 'image/png'
  if (mimeType.includes('gif')) return 'image/gif'
  if (mimeType.includes('webp')) return 'image/webp'
  return 'image/jpeg' // Default fallback
}
