import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface ParsedEvent {
  summary: string
  description: string
  dtstart: string
  dtend: string
}

/**
 * Simple iCal parser — extracts VEVENT blocks and their key fields.
 * No external dependencies needed.
 */
function parseICS(text: string): ParsedEvent[] {
  const events: ParsedEvent[] = []
  const blocks = text.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]

    const getField = (name: string): string => {
      // Match field, handling folded lines (lines starting with space/tab are continuations)
      const regex = new RegExp(`^${name}[;:](.*)`, 'm')
      const match = block.match(regex)
      if (!match) return ''
      let value = match[1]
      // Handle folded lines
      const lines = block.split('\n')
      const idx = lines.findIndex(l => l.match(new RegExp(`^${name}[;:]`)))
      if (idx >= 0) {
        let j = idx + 1
        while (j < lines.length && /^[ \t]/.test(lines[j])) {
          value += lines[j].substring(1)
          j++
        }
      }
      return value.replace(/\r/g, '').trim()
    }

    const dtstart = getField('DTSTART')
    const dtend = getField('DTEND')

    if (dtstart && dtend) {
      events.push({
        summary: getField('SUMMARY'),
        description: getField('DESCRIPTION'),
        dtstart,
        dtend,
      })
    }
  }

  return events
}

/**
 * Parse an iCal date string (VALUE=DATE:20260215 or 20260215T140000Z) to YYYY-MM-DD
 */
function parseICalDate(raw: string): string {
  // Strip VALUE=DATE: prefix if present
  const cleaned = raw.replace(/^VALUE=DATE:/, '').replace(/^.*:/, '')
  // Take first 8 chars as YYYYMMDD
  const dateStr = cleaned.substring(0, 8)
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}

function extractBookings(events: ParsedEvent[], propertyId: string) {
  return events.map(event => {
    const summary = event.summary || 'Untitled Booking'
    const description = event.description || ''

    // Detect platform
    let platform = 'other'
    const lower = (summary + ' ' + description).toLowerCase()
    if (lower.includes('airbnb')) platform = 'airbnb'
    else if (lower.includes('booking')) platform = 'booking'

    // Extract guest name
    let guestName = 'Guest'
    const nameParts = summary.split(' - ')
    if (nameParts.length > 0) {
      guestName = nameParts[0].replace(/^(Reserved|Booked|Blocked|Not available)\s*/i, '').trim()
    }

    // Flag blocked dates
    if (/^(Not available|Blocked|Reserved)$/i.test(guestName)) {
      guestName = 'Blocked'
      platform = 'other'
    }

    const checkIn = parseICalDate(event.dtstart)
    const checkOut = parseICalDate(event.dtend)

    return {
      property_id: propertyId,
      guest_name: guestName || 'Guest',
      check_in: checkIn,
      check_out: checkOut,
      platform,
      status: new Date(checkIn) > new Date() ? 'confirmed' : 'completed',
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    // Get all properties with iCal URLs
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, ical_url')
      .not('ical_url', 'is', null)
      .neq('ical_url', '')

    if (fetchError) throw fetchError

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        message: 'No properties with iCal URLs found',
        synced: 0,
        failed: 0,
        results: [],
      })
    }

    const results = []

    for (const property of properties) {
      try {
        // Fetch iCal text (User-Agent needed — Airbnb blocks default serverless requests)
        const res = await fetch(property.ical_url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'HeyConcierge/1.0 Calendar Sync',
            'Accept': 'text/calendar, text/plain, */*',
          },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const icsText = await res.text()

        // Parse events
        const events = parseICS(icsText)
        const bookings = extractBookings(events, property.id)

        // Delete old bookings for this property
        await supabase
          .from('bookings')
          .delete()
          .eq('property_id', property.id)

        // Insert new bookings
        if (bookings.length > 0) {
          const { error: insertError } = await supabase
            .from('bookings')
            .insert(bookings)

          if (insertError) throw insertError
        }

        results.push({
          property: property.name,
          success: true,
          count: bookings.length,
        })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Sync failed'
        console.error(`Sync failed for ${property.name} (URL: ${property.ical_url}):`, errMsg)
        results.push({
          property: property.name,
          success: false,
          error: errMsg,
          ical_url: property.ical_url?.substring(0, 60) + '...',
        })
      }
    }

    const synced = results.filter(r => r.success).reduce((sum, r) => sum + (r.count || 0), 0)
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Synced ${synced} bookings across ${results.length} properties`,
      synced,
      failed,
      results,
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Calendar sync failed' },
      { status: 500 }
    )
  }
}
