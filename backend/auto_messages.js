/**
 * Automatic Guest Messages Service (Feature 5)
 * Triggers messages based on iCal bookings:
 * - Check-in day: Welcome message
 * - Day 2: Midstay tips
 * - Check-out day: Thank you message
 * 
 * Schedule: Run daily at 08:00 via cron
 */

const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const DEFAULT_TEMPLATES = {
  welcome: `👋 Welcome to {property_name}! 🏡

We're so glad you're here! Here are a few things to get you started:

📶 WiFi: {wifi_password}
🔑 {checkin_instructions}

If you need anything during your stay, just send a message here and our AI concierge will help you out!

Enjoy your stay! 🎉`,

  midstay: `☀️ Good morning from {property_name}!

Hope you're enjoying your stay! Here are some local tips for today:

{local_tips}

Need restaurant recommendations or have any questions? Just ask! 😊`,

  checkout: `👋 Thank you for staying at {property_name}!

We hope you had an amazing time. A few checkout reminders:
- Please check out by the specified time
- Leave keys where you found them
- We'd love a review if you enjoyed your stay! ⭐

Safe travels and we hope to see you again! 🙏`
};

/**
 * Get today's date as YYYY-MM-DD
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days after a given date
 */
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Fill template placeholders with property data
 */
function fillTemplate(template, property, config) {
  return template
    .replace(/{property_name}/g, property.name || 'your property')
    .replace(/{wifi_password}/g, config.wifi_password || 'Ask the host')
    .replace(/{checkin_instructions}/g, config.checkin_instructions || 'Check your booking confirmation')
    .replace(/{local_tips}/g, config.local_tips || 'Ask me for local recommendations!')
    .replace(/{house_rules}/g, config.house_rules || 'Please be respectful of neighbors');
}

/**
 * Get or create message templates for a property
 */
async function getTemplates(propertyId) {
  const { data: templates } = await supabase
    .from('property_message_templates')
    .select('*')
    .eq('property_id', propertyId);

  if (templates && templates.length > 0) {
    const map = {};
    templates.forEach(t => { map[t.template_type] = t; });
    return map;
  }

  // Insert defaults
  const inserts = Object.entries(DEFAULT_TEMPLATES).map(([type, msg]) => ({
    property_id: propertyId,
    template_type: type,
    message_template: msg,
    enabled: true
  }));

  const { data: created } = await supabase
    .from('property_message_templates')
    .insert(inserts)
    .select();

  const map = {};
  if (created) {
    created.forEach(t => { map[t.template_type] = t; });
  }
  return map;
}

/**
 * Send WhatsApp message
 */
async function sendWhatsApp(to, message) {
  try {
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
      body: message
    });
    console.log(`✅ Auto-message sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send auto-message to ${to}:`, error.message);
    return false;
  }
}

/**
 * Process all automatic messages for today
 */
async function processAutoMessages() {
  const today = getTodayDate();
  console.log(`📬 Processing auto-messages for ${today}...`);

  // Get all properties with their configs
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*, property_config_sheets(*)');

  if (error || !properties) {
    console.error('Failed to fetch properties:', error);
    return { sent: 0, errors: 0 };
  }

  let sent = 0;
  let errors = 0;

  for (const property of properties) {
    const config = Array.isArray(property.property_config_sheets)
      ? property.property_config_sheets[0] || {}
      : property.property_config_sheets || {};

    const templates = await getTemplates(property.id);

    // Get bookings that match today for different message types
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', property.id)
      .not('guest_phone', 'is', null);

    if (!bookings) continue;

    for (const booking of bookings) {
      const checkin = booking.check_in_date?.split('T')[0];
      const checkout = booking.check_out_date?.split('T')[0];
      if (!checkin || !checkout) continue;

      const day2 = addDays(checkin, 1);
      let templateType = null;

      if (today === checkin) templateType = 'welcome';
      else if (today === day2) templateType = 'midstay';
      else if (today === checkout) templateType = 'checkout';

      if (!templateType) continue;

      const tmpl = templates[templateType];
      if (!tmpl || !tmpl.enabled) continue;

      // Check if already sent today
      const { data: existing } = await supabase
        .from('goconcierge_messages')
        .select('id')
        .eq('property_id', property.id)
        .eq('guest_phone', booking.guest_phone)
        .gte('timestamp', today + 'T00:00:00')
        .like('message', `%[auto:${templateType}]%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const message = fillTemplate(tmpl.message_template, property, config);
      const success = await sendWhatsApp(booking.guest_phone, message);

      if (success) {
        sent++;
        // Log conversation
        await supabase.from('goconcierge_messages').insert({
          property_id: property.id,
          guest_phone: booking.guest_phone,
          message: `[auto:${templateType}]`,
          response: message,
          timestamp: new Date().toISOString()
        });
      } else {
        errors++;
      }
    }
  }

  console.log(`📬 Auto-messages complete: ${sent} sent, ${errors} errors`);
  return { sent, errors };
}

// Export for use in whatsapp_server.js routes
module.exports = { processAutoMessages, getTemplates, DEFAULT_TEMPLATES };

// If run directly: execute immediately
if (require.main === module) {
  processAutoMessages().then(result => {
    console.log('Result:', result);
    process.exit(0);
  });
}
