# Weather Feature - Database Migration Required

## What Was Added

Weather-aware AI responses! Guests can now ask "What should I wear?" or "Is it going to rain?" and get accurate answers based on current weather.

## Database Migration (REQUIRED)

Before this feature works, you need to add two columns to the `properties` table in Supabase:

### Steps:

1. Go to https://supabase.com/dashboard
2. Select your project: `ljseawnwxbkrejwysrey`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste this SQL:

```sql
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
```

6. Click **Run** (or press Cmd+Enter)
7. You should see "Success. No rows returned"

## How Property Owners Use It

1. Go to Property Settings
2. Find your property's coordinates on Google Maps:
   - Right-click the property location
   - Click the coordinates at the top (e.g., `59.9139, 10.7522`)
   - Copy them
3. Enter Latitude and Longitude in the settings page
4. Save

## How It Works

- **Free API:** Uses Open-Meteo (no API key needed)
- **Smart Caching:** Weather cached for 30 minutes per property
- **Auto-Inject:** Weather added to AI context automatically
- **Guest Experience:** "What should I wear?" → "It's 12°C and partly cloudy right now. I'd recommend a light jacket!"

## Testing

1. Add coordinates for a test property
2. Send a WhatsApp message: "What's the weather like?"
3. AI should respond with current temperature and conditions

## Optional Properties

Properties without coordinates still work fine - they just won't have weather-aware responses.
