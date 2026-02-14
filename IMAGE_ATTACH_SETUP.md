# Image Auto-Attach - Supabase Setup Guide

## Overview
Automatically sends property images (keybox, parking, entrance) when guests ask relevant questions via WhatsApp.

---

## Step 1: Create `property_images` Table

Go to Supabase Dashboard → SQL Editor → New Query

```sql
-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- Enable Row Level Security
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see images for their own properties
CREATE POLICY "Users can view their own property images"
  ON property_images
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert images for their own properties
CREATE POLICY "Users can insert images for their own properties"
  ON property_images
  FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete their own property images
CREATE POLICY "Users can delete their own property images"
  ON property_images
  FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE user_id = auth.uid()
    )
  );
```

Click **Run** (Cmd+Enter)

---

## Step 2: Create Storage Bucket for Images

1. Go to **Storage** in left sidebar
2. Click **New bucket**
3. Bucket name: `property-images`
4. **Public bucket**: ✅ YES (images need public URLs for WhatsApp)
5. Click **Create bucket**

### Set Bucket Policies

Click on `property-images` bucket → **Policies** tab → **New Policy**

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public can read property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
```

**Policy 2: Authenticated Users Can Upload**
```sql
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
```

**Policy 3: Users Can Delete Their Own Images**
```sql
CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Step 3: Image Tags

When uploading images, property owners will tag them as:

- `entry` - Entry door, gate
- `keybox` - Key box location
- `checkin` - Check-in related
- `parking` - Parking spots, garage
- `exterior` - Building exterior
- `interior` - Inside views
- `view` - Scenic views
- `amenity` - Pool, gym, etc.

**Keyword Matching (Auto-Attach Logic):**

| Guest Message Contains | Attached Images (Tags) |
|------------------------|------------------------|
| "key", "nøkkel", "entry", "get in", "check in" | `entry`, `keybox`, `checkin` |
| "parking", "parkering", "park", "garage" | `parking` |
| "view", "utsikt", "see", "look" | `view` |
| "pool", "gym", "amenity", "facilities" | `amenity` |

---

## Step 4: Test It

1. Upload a test image via property settings
2. Tag it as "keybox"
3. Send WhatsApp message: "How do I get in?"
4. Should receive AI reply + keybox photo automatically

---

## How Property Owners Use It

1. Go to Property Settings
2. Scroll to "Property Images" section
3. Drag & drop photos or click to upload
4. Tag each photo (entry, keybox, parking, etc.)
5. Save

Images are stored in Supabase Storage at:
`https://ljseawnwxbkrejwysrey.supabase.co/storage/v1/object/public/property-images/{property_id}/{filename}`

---

## WhatsApp Limitations

- Max 4 images per message
- Images sent as separate messages (Twilio limitation)
- Images are public URLs (required by WhatsApp Business API)

---

## Next Steps After Migration

1. Run the SQL above
2. Create the storage bucket
3. Set bucket policies
4. Test upload in property settings
5. Test auto-attach via WhatsApp
