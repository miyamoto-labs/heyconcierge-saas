# Supabase Storage Setup for Photo Uploads

## 1. Create Storage Bucket

Go to Supabase Dashboard → Storage → Create Bucket

- **Bucket name:** `user-photos`
- **Public bucket:** Yes (for easy access to uploaded images)
- **File size limit:** 10MB
- **Allowed MIME types:** `image/*`

## 2. Set Up Row Level Security (RLS) Policies

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own photos
CREATE POLICY "Users can read own photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can read photos (if you want public access)
-- CREATE POLICY "Public can read all photos"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'user-photos');
```

## 3. (Optional) Create Photos Metadata Table

If you want to store photo metadata in the database:

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own photos
CREATE POLICY "Users can view own photos"
ON photos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
ON photos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON photos
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

## 4. Test Upload

1. Go to `http://localhost:3000/upload` (or your deployed URL)
2. Make sure you're logged in
3. Click "Take Photo / Choose from Gallery"
4. Select an image
5. Click "Upload Photo"
6. Check Supabase Storage dashboard to see the uploaded file

## 5. PWA Icons

Replace the placeholder icons in `public/icon-192.png` and `public/icon-512.png` with your actual app icons.

You can generate PWA icons using:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Done!

The PWA + photo upload feature is now ready. Users can:
- Install the app on their phones
- Upload photos from camera or gallery
- Images are automatically compressed to max 2MB
- All uploads are stored in Supabase with RLS protection
