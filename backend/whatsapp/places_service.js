/**
 * Google Places Service for HeyConcierge
 * Searches for nearby restaurants, cafes, bars, etc. using Google Places API
 * Returns real data with direct Google Maps links
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Search for nearby places using Google Places Text Search API
 */
async function searchPlaces({ query, latitude, longitude, type, limit = 5 }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return [];
  }

  const location = `${latitude},${longitude}`;
  const radius = 5000; // 5km radius

  // Use Text Search for better results with natural language queries
  const params = new URLSearchParams({
    query: query,
    location,
    radius: String(radius),
    key: GOOGLE_MAPS_API_KEY,
  });

  if (type) {
    params.set('type', type);
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
    );
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    const places = (data.results || []).slice(0, limit).map(place => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      reviewCount: place.user_ratings_total || 0,
      priceLevel: place.price_level != null ? '$'.repeat(place.price_level) : null,
      isOpen: place.opening_hours?.open_now ?? null,
      placeId: place.place_id,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      types: place.types || [],
    }));

    return places;
  } catch (error) {
    console.error('Google Places search failed:', error.message);
    return [];
  }
}

/**
 * Get detailed info for a specific place
 */
async function getPlaceDetails(placeId) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const fields = 'name,formatted_address,formatted_phone_number,rating,user_ratings_total,price_level,opening_hours,website,url,reviews';
  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key: GOOGLE_MAPS_API_KEY,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );
    const data = await res.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details error:', data.status);
      return null;
    }

    const p = data.result;
    return {
      name: p.name,
      address: p.formatted_address,
      phone: p.formatted_phone_number || null,
      rating: p.rating || null,
      reviewCount: p.user_ratings_total || 0,
      priceLevel: p.price_level != null ? '$'.repeat(p.price_level) : null,
      website: p.website || null,
      mapsUrl: p.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      hours: p.opening_hours?.weekday_text || null,
      isOpen: p.opening_hours?.open_now ?? null,
    };
  } catch (error) {
    console.error('Google Places details failed:', error.message);
    return null;
  }
}

/**
 * Format places for Claude prompt
 */
function formatPlacesForPrompt(places) {
  return places.map((p, i) => {
    const parts = [
      `${i + 1}. ${p.name}`,
      p.rating ? `   Rating: ${p.rating}/5 (${p.reviewCount} reviews)` : null,
      p.priceLevel ? `   Price: ${p.priceLevel}` : null,
      p.address ? `   Address: ${p.address}` : null,
      p.isOpen !== null ? `   Currently: ${p.isOpen ? 'Open' : 'Closed'}` : null,
      `   Google Maps: ${p.mapsUrl}`,
    ];
    return parts.filter(Boolean).join('\n');
  }).join('\n\n');
}

// Claude tool definition for searching places
const PLACES_SEARCH_TOOL = {
  name: 'search_places',
  description: 'Search for nearby restaurants, cafes, bars, attractions, shops, pharmacies, supermarkets, or any other type of place. Use this whenever a guest asks for recommendations or directions to local businesses and points of interest.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query, e.g. "best sushi restaurant", "pharmacy", "cozy cafe with wifi", "supermarket"',
      },
    },
    required: ['query'],
  },
};

// Claude tool definition for getting place details
const PLACE_DETAILS_TOOL = {
  name: 'get_place_details',
  description: 'Get detailed information about a specific place from the search results, including opening hours, phone number, and website.',
  input_schema: {
    type: 'object',
    properties: {
      place_number: {
        type: 'integer',
        description: 'The number of the place from the search results (1-based)',
      },
    },
    required: ['place_number'],
  },
};

module.exports = {
  searchPlaces,
  getPlaceDetails,
  formatPlacesForPrompt,
  PLACES_SEARCH_TOOL,
  PLACE_DETAILS_TOOL,
};
