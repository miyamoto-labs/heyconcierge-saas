# Adding Booking.com iCal Support

Currently the app supports a single `ical_url` (typically Airbnb). This patch adds a separate `booking_ical_url` field so both Airbnb and Booking.com calendars are synced and merged.

---

## 1. SQL Migration

Create `supabase/migrations/XXX_add_booking_ical_url.sql`:

```sql
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS booking_ical_url TEXT;
```

Run via Supabase dashboard (SQL Editor) or CLI.

---

## 2. Settings Page (`app/(dashboard)/property/[id]/settings/page.tsx`)

### 2a. Add `booking_ical_url` to change detection

Find this block (~line 82):

```ts
    const propChanged = JSON.stringify({
      name: newProp?.name,
      address: newProp?.address,
      property_type: newProp?.property_type,
      whatsapp_number: newProp?.whatsapp_number,
      ical_url: newProp?.ical_url,
    }) !== JSON.stringify({
      name: savedPropertyRef.current.name,
      address: savedPropertyRef.current.address,
      property_type: savedPropertyRef.current.property_type,
      whatsapp_number: savedPropertyRef.current.whatsapp_number,
      ical_url: savedPropertyRef.current.ical_url,
    })
```

**Replace with** (add `booking_ical_url` to both sides):

```ts
    const propChanged = JSON.stringify({
      name: newProp?.name,
      address: newProp?.address,
      property_type: newProp?.property_type,
      whatsapp_number: newProp?.whatsapp_number,
      ical_url: newProp?.ical_url,
      booking_ical_url: newProp?.booking_ical_url,
    }) !== JSON.stringify({
      name: savedPropertyRef.current.name,
      address: savedPropertyRef.current.address,
      property_type: savedPropertyRef.current.property_type,
      whatsapp_number: savedPropertyRef.current.whatsapp_number,
      ical_url: savedPropertyRef.current.ical_url,
      booking_ical_url: savedPropertyRef.current.booking_ical_url,
    })
```

### 2b. Add `booking_ical_url` to the save function

Find this block in `handleSave` (~line 145):

```ts
      const { error: propErr } = await supabase
        .from('properties')
        .update({
          name: property.name,
          address: property.address,
          property_type: property.property_type,
          whatsapp_number: property.whatsapp_number,
          ical_url: property.ical_url,
        })
        .eq('id', propertyId)
```

**Replace with:**

```ts
      const { error: propErr } = await supabase
        .from('properties')
        .update({
          name: property.name,
          address: property.address,
          property_type: property.property_type,
          whatsapp_number: property.whatsapp_number,
          ical_url: property.ical_url,
          booking_ical_url: property.booking_ical_url,
        })
        .eq('id', propertyId)
```

### 2c. Add the Booking.com input field in the UI

Find (~line 501):

```tsx
            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">iCal URL <span className="font-normal text-muted">(optional)</span></label>
              <input type="text" value={property.ical_url || ''} onChange={(e) => updateProperty({ ical_url: e.target.value })} placeholder="https://airbnb.com/calendar/ical/..." className={inputClass} />
            </div>
```

**Replace with:**

```tsx
            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">Airbnb iCal URL <span className="font-normal text-muted">(optional)</span></label>
              <input type="text" value={property.ical_url || ''} onChange={(e) => updateProperty({ ical_url: e.target.value })} placeholder="https://airbnb.com/calendar/ical/..." className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-dark">Booking.com iCal URL <span className="font-normal text-muted">(optional)</span></label>
              <input type="text" value={property.booking_ical_url || ''} onChange={(e) => updateProperty({ booking_ical_url: e.target.value })} placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..." className={inputClass} />
            </div>
```

---

## 3. Sync Endpoint (`app/api/sync-calendar/route.ts`)

### 3a. Update the query to fetch `booking_ical_url`

Find:

```ts
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, ical_url')
      .not('ical_url', 'is', null)
      .neq('ical_url', '')
```

**Replace with:**

```ts
    // Get properties that have at least one iCal URL
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, ical_url, booking_ical_url')
      .or('ical_url.neq.,booking_ical_url.neq.')
```

> **Note:** The `.or()` filter gets properties where either URL is non-empty. If this causes issues with nulls, you can simplify to just `.select(...)` with no filter and handle it in JS below.

### 3b. Replace the per-property sync loop

Find the entire `for (const property of properties)` block (the `try/catch` inside it). Replace the body of that loop with the following:

```ts
    for (const property of properties) {
      try {
        const icalUrls: { url: string; source: string }[] = []
        if (property.ical_url) icalUrls.push({ url: property.ical_url, source: 'airbnb' })
        if (property.booking_ical_url) icalUrls.push({ url: property.booking_ical_url, source: 'booking' })

        if (icalUrls.length === 0) continue

        let allBookings: any[] = []

        for (const { url, source } of icalUrls) {
          try {
            const res = await fetch(url, {
              signal: AbortSignal.timeout(15000),
              headers: {
                'User-Agent': 'HeyConcierge/1.0 Calendar Sync',
                'Accept': 'text/calendar, text/plain, */*',
              },
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const icsText = await res.text()

            const events = parseICS(icsText)
            const bookings = extractBookings(events, property.id)

            // Override platform based on source URL
            const tagged = bookings.map(b => ({
              ...b,
              platform: source === 'booking' ? 'booking' : b.platform,
            }))

            allBookings.push(...tagged)
          } catch (urlErr) {
            console.error(`Failed to fetch ${source} iCal for ${property.name}:`, urlErr)
            // Continue with other URLs even if one fails
          }
        }

        // Delete old bookings and insert merged set
        await supabase
          .from('bookings')
          .delete()
          .eq('property_id', property.id)

        if (allBookings.length > 0) {
          const { error: insertError } = await supabase
            .from('bookings')
            .insert(allBookings)

          if (insertError) throw insertError
        }

        results.push({
          property: property.name,
          success: true,
          count: allBookings.length,
        })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Sync failed'
        console.error(`Sync failed for ${property.name}:`, errMsg)
        results.push({
          property: property.name,
          success: false,
          error: errMsg,
        })
      }
    }
```

---

## 4. Where to find the Booking.com iCal URL

In Booking.com Extranet:
1. Go to **Rates & Availability** → **Calendar**
2. Click **Sync calendars** (or similar)
3. Copy the **Export calendar URL** (looks like `https://admin.booking.com/hotel/hoteladmin/ical.html?t=...`)

---

## Summary

| File | Change |
|------|--------|
| SQL migration | Add `booking_ical_url TEXT` column |
| `settings/page.tsx` | Add field to change detection, save, and UI |
| `sync-calendar/route.ts` | Fetch both URLs, merge events, tag platform |

That's it — three files, fully backward-compatible. Properties with only an Airbnb URL continue working as before.
