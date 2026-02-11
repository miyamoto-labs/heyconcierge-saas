# Google OAuth Setup Instructions

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "HeyConcierge" (or whatever you prefer)

## Step 2: Enable Google+ API

1. In the sidebar, go to **APIs & Services > Library**
2. Search for "Google+ API"
3. Click it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - **App name:** HeyConcierge
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue**
5. Skip scopes (default is fine)
6. Add test users if needed
7. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Choose **Web application**
4. Name it "HeyConcierge Web"
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3002/api/auth/callback/google
   ```
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

## Step 5: Update .env.local

Replace the placeholder values in `.env.local`:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## Step 6: Generate AUTH_SECRET

Run this command:
```bash
openssl rand -base64 32
```

Copy the output and replace `your-secret-here` in `.env.local`:
```env
AUTH_SECRET=the-generated-secret
```

## Step 7: Run Database Migration

Execute the SQL in `DATABASE_AUTH_MIGRATION.sql` in Supabase:

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Copy/paste the contents of `DATABASE_AUTH_MIGRATION.sql`
4. Click **Run**

## Step 8: Restart the Dev Server

```bash
# Kill the current server (Ctrl+C)
# Restart:
npm run dev
```

## Done!

Now when you visit http://localhost:3002/dashboard, you'll be redirected to login.

All user data will be saved to their authenticated account!
