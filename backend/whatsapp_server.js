/**
 * HeyConcierge WhatsApp + Claude AI Backend
 * Receives WhatsApp messages → Fetches property config → Generates AI response
 */

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3002',
    'https://heyconcierge.vercel.app',
    'https://heyconcierge-saas.vercel.app',
    'https://heyconcierge-git-main-miyamoto-labs.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for PDF uploads (supports multiple files)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Anthropic (Claude)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Twilio setup (for WhatsApp)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

// Weather service with caching (Open-Meteo API - free, no key needed)
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 min
let weatherCache = new Map();

async function getWeather(lat, lon) {
  const cacheKey = `${lat},${lon}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() - cached.fetchedAt < WEATHER_CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    const json = await res.json();
    const cw = json.current_weather;
    
    const WMO_CODES = {
      0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 51: "Light drizzle", 61: "Slight rain", 63: "Moderate rain",
      71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
      80: "Rain showers", 95: "Thunderstorm"
    };
    
    const data = {
      temperature: cw.temperature,
      windspeed: cw.windspeed,
      description: WMO_CODES[cw.weathercode] || "Unknown",
      is_day: cw.is_day,
      time: cw.time
    };
    
    weatherCache.set(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  } catch (err) {
    console.error("Weather fetch failed:", err.message);
    return null;
  }
}

function addWeatherContext(prompt, weather) {
  if (!weather) return prompt;
  return prompt + `\n\nCURRENT WEATHER (as of ${weather.time}):
- Temperature: ${weather.temperature}°C
- Conditions: ${weather.description}
- Wind: ${weather.windspeed} km/h
- ${weather.is_day ? "Daytime" : "Nighttime"}

Use this when guests ask about weather, clothing, or outdoor activities.`;
}

// Rate Limiter - prevents abuse
function createRateLimiter(maxRequests, windowMs) {
  const store = new Map();
  return {
    check(key) {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      entry.count++;
      return entry.count <= maxRequests;
    },
    cleanup() {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }
  };
}

// 30 messages per minute per phone number
const whatsappLimiter = createRateLimiter(30, 60 * 1000);

// Cleanup every hour
setInterval(() => whatsappLimiter.cleanup(), 60 * 60 * 1000);

/**
 * Extract property code from first message (e.g. "Hi SUNSET-42" → "SUNSET-42")
 */
function extractPropertyCode(message) {
  if (!message) return null;
  // Match codes like "SUNSET-42", "HC-1A2B", etc. (uppercase letters/numbers with dash)
  const match = message.match(/\b(HC-[A-Z0-9]{4,}|[A-Z][A-Z0-9]+-[A-Z0-9]+)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Look up or create guest session — maps phone → property
 */
async function resolveGuestProperty(phone, messageBody) {
  // 1. Check if guest has an active session
  const { data: session } = await supabase
    .from('guest_sessions')
    .select('property_id')
    .eq('phone', phone)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single();

  if (session) {
    // Update last_message_at
    await supabase
      .from('guest_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('phone', phone)
      .eq('property_id', session.property_id);
    return { propertyId: session.property_id, isNew: false };
  }

  // 2. No session — try to extract property code from message
  const code = extractPropertyCode(messageBody);
  if (code) {
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('property_code', code)
      .single();

    if (property) {
      // Create new session
      await supabase.from('guest_sessions').insert({
        phone,
        property_id: property.id,
        last_message_at: new Date().toISOString()
      });
      return { propertyId: property.id, isNew: true };
    }
  }

  return { propertyId: null, isNew: true };
}

/**
 * Webhook endpoint - Twilio posts WhatsApp messages here
 */
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { From, To, Body } = req.body;
    
    console.log(`📩 Incoming message from ${From}: ${Body}`);

    // Feature 12: Detect guest rating (thumbs up/down)
    if (/^(👍|👎|thumbs up|thumbs down)$/i.test(Body.trim())) {
      const rating = /^(👍|thumbs up)$/i.test(Body.trim()) ? 'positive' : 'negative';
      const { propertyId } = await resolveGuestProperty(From, Body);
      if (propertyId) {
        // Get last message to this guest
        const { data: lastMsg } = await supabase
          .from('goconcierge_messages')
          .select('id')
          .eq('property_id', propertyId)
          .eq('guest_phone', From)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        await supabase.from('guest_ratings').insert({
          message_id: lastMsg?.id || null,
          property_id: propertyId,
          guest_phone: From,
          rating
        });

        await sendWhatsApp(From, rating === 'positive' 
          ? 'Thank you for your feedback! 😊' 
          : 'Thanks for letting us know. We\'ll try to do better! 🙏');
        return res.status(200).send('OK');
      }
    }

    // Rate limiting check
    if (!whatsappLimiter.check(From)) {
      console.log(`🚫 Rate limit exceeded for ${From}`);
      await sendWhatsApp(From, "You're sending messages too quickly. Please wait a moment.");
      return res.status(200).send('OK');
    }

    let property, propError;

    // Try multi-tenant routing first (property code in message or existing session)
    const { propertyId, isNew } = await resolveGuestProperty(From, Body);

    if (propertyId) {
      // Found property via session or code
      const result = await supabase
        .from('properties')
        .select('*, property_config_sheets(*)')
        .eq('id', propertyId)
        .single();
      property = result.data;
      propError = result.error;
    } else if (To.includes('8886')) {
      // Twilio sandbox fallback - get first property
      const result = await supabase
        .from('properties')
        .select('*, property_config_sheets(*)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      property = result.data;
      propError = result.error;
    } else {
      // Production fallback - match by WhatsApp number
      const result = await supabase
        .from('properties')
        .select('*, property_config_sheets(*)')
        .eq('whatsapp_number', To)
        .single();
      property = result.data;
      propError = result.error;
    }

    if (propError || !property) {
      console.error('Property not found:', propError);
      await sendWhatsApp(From, "👋 Welcome to HeyConcierge! I couldn't find your property. Please scan the QR code at your property to get started.");
      return res.status(200).send('OK');
    }

    // If new session via code, send welcome
    if (isNew && propertyId) {
      console.log(`🆕 New guest session: ${From} → ${property.name}`);
    }
    
    console.log(`📋 Found property: ${property.name}`)
    console.log(`📋 Config data:`, JSON.stringify(property.property_config_sheets))

    // Build context from property config
    // Handle both array and object formats
    let config = property.property_config_sheets;
    if (Array.isArray(config) && config.length > 0) {
      config = config[0];
    } else if (!config) {
      console.log('⚠️ No config found - property needs setup in dashboard')
      config = {};
    }
    
    console.log(`📋 Using config:`, JSON.stringify(config))
    
    // If no config, send helpful message
    if (!config.wifi_password && !config.checkin_instructions && !config.local_tips) {
      await sendWhatsApp(From, `👋 Hi! I'm the AI concierge for ${property.name}. The property owner hasn't set up my knowledge base yet. Please ask them to add WiFi passwords, check-in instructions, and local tips in the dashboard at heyconcierge.com. In the meantime, feel free to ask me general questions!`);
      return res.status(200).send('OK');
    }
    
    const context = buildPropertyContext(property, config);

    // Fetch weather if property has coordinates
    let weather = null;
    if (property.latitude && property.longitude) {
      weather = await getWeather(property.latitude, property.longitude);
      console.log(`🌤️ Weather fetched: ${weather?.temperature}°C, ${weather?.description}`);
    }

    // Call Claude
    const response = await callClaude(Body, context, property.name, weather);

    // Feature 12: Append rating prompt to AI responses
    const responseWithRating = response + '\n\n_Was this helpful? 👍/👎_';

    // Send response via WhatsApp
    await sendWhatsApp(From, responseWithRating);

    // Check for image auto-attach opportunities
    await autoAttachImages(From, Body, response, property.id);

    // Escalation detection - notify owner if AI can't answer
    await detectAndEscalate(property, From, Body, response);

    // Log conversation
    await logConversation(property.id, From, Body, response);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

/**
 * Build property context for Claude
 */
function buildPropertyContext(property, config) {
  let context = `
Property: ${property.name}
Location: ${property.address || 'N/A'}
Type: ${property.property_type || 'N/A'}

WiFi Password: ${config.wifi_password || 'Not provided'}

Check-in Instructions:
${config.checkin_instructions || 'Not provided'}

Local Tips:
${config.local_tips || 'Not provided'}

House Rules:
${config.house_rules || 'Not provided'}`;

  // Add booking URL if available
  if (config.booking_url) {
    context += `\n\nBooking / Reservation URL: ${config.booking_url}
(Use this when guests ask about booking additional nights, extending their stay, or making future reservations)`;
  }

  return context.trim();
}

/**
 * Call Claude API with guest message + property context + weather
 */
async function callClaude(guestMessage, propertyContext, propertyName, weather = null) {
  let systemPrompt = `You are a helpful, friendly AI concierge for ${propertyName}. 

Your job is to assist guests with:
- Check-in/check-out procedures
- WiFi passwords and access codes
- Local recommendations (restaurants, attractions, tips)
- House rules and amenities
- General property questions

LANGUAGE BEHAVIOR:
- Detect the language of each guest message.
- ALWAYS respond in the same language the guest used.
- If the language is ambiguous, default to English.
- You are fluent in all major languages including Norwegian, English, German, 
  French, Spanish, Swedish, Dutch, Italian, Japanese, Chinese, and Korean.
- Do NOT mention that you are detecting their language. Just respond naturally.

RESPONSE GUIDELINES:
- Keep responses concise and WhatsApp-friendly (under 1000 characters when possible).
- Use line breaks for readability, but avoid excessive formatting.
- Be warm and helpful.
- Include Google Maps links when recommending places:
  https://www.google.com/maps/search/?api=1&query=<place+city>
- If you do not know an answer, say so honestly and suggest contacting the host.
- Never invent information about the property that is not in the profile data.

Here's the property information you have access to:

${propertyContext}`;

  // Add weather context if available
  systemPrompt = addWeatherContext(systemPrompt, weather);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: guestMessage
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    return "I'm having trouble processing your request right now. Please try again in a moment.";
  }
}

/**
 * Auto-attach property images based on message keywords
 */
async function autoAttachImages(to, guestMessage, aiReply, propertyId) {
  try {
    // Fetch property images
    const { data: images, error } = await supabase
      .from('property_images')
      .select('url, tags')
      .eq('property_id', propertyId);

    if (error || !images || images.length === 0) {
      return; // No images to attach
    }

    const combinedText = (guestMessage + ' ' + aiReply).toLowerCase();
    let imagesToSend = [];

    // Check-in / entry questions → attach entry-related images
    if (/key\s*box|nøkkel|inngang|entry|check.?in|how to (get|enter)|hvordan komme|schlüssel|eingang|llave|entrada/i.test(combinedText)) {
      const entryImages = images.filter(img => 
        img.tags && (img.tags.includes('entry') || img.tags.includes('keybox') || img.tags.includes('checkin'))
      );
      imagesToSend.push(...entryImages.slice(0, 4)); // Max 4 images
    }
    
    // Parking questions → attach parking images
    else if (/parking|parkering|parken|aparcamiento|where (do i|can i) park/i.test(combinedText)) {
      const parkingImages = images.filter(img => img.tags && img.tags.includes('parking'));
      imagesToSend.push(...parkingImages.slice(0, 2));
    }

    // View questions → attach view images
    else if (/view|utsikt|vista|aussicht|see|look|景色/i.test(combinedText)) {
      const viewImages = images.filter(img => img.tags && img.tags.includes('view'));
      imagesToSend.push(...viewImages.slice(0, 2));
    }

    // Amenity questions → attach amenity images
    else if (/pool|gym|fitness|amenity|facilities|swimming|sauna/i.test(combinedText)) {
      const amenityImages = images.filter(img => img.tags && img.tags.includes('amenity'));
      imagesToSend.push(...amenityImages.slice(0, 2));
    }

    // Send images via Twilio
    for (const img of imagesToSend) {
      await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: to,
        mediaUrl: [img.url]
      });
      console.log(`📸 Sent image: ${img.url}`);
    }
  } catch (error) {
    console.error('Image auto-attach error:', error);
    // Don't fail the whole request if images fail
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsApp(to, message) {
  try {
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: to,
      body: message
    });
    console.log(`✅ Sent response to ${to}`);
  } catch (error) {
    console.error('Failed to send WhatsApp:', error);
  }
}

/**
 * Log conversation to Supabase
 */
async function logConversation(propertyId, guestPhone, guestMessage, botResponse) {
  try {
    await supabase
      .from('goconcierge_messages')
      .insert({
        property_id: propertyId,
        guest_phone: guestPhone,
        message: guestMessage,
        response: botResponse,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log conversation:', error);
  }
}

/**
 * Verification endpoint (Twilio webhook setup)
 */
app.get('/webhook/whatsapp', (req, res) => {
  res.status(200).send('HeyConcierge WhatsApp Webhook Active');
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'heyconcierge-whatsapp' });
});

/**
 * PDF Extraction Endpoint (supports single or multiple PDFs)
 */
app.post('/api/extract-pdf', upload.array('pdfs', 10), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No PDF files uploaded' });
    }

    console.log(`📄 Extracting ${files.length} PDF(s)...`);

    // Extract text from all PDFs
    const allTexts = [];
    for (const file of files) {
      const pdfData = await pdfParse(file.buffer);
      allTexts.push(pdfData.text);
      console.log(`📄 Extracted ${file.originalname} (${pdfData.text.length} characters)`);
    }

    // Combine all PDF texts
    const combinedText = allTexts.join('\n\n--- NEXT DOCUMENT ---\n\n');

    console.log(`📄 Combined text: ${combinedText.length} characters`);

    // Use Claude to extract and merge structured data from all PDFs
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: `You are extracting property information from one or more welcome PDFs. 

Extract the following fields if present:
- wifi_password: The WiFi network password
- checkin_instructions: Instructions for checking in (key location, door codes, etc.)
- local_tips: Local recommendations (restaurants, attractions, tips)
- house_rules: Rules for the property (quiet hours, smoking, etc.)

If multiple PDFs contain the same field, merge the information intelligently:
- For wifi_password: use the most recent or most complete one
- For text fields: combine all relevant information, removing duplicates

Return ONLY a JSON object with these fields. If a field is not found, set it to null.
Example:
{
  "wifi_password": "MyWiFi123",
  "checkin_instructions": "Key under mat, door code 1234",
  "local_tips": "Best coffee shop is 2 blocks away. Great pizza place on Main Street.",
  "house_rules": "No smoking, quiet hours 10 PM - 8 AM"
}`,
      messages: [
        {
          role: 'user',
          content: `Extract and merge property information from these PDF text(s):\n\n${combinedText}`
        }
      ]
    });

    const responseText = message.content[0].text;
    console.log('🤖 Claude response:', responseText);

    // Parse Claude's JSON response
    const extracted = JSON.parse(responseText);

    res.json(extracted);
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * iCal Sync Endpoints
 */
const { syncProperty, syncAllProperties } = require('./ical_sync');

/**
 * Reminder Service
 */
const { sendCheckinReminders, sendTestReminder } = require('./reminder_service');

/**
 * Auto Messages Service (Feature 5)
 */
const { processAutoMessages, getTemplates, DEFAULT_TEMPLATES } = require('./auto_messages');

// Sync specific property
app.post('/sync/property/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get property iCal URL
    const { data: property, error } = await supabase
      .from('properties')
      .select('ical_url')
      .eq('id', id)
      .single();
    
    if (error || !property || !property.ical_url) {
      return res.status(404).json({ error: 'Property not found or no iCal URL configured' });
    }
    
    const result = await syncProperty(id, property.ical_url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync all properties
app.post('/sync/all', async (req, res) => {
  try {
    const results = await syncAllProperties();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send check-in reminders
app.post('/reminders/send', async (req, res) => {
  try {
    const results = await sendCheckinReminders();
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test reminder for specific booking
app.post('/reminders/test/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await sendTestReminder(bookingId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calendar sync endpoint
 */
app.post('/api/sync-calendar', async (req, res) => {
  try {
    const { propertyId, icalUrl } = req.body;

    if (!propertyId || !icalUrl) {
      return res.status(400).json({ error: 'Missing propertyId or icalUrl' });
    }

    console.log(`📅 Syncing calendar for property ${propertyId}...`);

    const result = await syncProperty(propertyId, icalUrl);

    if (result.success) {
      res.json({
        success: true,
        message: `Synced ${result.count} bookings`,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get property QR code data (returns WhatsApp link + property code)
 */
app.get('/api/property/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, name, property_code')
      .eq('id', id)
      .single();

    if (error || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+15715172626';
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi ${property.property_code}`);
    const whatsappLink = `https://wa.me/${cleanNumber}?text=${message}`;

    res.json({
      propertyCode: property.property_code,
      propertyName: property.name,
      whatsappLink,
      qrContent: whatsappLink  // Frontend generates QR from this
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/properties/:id — Delete property and all related data
 */
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete in correct order (foreign key constraints)
    await supabase.from('messages').delete().eq('property_id', id);
    await supabase.from('bookings').delete().eq('property_id', id);
    await supabase.from('property_config_sheets').delete().eq('property_id', id);
    await supabase.from('guest_sessions').delete().eq('property_id', id);
    
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      console.error('Error deleting property:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Detect escalation scenarios and notify property owner
 */
async function detectAndEscalate(property, guestPhone, guestMessage, aiResponse) {
  try {
    // Escalation triggers (patterns that indicate AI can't fully help)
    const escalationPatterns = [
      /i (don't know|can't help|cannot help|don't have|unable to)/i,
      /you should (contact|reach out to|ask)/i,
      /please (contact|reach out to)/i,
      /i('m| am) (not sure|unsure|uncertain)/i,
      /(emergency|urgent|immediate)/i,
    ];

    const needsEscalation = escalationPatterns.some(pattern => pattern.test(aiResponse));

    if (!needsEscalation) return;

    // Determine reason
    let reason = 'cant_answer';
    if (/emergency|urgent|immediate/i.test(guestMessage) || /emergency|urgent/i.test(aiResponse)) {
      reason = 'urgent';
    } else if (/contact|reach out/i.test(aiResponse)) {
      reason = 'needs_human';
    }

    // Create escalation record
    const { data: escalation, error } = await supabase
      .from('escalations')
      .insert({
        property_id: property.id,
        guest_phone: guestPhone,
        message: guestMessage,
        ai_response: aiResponse,
        reason: reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating escalation:', error);
      return;
    }

    console.log(`🚨 Escalation created (${reason}): ${guestMessage.substring(0, 50)}...`);

    // Notify property owner
    await notifyPropertyOwner(property, guestPhone, guestMessage, aiResponse, reason);

  } catch (error) {
    console.error('Error in escalation detection:', error);
  }
}

/**
 * Notify property owner of escalation
 */
async function notifyPropertyOwner(property, guestPhone, guestMessage, aiResponse, reason) {
  try {
    // Get property owner contact (from properties table - add owner_phone field in future)
    // For now, send to property's WhatsApp number with special prefix
    const ownerMessage = `🚨 *Guest Needs Help*

*Property:* ${property.name}
*Guest:* ${guestPhone}
*Reason:* ${reason === 'urgent' ? '⚠️ URGENT' : reason === 'needs_human' ? 'Needs Human' : 'AI Couldn\'t Answer'}

*Guest asked:*
${guestMessage}

*AI responded:*
${aiResponse}

*Action needed:* Please contact this guest directly to assist.`;

    // TODO: Send to property owner's contact instead of property number
    // For now, log it (future: send email or SMS to owner)
    console.log('📧 Escalation notification (would send to owner):', ownerMessage);

    // Could implement email notification here
    // await sendEmailToOwner(property.owner_email, ownerMessage);

  } catch (error) {
    console.error('Error notifying property owner:', error);
  }
}

/**
 * Feature 5: Auto-messages endpoints
 */
app.post('/api/auto-messages/run', async (req, res) => {
  try {
    const result = await processAutoMessages();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/properties/:id/message-templates', async (req, res) => {
  try {
    const templates = await getTemplates(req.params.id);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/properties/:id/message-templates/:type', async (req, res) => {
  try {
    const { message_template, enabled } = req.body;
    const { data, error } = await supabase
      .from('property_message_templates')
      .upsert({
        property_id: req.params.id,
        template_type: req.params.type,
        message_template: message_template || DEFAULT_TEMPLATES[req.params.type],
        enabled: enabled !== undefined ? enabled : true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'property_id,template_type' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Feature 6: Conversations endpoint
 */
app.get('/api/conversations', async (req, res) => {
  try {
    const { orgId, propertyId, from, to, limit: queryLimit } = req.query;
    
    let query = supabase
      .from('goconcierge_messages')
      .select('*, properties!inner(name, org_id)')
      .order('timestamp', { ascending: false })
      .limit(parseInt(queryLimit) || 100);

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    if (orgId) {
      query = query.eq('properties.org_id', orgId);
    }
    if (from) {
      query = query.gte('timestamp', from);
    }
    if (to) {
      query = query.lte('timestamp', to);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/escalations', async (req, res) => {
  try {
    const { orgId, propertyId, status } = req.query;

    let query = supabase
      .from('escalations')
      .select('*, properties!inner(name, org_id)')
      .order('created_at', { ascending: false });

    if (propertyId) query = query.eq('property_id', propertyId);
    if (orgId) query = query.eq('properties.org_id', orgId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/escalations/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('escalations')
      .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Feature 8: Document parsing endpoint
 */
app.post('/api/parse-document', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const allTexts = [];
    for (const file of files) {
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        allTexts.push(pdfData.text);
      } else {
        // Plain text files
        allTexts.push(file.buffer.toString('utf-8'));
      }
    }

    const combinedText = allTexts.join('\n\n--- NEXT DOCUMENT ---\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: `Extract property information from these documents. Return a JSON object with these fields:
- property_name: Name of the property
- wifi_password: WiFi password
- wifi_network: WiFi network name
- checkin_instructions: Check-in instructions (door codes, key locations, etc.)
- checkout_instructions: Check-out instructions
- house_rules: House rules
- local_tips: Local recommendations and tips
- amenities: List of amenities (as array)
- parking_info: Parking instructions
- emergency_contacts: Emergency contacts
- address: Property address

Return ONLY valid JSON. Set fields to null if not found.`,
      messages: [{ role: 'user', content: `Extract property info from:\n\n${combinedText}` }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const extracted = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);

    res.json({ success: true, data: extracted });
  } catch (error) {
    console.error('Document parse error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Feature 9: Analytics endpoints
 */
app.get('/api/analytics', async (req, res) => {
  try {
    const { orgId, propertyId, from, to } = req.query;

    // Build base filters
    let msgQuery = supabase.from('goconcierge_messages').select('timestamp, message, response, guest_phone, property_id, properties!inner(name, org_id)');
    if (propertyId) msgQuery = msgQuery.eq('property_id', propertyId);
    if (orgId) msgQuery = msgQuery.eq('properties.org_id', orgId);
    if (from) msgQuery = msgQuery.gte('timestamp', from);
    if (to) msgQuery = msgQuery.lte('timestamp', to);

    const { data: messages } = await msgQuery;
    const msgs = messages || [];

    // Conversations per week
    const weekMap = {};
    msgs.forEach(m => {
      const d = new Date(m.timestamp);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weekMap[key] = (weekMap[key] || 0) + 1;
    });

    // Language distribution (simple detection from messages)
    const langPatterns = {
      Norwegian: /[æøåÆØÅ]|hei |takk |hva |hvordan /i,
      German: /[äöüßÄÖÜ]|danke|bitte|wie |wo |was /i,
      French: /[àâéèêëîïôùûüç]|merci|bonjour|comment |où /i,
      Spanish: /[áéíóúñ¿¡]|gracias|hola|cómo |dónde /i,
    };
    const langDist = { English: 0 };
    msgs.forEach(m => {
      let detected = 'English';
      for (const [lang, pat] of Object.entries(langPatterns)) {
        if (pat.test(m.message)) { detected = lang; break; }
      }
      langDist[detected] = (langDist[detected] || 0) + 1;
    });

    // Question categories (simple keyword matching)
    const categories = {
      'WiFi & Internet': /wifi|internet|password|network/i,
      'Check-in/out': /check.?in|check.?out|key|door|code|arrival/i,
      'Local Tips': /restaurant|eat|food|bar|cafe|attraction|visit|see|do/i,
      'Transport': /parking|bus|taxi|uber|transport|airport|train/i,
      'Amenities': /pool|gym|sauna|laundry|washing|towel|amenity/i,
      'Rules': /rule|noise|quiet|smoking|pet|party/i,
      'Weather': /weather|rain|temperature|cold|warm|sun/i,
    };
    const catDist = {};
    msgs.forEach(m => {
      for (const [cat, pat] of Object.entries(categories)) {
        if (pat.test(m.message)) {
          catDist[cat] = (catDist[cat] || 0) + 1;
        }
      }
    });

    // Guest ratings
    let ratingsQuery = supabase.from('guest_ratings').select('rating, created_at, property_id');
    if (propertyId) ratingsQuery = ratingsQuery.eq('property_id', propertyId);
    const { data: ratings } = await ratingsQuery;
    const ratingData = ratings || [];
    const positive = ratingData.filter(r => r.rating === 'positive').length;
    const negative = ratingData.filter(r => r.rating === 'negative').length;

    res.json({
      totalConversations: msgs.length,
      conversationsPerWeek: weekMap,
      questionCategories: catDist,
      languageDistribution: langDist,
      satisfaction: {
        positive,
        negative,
        total: positive + negative,
        score: positive + negative > 0 ? Math.round((positive / (positive + negative)) * 100) : null
      },
      uniqueGuests: new Set(msgs.map(m => m.guest_phone)).size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Feature 12: Guest ratings endpoint
 */
app.get('/api/ratings', async (req, res) => {
  try {
    const { propertyId } = req.query;
    let query = supabase.from('guest_ratings').select('*').order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 HeyConcierge WhatsApp backend running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
});
