/**
 * HeyConcierge WhatsApp + Claude AI Backend
 * Receives WhatsApp messages → Fetches property config → Generates AI response
 */

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

/**
 * Webhook endpoint - Twilio posts WhatsApp messages here
 */
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { From, To, Body } = req.body;
    
    console.log(`📩 Incoming message from ${From}: ${Body}`);

    // Get property - for sandbox testing, get first property with config
    // In production, you'd match by To (the property's WhatsApp number)
    let property, propError;
    
    if (To.includes('8886')) {
      // Twilio sandbox - get first property
      const result = await supabase
        .from('properties')
        .select('*, property_config_sheets(*)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      property = result.data;
      propError = result.error;
    } else {
      // Production - match by WhatsApp number
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
      await sendWhatsApp(From, "Sorry, I couldn't find property information. Please contact support.");
      return res.status(200).send('OK');
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

    // Call Claude
    const response = await callClaude(Body, context, property.name);

    // Send response via WhatsApp
    await sendWhatsApp(From, response);

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
  return `
Property: ${property.name}
Location: ${property.address || 'N/A'}
Type: ${property.property_type || 'N/A'}

WiFi Password: ${config.wifi_password || 'Not provided'}

Check-in Instructions:
${config.checkin_instructions || 'Not provided'}

Local Tips:
${config.local_tips || 'Not provided'}

House Rules:
${config.house_rules || 'Not provided'}
  `.trim();
}

/**
 * Call Claude API with guest message + property context
 */
async function callClaude(guestMessage, propertyContext, propertyName) {
  const systemPrompt = `You are a helpful, friendly AI concierge for ${propertyName}. 

Your job is to assist guests with:
- Check-in/check-out procedures
- WiFi passwords and access codes
- Local recommendations (restaurants, attractions, tips)
- House rules and amenities
- General property questions

Be warm, professional, and helpful. If you don't have information, politely say so and suggest they contact the property owner.

Here's the property information you have access to:

${propertyContext}

Respond in the same language as the guest's message. Keep responses concise (2-3 sentences unless more detail is needed).`;

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
 * iCal Sync Endpoints
 */
const { syncProperty, syncAllProperties } = require('./ical_sync');

/**
 * Reminder Service
 */
const { sendCheckinReminders, sendTestReminder } = require('./reminder_service');

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 HeyConcierge WhatsApp backend running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
});
