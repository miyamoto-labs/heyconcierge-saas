# HeyConcierge v0.1 Changes

## Summary
Prepared HeyConcierge for v0.1 launch with multi-property management, calendar sync, and removed Google Sheets dependency.

## Changes Made

### 1. ✅ Removed Google Sheets Mentions
**Files Modified:**
- `app/page.tsx` - Landing page
  - Changed "Google Sheet Setup" → "Simple Dashboard"
  - Changed "Fill a Google Sheet" → "Add Your Property"
  - Updated copy to reference dashboard instead of spreadsheets

### 2. ✅ Added Property Image Upload
**Files Modified:**
- `app/signup/page.tsx` - Signup flow
  - Added `propertyImages` array to form state
  - Added file upload input with preview thumbnails
  - Added remove image functionality
  - Images stored as base64 data URLs (can be migrated to Supabase Storage later)

### 3. ✅ Added iCal Calendar Sync
**Files Modified:**
- `app/signup/page.tsx` - Signup flow
  - Added `icalUrl` field to Step 4 (Config)
  - Instructions for getting iCal URLs from Airbnb/Booking.com
  - Stored in database for background sync

**Next Step (Backend):**
- Need to build Python/Node.js service to:
  - Poll iCal feeds every 6 hours
  - Parse iCal events
  - Store in `bookings` table
  - Can be deployed as separate service or cron job

### 4. ✅ Built Multi-Property Dashboard
**New File:**
- `app/dashboard/page.tsx`
  - Shows all properties for an organization
  - Property cards with images, sync status
  - "Add Property" button (modal)
  - Can add unlimited properties without re-signup

**Features:**
- Property list with image previews
- Calendar sync status indicator
- Add new property modal (full form)
- Settings button (placeholder for future)
- Proper multi-tenant isolation (RLS ready)

### 5. ✅ Database Schema Updates
**New File:**
- `supabase/migrations/002_add_property_fields.sql`

**Schema Changes:**
```sql
-- Properties table
ALTER TABLE properties
  ADD images TEXT[]           -- Array of image URLs/base64
  ADD ical_url TEXT           -- iCal feed URL
  ADD last_ical_sync TIMESTAMP -- Last sync time

-- New bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  property_id UUID,
  guest_name TEXT,
  guest_phone TEXT,
  check_in_date DATE,
  check_out_date DATE,
  platform TEXT,              -- airbnb/booking/other
  booking_reference TEXT,
  status TEXT,                -- confirmed/cancelled/completed
  notes TEXT
)
```

**RLS Policies:**
- Users only see bookings for their own properties
- Proper multi-tenant isolation via organizations table

### 6. ✅ Updated Signup Success Flow
**Files Modified:**
- `app/signup/page.tsx`
  - Added "Go to Dashboard →" button (primary CTA)
  - Download QR Code now secondary action
  - Better onboarding flow

## What's Ready for v0.1

### ✅ Working Now:
- Multi-property signup flow
- Property image upload
- iCal URL input
- Dashboard to view/add properties
- Multi-tenant database schema
- QR code generation

### 🔨 Needs Building (Backend):
1. **iCal Sync Service** (Priority 1)
   - Python/Node service
   - Parse iCal feeds
   - Store in bookings table
   - Run every 6 hours via cron

2. **WhatsApp Bot Integration** (Priority 2)
   - Connect WhatsApp Business API
   - Link properties to WhatsApp numbers
   - Route messages to correct property context

3. **Claude AI Backend** (Priority 3)
   - API route to handle guest messages
   - Pull property config from Supabase
   - Generate AI responses
   - Multi-language detection

4. **Calendar View** (Priority 4)
   - `/dashboard/calendar` page
   - Show all bookings across properties
   - Today's check-ins highlighted
   - Weekly/monthly views

## Testing Plan for Tromsø Property

1. **Signup Flow:**
   - Sign up with Tromsø property details
   - Upload 3-5 property photos
   - Add Airbnb iCal URL
   - Complete WiFi/check-in info

2. **Dashboard:**
   - Verify property appears
   - Check image display
   - Test "Add Property" modal
   - Verify calendar sync status

3. **Database:**
   - Run migration SQL
   - Verify data stored correctly
   - Test RLS policies

4. **Next:** Build iCal sync service

## File Structure
```
heyconcierge/
├── app/
│   ├── page.tsx                    # Landing (✅ Updated)
│   ├── signup/page.tsx             # Signup flow (✅ Updated)
│   └── dashboard/
│       └── page.tsx                # Dashboard (✅ New)
├── supabase/
│   └── migrations/
│       └── 002_add_property_fields.sql  # Schema (✅ New)
└── V01_CHANGES.md                  # This file
```

## Deployment Checklist

- [ ] Run Supabase migration
- [ ] Deploy Next.js app to Vercel
- [ ] Test signup flow end-to-end
- [ ] Test dashboard on mobile
- [ ] Build iCal sync service
- [ ] Deploy sync service (Railway/Vercel cron)
- [ ] Test with real Airbnb iCal URL
- [ ] Verify booking sync works
- [ ] Connect WhatsApp Business API
- [ ] Deploy Claude AI backend
- [ ] Test full guest flow

## Notes

- **Image Storage:** Currently using base64 in database. For production, migrate to Supabase Storage for better performance.
- **Auth:** Currently fetching first organization (demo mode). Need to add proper auth with Supabase Auth.
- **iCal Sync:** Service not built yet - needs separate deployment.
- **Calendar Display:** Bookings table ready, just needs UI component.

---

**Status:** Frontend complete ✅ | Backend in progress 🔨 | Ready for Tromsø test 🧪
