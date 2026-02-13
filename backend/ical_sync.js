/**
 * iCal Sync Service
 * Fetches and parses .ics calendars from Airbnb, VRBO, Booking.com
 * Stores bookings in Supabase
 */

const ical = require('ical');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Fetch and parse iCal from URL
 */
async function fetchIcal(url) {
  try {
    console.log(`📥 Fetching iCal from: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    const events = ical.parseICS(response.data);
    return events;
  } catch (error) {
    console.error('Failed to fetch iCal:', error.message);
    throw error;
  }
}

/**
 * Extract bookings from iCal events
 */
function parseBookings(events, propertyId) {
  const bookings = [];
  
  for (const key in events) {
    const event = events[key];
    
    if (event.type === 'VEVENT' && event.start && event.end) {
      const summary = event.summary || 'Untitled Booking';
      const description = event.description || '';
      
      // Detect platform from summary/description
      let platform = 'Unknown';
      if (summary.toLowerCase().includes('airbnb') || description.toLowerCase().includes('airbnb')) {
        platform = 'Airbnb';
      } else if (summary.toLowerCase().includes('vrbo') || description.toLowerCase().includes('vrbo')) {
        platform = 'VRBO';
      } else if (summary.toLowerCase().includes('booking') || description.toLowerCase().includes('booking.com')) {
        platform = 'Booking.com';
      }
      
      // Extract guest name (usually in summary)
      let guestName = 'Guest';
      const nameParts = summary.split(' - ');
      if (nameParts.length > 0) {
        guestName = nameParts[0].replace(/^(Reserved|Booked|Blocked|Not available)\s*/i, '').trim();
      }
      
      // Skip if it's just "Not available" or "Blocked"
      if (guestName.match(/^(Not available|Blocked|Reserved)$/i)) {
        guestName = 'Blocked';
        platform = 'Manual Block';
      }
      
      bookings.push({
        property_id: propertyId,
        guest_name: guestName,
        check_in_date: event.start.toISOString().split('T')[0],
        check_out_date: event.end.toISOString().split('T')[0],
        platform,
        status: new Date(event.start) > new Date() ? 'confirmed' : 'completed',
      });
    }
  }
  
  return bookings;
}

/**
 * Sync bookings for a property
 */
async function syncProperty(propertyId, icalUrl) {
  try {
    console.log(`🔄 Syncing property: ${propertyId}`);
    
    // Fetch and parse iCal
    const events = await fetchIcal(icalUrl);
    const bookings = parseBookings(events, propertyId);
    
    console.log(`📋 Found ${bookings.length} bookings`);
    
    // Delete old bookings for this property
    await supabase
      .from('bookings')
      .delete()
      .eq('property_id', propertyId);
    
    // Insert new bookings
    if (bookings.length > 0) {
      const { error } = await supabase
        .from('bookings')
        .insert(bookings);
      
      if (error) {
        console.error('Failed to insert bookings:', error);
        throw error;
      }
    }
    
    console.log(`✅ Synced ${bookings.length} bookings for property ${propertyId}`);
    
    return { success: true, count: bookings.length };
  } catch (error) {
    console.error(`❌ Sync failed for property ${propertyId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync all properties with iCal URLs
 */
async function syncAllProperties() {
  try {
    console.log('🔄 Starting sync for all properties...');
    
    // Get all properties with iCal URLs
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, name, ical_url')
      .not('ical_url', 'is', null)
      .neq('ical_url', '');
    
    if (error) throw error;
    
    console.log(`📋 Found ${properties.length} properties with iCal URLs`);
    
    const results = [];
    for (const property of properties) {
      const result = await syncProperty(property.id, property.ical_url);
      results.push({ property: property.name, ...result });
    }
    
    console.log('✅ All properties synced');
    return results;
  } catch (error) {
    console.error('❌ Sync all failed:', error.message);
    throw error;
  }
}

module.exports = {
  syncProperty,
  syncAllProperties,
  fetchIcal,
  parseBookings,
};
