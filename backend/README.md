# HeyConcierge Backend Services

Backend services for HeyConcierge - calendar sync, AI messaging, and more.

## iCal Sync Service

Automatically syncs bookings from Airbnb/Booking.com iCal feeds to Supabase.

### Setup

1. **Install dependencies:**
```bash
cd backend
pip3 install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

Get your Supabase credentials:
- **SUPABASE_URL**: Project Settings → API → Project URL
- **SUPABASE_SERVICE_KEY**: Project Settings → API → service_role key (keep secret!)

3. **Make executable:**
```bash
chmod +x ical_sync.py
```

### Usage

**Run once (manual sync):**
```bash
python3 ical_sync.py
```

**Run with environment variables:**
```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_KEY=xxx \
python3 ical_sync.py
```

### Automated Sync (Cron)

**Option 1: System Cron (Mac/Linux)**

```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * cd /path/to/heyconcierge/backend && SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx python3 ical_sync.py >> /tmp/ical-sync-cron.log 2>&1
```

**Option 2: OpenClaw Cron (Recommended)**

Use OpenClaw's cron system for better monitoring:

```javascript
// Add via OpenClaw CLI or API
{
  "name": "HeyConcierge iCal Sync",
  "schedule": {
    "kind": "every",
    "everyMs": 21600000  // 6 hours
  },
  "payload": {
    "kind": "systemEvent",
    "text": "Run HeyConcierge iCal sync: cd /path/to/heyconcierge/backend && python3 ical_sync.py"
  },
  "sessionTarget": "main"
}
```

**Option 3: Vercel Cron (Serverless)**

Deploy as a Vercel cron function - see `vercel-deploy.md` for instructions.

### Logs

- **Location:** `/tmp/heyconcierge-ical-sync.log`
- **Format:** Timestamped with INFO/ERROR levels
- **View logs:**
```bash
tail -f /tmp/heyconcierge-ical-sync.log
```

### How It Works

1. **Fetches all properties** with `ical_url` from Supabase
2. **Downloads iCal feeds** via HTTP GET
3. **Parses VEVENT entries** using icalendar library
4. **Extracts booking data:**
   - Guest name (from summary)
   - Check-in/check-out dates
   - Platform (detected from UID/summary)
   - Booking reference (UID)
5. **Upserts to bookings table** (insert or update)
6. **Updates `last_ical_sync` timestamp** on properties

### Platform Detection

The service auto-detects booking platforms:
- **Airbnb:** UID or summary contains "airbnb"
- **Booking.com:** UID or summary contains "booking"
- **Other:** Everything else

### Database Schema

Requires these Supabase tables:

**properties:**
- `ical_url` (TEXT) - iCal feed URL
- `last_ical_sync` (TIMESTAMP) - Last sync time

**bookings:**
- `property_id` (UUID, FK to properties)
- `guest_name` (TEXT)
- `guest_phone` (TEXT, nullable)
- `check_in_date` (DATE)
- `check_out_date` (DATE)
- `platform` (TEXT: airbnb/booking/other)
- `booking_reference` (TEXT)
- `status` (TEXT: confirmed/cancelled/completed)
- `notes` (TEXT, nullable)

Run the migration:
```bash
psql $DATABASE_URL < ../supabase/migrations/002_add_property_fields.sql
```

### Troubleshooting

**"No properties with iCal URLs found"**
- Make sure properties have `ical_url` set in Supabase
- Check via: `SELECT id, name, ical_url FROM properties;`

**"Failed to fetch iCal"**
- Verify the iCal URL is correct (copy from Airbnb/Booking settings)
- Test manually: `curl "YOUR_ICAL_URL"`
- Check for network/firewall issues

**"Failed to parse iCal"**
- iCal feed might be malformed (rare)
- Check logs for specific error
- Test with: `python3 -c "from icalendar import Calendar; Calendar.from_ical(open('test.ics').read())"`

**Bookings not syncing**
- Check database constraints (unique constraint on property_id+booking_reference+platform)
- Verify service role key has INSERT/UPDATE permissions
- Check Supabase logs: Project Settings → API → Logs

### Next Steps

- [ ] Add webhook support (real-time sync when Airbnb/Booking updates)
- [ ] Fetch guest phone numbers via internal API capture
- [ ] Add SMS/WhatsApp notification on check-in day
- [ ] Build calendar dashboard UI

---

**Status:** ✅ Complete and ready to deploy
