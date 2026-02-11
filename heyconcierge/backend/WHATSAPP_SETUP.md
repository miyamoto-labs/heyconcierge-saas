# HeyConcierge WhatsApp + Claude Setup

Complete guide to get the messaging backend running for your presentation.

## Prerequisites

1. **Supabase** (you already have this)
2. **Anthropic API key** (for Claude)
3. **Twilio account** (for WhatsApp - free tier works)
4. **ngrok** (for local testing)

---

## Step 1: Get Anthropic API Key

1. Go to: https://console.anthropic.com/
2. Sign up / Log in
3. Go to **API Keys**
4. Create new key → Copy it

---

## Step 2: Set Up Twilio WhatsApp Sandbox

**Twilio has a free WhatsApp sandbox perfect for demos:**

1. Go to: https://www.twilio.com/console/sms/whatsapp/sandbox
2. Sign up (free trial gives $15 credit)
3. You'll see a **Sandbox Number** like `+1 415 523 8886`
4. To activate, send a code from YOUR phone to that number:
   - Example: Send `join <word>` to the sandbox number
5. Your WhatsApp is now connected!

**Get your credentials:**
- **Account SID**: Twilio Console → Account Info
- **Auth Token**: Twilio Console → Account Info

---

## Step 3: Install Dependencies

```bash
cd /Users/erik/.openclaw/workspace/heyconcierge/backend

# Install Node.js packages
npm install

# Or if you don't have package.json yet:
npm install express @anthropic-ai/sdk @supabase/supabase-js twilio dotenv nodemon
```

---

## Step 4: Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in:
```bash
SUPABASE_URL=https://ljseawnwxbkrejwysrey.supabase.co
SUPABASE_SERVICE_KEY=<from Supabase Project Settings → API → service_role>
ANTHROPIC_API_KEY=<from Step 1>
TWILIO_ACCOUNT_SID=<from Step 2>
TWILIO_AUTH_TOKEN=<from Step 2>
TWILIO_WHATSAPP_NUMBER=+14155238886
PORT=3001
```

---

## Step 5: Add WhatsApp Number to Property

**In Supabase SQL Editor:**

```sql
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Update your test property with Twilio's sandbox number
UPDATE properties
SET whatsapp_number = 'whatsapp:+14155238886'
WHERE name = 'your-property-name';
```

---

## Step 6: Expose Local Server (for testing)

```bash
# Install ngrok if you don't have it
brew install ngrok

# Start the WhatsApp server
npm start

# In another terminal, expose it
ngrok http 3001
```

You'll get a URL like: `https://abc123.ngrok.io`

---

## Step 7: Configure Twilio Webhook

1. Go to Twilio Console → WhatsApp Sandbox Settings
2. **When a message comes in:**
   - Set to: `https://abc123.ngrok.io/webhook/whatsapp`
   - Method: `POST`
3. Save

---

## Step 8: Test It!

**Send a WhatsApp message from your phone to the Twilio sandbox number:**

```
What's the WiFi password?
```

**You should get back:**
- Claude's response based on your property config
- Example: "The WiFi password is MyWiFi_2024. Let me know if you need help connecting!"

**Check the logs:**
```bash
# In your backend terminal
📩 Incoming message from whatsapp:+4712345678: What's the WiFi password?
✅ Sent response to whatsapp:+4712345678
```

---

## For Presentation Demo

### Option 1: Live Demo (Recommended)
1. Have ngrok running (keeps the webhook active)
2. Send a message from your phone during the presentation
3. Show the real-time response

### Option 2: Screenshot/Video
1. Test beforehand
2. Record the conversation
3. Show the recording during presentation

---

## Testing Locally (Without WhatsApp)

Create a test script:

```bash
# Test the Claude integration directly
curl -X POST http://localhost:3001/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&To=whatsapp:+14155238886&Body=What time is check-in?"
```

---

## Troubleshooting

**"Property not found" error:**
- Make sure `whatsapp_number` column exists in properties table
- Verify the property has the Twilio number set
- Check it includes the `whatsapp:` prefix

**Claude not responding:**
- Verify ANTHROPIC_API_KEY is correct
- Check API key has credits
- Look at server logs for errors

**WhatsApp messages not arriving:**
- Check ngrok is running
- Verify webhook URL in Twilio console
- Make sure you joined the sandbox (sent the join code)

---

## Production Deployment (After Demo)

For production, deploy to:
- **Railway** (easiest)
- **Vercel** (serverless)
- **Heroku** (traditional)

Then use the permanent URL in Twilio webhook settings.

---

## What Gets Logged

Every conversation is saved to `goconcierge_messages` table:
- Guest phone number
- Their message
- Bot response
- Timestamp
- Property ID

View them in Supabase Table Editor.

---

**Status:** ✅ Complete WhatsApp + Claude backend ready!

Next: Add property data and test with real check-in questions.
