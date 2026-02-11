/**
 * Check-in Reminder Service
 * Sends WhatsApp reminders 24h before guest arrival
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

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Format check-in message with property info
 */
function formatCheckinMessage(booking, property, config) {
  const propertyName = property.name;
  const guestName = booking.guest_name;
  const checkinDate = new Date(booking.check_in_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let message = `👋 Hi ${guestName}!\n\n`;
  message += `This is your friendly reminder that you're checking in to ${propertyName} tomorrow (${checkinDate}).\n\n`;
  
  if (config.checkin_instructions) {
    message += `📍 Check-in Instructions:\n${config.checkin_instructions}\n\n`;
  }
  
  if (config.wifi_password) {
    message += `📶 WiFi Password: ${config.wifi_password}\n\n`;
  }
  
  if (config.house_rules) {
    message += `📋 House Rules:\n${config.house_rules}\n\n`;
  }
  
  message += `We're excited to host you! If you have any questions, just reply to this message.\n\n`;
  message += `Safe travels! 🏡`;
  
  return message;
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
    console.log(`✅ Reminder sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send to ${to}:`, error.message);
    return false;
  }
}

/**
 * Log reminder in database
 */
async function logReminder(bookingId, propertyId, guestPhone, sent) {
  try {
    await supabase
      .from('goconcierge_messages')
      .insert({
        property_id: propertyId,
        guest_phone: guestPhone,
        message: 'CHECK_IN_REMINDER_SENT',
        response: sent ? 'SUCCESS' : 'FAILED',
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log reminder:', error);
  }
}

/**
 * Send check-in reminders for tomorrow's arrivals
 */
async function sendCheckinReminders() {
  try {
    console.log('🔔 Starting check-in reminder service...');
    
    const tomorrow = getTomorrowDate();
    console.log(`📅 Looking for check-ins on: ${tomorrow}`);
    
    // Get tomorrow's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, properties!inner(*, property_config_sheets(*))')
      .eq('check_in_date', tomorrow)
      .eq('status', 'confirmed');
    
    if (bookingsError) throw bookingsError;
    
    console.log(`📋 Found ${bookings?.length || 0} check-ins tomorrow`);
    
    if (!bookings || bookings.length === 0) {
      console.log('✅ No reminders to send');
      return { sent: 0, failed: 0 };
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const booking of bookings) {
      const property = booking.properties;
      
      // Skip if no WhatsApp number configured
      if (!property.whatsapp_number) {
        console.log(`⚠️ Skipping ${property.name} - no WhatsApp number configured`);
        failed++;
        continue;
      }
      
      // Get config (handle array format)
      let config = property.property_config_sheets;
      if (Array.isArray(config) && config.length > 0) {
        config = config[0];
      } else if (!config) {
        config = {};
      }
      
      // Skip if no check-in instructions
      if (!config.checkin_instructions && !config.wifi_password) {
        console.log(`⚠️ Skipping ${property.name} - no check-in info configured`);
        failed++;
        continue;
      }
      
      // Format and send message
      const message = formatCheckinMessage(booking, property, config);
      const success = await sendWhatsApp(property.whatsapp_number, message);
      
      if (success) {
        sent++;
      } else {
        failed++;
      }
      
      // Log reminder
      await logReminder(booking.id, property.id, property.whatsapp_number, success);
      
      // Rate limit: wait 2 seconds between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ Reminder service complete: ${sent} sent, ${failed} failed`);
    
    return { sent, failed, total: bookings.length };
  } catch (error) {
    console.error('❌ Reminder service error:', error);
    throw error;
  }
}

/**
 * Test reminder for a specific booking
 */
async function sendTestReminder(bookingId) {
  try {
    console.log(`🧪 Sending test reminder for booking: ${bookingId}`);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, properties!inner(*, property_config_sheets(*))')
      .eq('id', bookingId)
      .single();
    
    if (error || !booking) {
      throw new Error('Booking not found');
    }
    
    const property = booking.properties;
    
    if (!property.whatsapp_number) {
      throw new Error('Property has no WhatsApp number configured');
    }
    
    let config = property.property_config_sheets;
    if (Array.isArray(config) && config.length > 0) {
      config = config[0];
    } else if (!config) {
      config = {};
    }
    
    const message = formatCheckinMessage(booking, property, config);
    const success = await sendWhatsApp(property.whatsapp_number, message);
    
    await logReminder(booking.id, property.id, property.whatsapp_number, success);
    
    return { success, message };
  } catch (error) {
    console.error('Test reminder failed:', error);
    throw error;
  }
}

module.exports = {
  sendCheckinReminders,
  sendTestReminder,
  getTomorrowDate,
};
