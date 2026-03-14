/**
 * HeyConcierge OTA Activity Provider (CommonJS)
 * Unified search across GetYourGuide + Viator with affiliate deep links
 * Used by the WhatsApp backend server (whatsapp_server.js)
 */

const { createClient } = require('@supabase/supabase-js');

// --- Rate limiter per provider ---
const rateLimiters = {};

function getRateLimiter(provider) {
  if (!rateLimiters[provider]) {
    const limits = {
      viator: { maxPerMinute: 30, baseDelay: 1000 },
      getyourguide: { maxPerMinute: 60, baseDelay: 500 },
    };
    const config = limits[provider] || limits.viator;
    rateLimiters[provider] = {
      timestamps: [],
      config,
      async execute(fn) {
        // Clean old timestamps
        const cutoff = Date.now() - 60000;
        this.timestamps = this.timestamps.filter(ts => ts > cutoff);

        // Wait if at limit
        if (this.timestamps.length >= this.config.maxPerMinute) {
          const waitMs = this.timestamps[0] + 60000 - Date.now() + 100;
          await new Promise(r => setTimeout(r, Math.max(100, waitMs)));
        }

        this.timestamps.push(Date.now());

        // Retry with backoff
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await fn();
          } catch (err) {
            const msg = err.message || '';
            const shouldRetry = /429|500|502|503|504|timeout|ETIMEDOUT/i.test(msg);
            if (!shouldRetry || attempt === 2) throw err;
            const delay = this.config.baseDelay * Math.pow(2, attempt) + Math.random() * 500;
            console.warn(`[${provider}] Retry ${attempt + 1}/3 in ${Math.round(delay)}ms: ${msg}`);
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
    };
  }
  return rateLimiters[provider];
}

// --- Viator API ---

async function searchViator(params) {
  const apiKey = process.env.VIATOR_API_KEY;
  if (!apiKey) return [];

  const limiter = getRateLimiter('viator');
  const baseUrl = process.env.VIATOR_API_URL || 'https://api.sandbox.viator.com/partner';
  const partnerId = process.env.VIATOR_PARTNER_ID || '';

  try {
    const body = {
      searchTerm: params.query || undefined,
      currency: params.currency || 'EUR',
      sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
      pagination: { start: 1, count: params.limit || 10 },
    };

    const data = await limiter.execute(async () => {
      const res = await fetch(`${baseUrl}/products/search`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;version=2.0',
          'Content-Type': 'application/json',
          'exp-api-key': apiKey,
          'Accept-Language': 'en-US',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Viator API ${res.status}: ${await res.text()}`);
      return res.json();
    });

    return (data.products || []).map(p => {
      const price = p.pricing?.summary?.fromPrice ?? 0;
      const image = p.images?.[0]?.variants?.find(v => v.width >= 400) || p.images?.[0]?.variants?.[0];
      const affiliateUrl = buildViatorAffiliateUrl(p.productCode, partnerId, params.propertyId);

      return {
        provider: 'viator',
        externalId: p.productCode,
        name: p.title,
        description: p.description || '',
        shortDescription: p.shortDescription,
        category: p.tags?.[0]?.allNamesByLocale?.['en'] || 'activity',
        durationMinutes: p.duration?.fixedDurationInMinutes || null,
        price: { amount: price, currency: 'EUR', formatted: `€${price.toFixed(2)}` },
        rating: p.reviews?.combinedAverageRating || null,
        reviewCount: p.reviews?.totalReviews || 0,
        imageUrl: image?.url || null,
        bookingUrl: affiliateUrl,
        cancellationPolicy: p.bookingInfo?.cancellationType,
      };
    });
  } catch (err) {
    console.error('Viator search error:', err.message);
    return [];
  }
}

function buildViatorAffiliateUrl(productCode, partnerId, propertyId) {
  const base = `https://www.viator.com/tours/${productCode}`;
  const params = new URLSearchParams();
  if (partnerId) params.set('pid', partnerId);
  if (propertyId) params.set('mcid', `hc_${propertyId}`);
  params.set('medium', 'api');
  params.set('campaign', 'heyconcierge');
  return `${base}?${params.toString()}`;
}

// --- GetYourGuide API ---

async function searchGYG(params) {
  const apiKey = process.env.GYG_API_KEY;
  if (!apiKey) return [];

  const limiter = getRateLimiter('getyourguide');
  const baseUrl = process.env.GYG_API_URL || 'https://api.sandbox.getyourguide.com';
  const partnerId = process.env.GYG_PARTNER_ID || '';

  try {
    const qp = new URLSearchParams();
    if (params.query) qp.set('q', params.query);
    qp.set('coordinates[lat]', String(params.latitude));
    qp.set('coordinates[long]', String(params.longitude));
    qp.set('coordinates[radius]', String((params.radiusKm || 25) * 1000));
    qp.set('currency', params.currency || 'EUR');
    qp.set('limit', String(params.limit || 10));
    qp.set('sortBy', 'rating');
    qp.set('sortDirection', 'DESC');
    if (params.startDate) qp.set('date[from]', params.startDate);

    const data = await limiter.execute(async () => {
      const res = await fetch(`${baseUrl}/1/activities?${qp.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Access-Token': apiKey,
        },
      });
      if (!res.ok) throw new Error(`GYG API ${res.status}: ${await res.text()}`);
      return res.json();
    });

    return (data.data?.activities || []).map(a => {
      const price = a.price?.startingPrice ?? a.price?.values?.amount ?? 0;
      let durationMinutes = null;
      if (a.duration) {
        if (a.duration.unit === 'minute') durationMinutes = a.duration.value;
        else if (a.duration.unit === 'hour') durationMinutes = a.duration.value * 60;
        else if (a.duration.unit === 'day') durationMinutes = a.duration.value * 60 * 24;
      }
      const affiliateUrl = buildGYGAffiliateUrl(a.activity_id, partnerId, params.propertyId);

      return {
        provider: 'getyourguide',
        externalId: String(a.activity_id),
        name: a.title,
        description: a.description || a.abstract || '',
        shortDescription: a.abstract,
        category: a.categories?.[0]?.name || 'activity',
        durationMinutes,
        price: { amount: price, currency: 'EUR', formatted: `€${price.toFixed(2)}` },
        rating: a.overall_rating || null,
        reviewCount: a.number_of_ratings || 0,
        imageUrl: a.pictures?.[0]?.url || null,
        bookingUrl: affiliateUrl,
        highlights: a.highlights,
        cancellationPolicy: a.cancellation_policy?.description || a.cancellation_policy?.type,
      };
    });
  } catch (err) {
    console.error('GYG search error:', err.message);
    return [];
  }
}

function buildGYGAffiliateUrl(activityId, partnerId, propertyId) {
  const base = `https://www.getyourguide.com/activity-${activityId}`;
  const params = new URLSearchParams();
  if (partnerId) params.set('partner_id', partnerId);
  if (propertyId) params.set('cmp', `hc_${propertyId}`);
  params.set('utm_medium', 'api');
  params.set('utm_source', 'heyconcierge');
  return `${base}?${params.toString()}`;
}

// --- Ranking ---

function rankActivities(activities, query) {
  return activities
    .map(a => ({ ...a, _score: computeScore(a, query) }))
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...rest }) => rest);
}

function computeScore(a, query) {
  let score = 0;
  // Rating (0-50)
  score += a.rating ? a.rating * 10 : 25;
  // Review volume (0-20)
  if (a.reviewCount > 0) score += Math.min(20, Math.log10(a.reviewCount) * 7);
  // Price competitiveness (0-15)
  if (a.price.amount > 0) {
    if (a.price.amount < 30) score += 15;
    else if (a.price.amount < 60) score += 12;
    else if (a.price.amount < 100) score += 8;
    else if (a.price.amount < 200) score += 4;
  }
  // Query relevance (0-15)
  if (query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const text = [a.name, a.description, a.category].filter(Boolean).join(' ').toLowerCase();
    const matched = tokens.filter(t => text.includes(t)).length;
    score += tokens.length > 0 ? (matched / tokens.length) * 15 : 7.5;
  }
  return score;
}

// --- Unified search ---

async function searchActivities(params) {
  const [viatorResults, gygResults] = await Promise.all([
    searchViator(params),
    searchGYG(params),
  ]);

  const all = [...viatorResults, ...gygResults];
  const ranked = rankActivities(all, params.query);

  // Apply filters
  let filtered = ranked;
  if (params.minRating) filtered = filtered.filter(a => !a.rating || a.rating >= params.minRating);
  if (params.maxPrice) filtered = filtered.filter(a => a.price.amount <= params.maxPrice);

  return filtered.slice(0, params.limit || 5);
}

// --- Format for Claude tool response ---

function formatActivitiesForPrompt(activities, maxItems = 5) {
  if (activities.length === 0) return 'No activities found matching the search criteria.';

  return activities.slice(0, maxItems).map((a, i) => {
    const parts = [
      `${i + 1}. ${a.name}`,
      `   Provider: ${a.provider === 'getyourguide' ? 'GetYourGuide' : 'Viator'}`,
      `   Price: ${a.price.formatted}`,
    ];
    if (a.rating) parts.push(`   Rating: ${a.rating}/5 (${a.reviewCount} reviews)`);
    if (a.durationMinutes) {
      const dur = a.durationMinutes < 60 ? `${a.durationMinutes} min` : `${Math.floor(a.durationMinutes / 60)}h`;
      parts.push(`   Duration: ${dur}`);
    }
    if (a.shortDescription) parts.push(`   ${a.shortDescription}`);
    if (a.cancellationPolicy) parts.push(`   Cancellation: ${a.cancellationPolicy}`);
    parts.push(`   Book here: ${a.bookingUrl}`);
    return parts.join('\n');
  }).join('\n\n');
}

// --- Log affiliate click ---

async function logAffiliateClick(supabase, propertyId, activity, guestPhone) {
  try {
    await supabase.from('activity_clicks').insert({
      property_id: propertyId,
      activity_provider: activity.provider,
      activity_external_id: activity.externalId,
      activity_name: activity.name,
      guest_phone: guestPhone || null,
      booking_url: activity.bookingUrl,
    });
  } catch (err) {
    console.error('Failed to log affiliate click:', err.message);
  }
}

// --- Claude tool definitions ---

const ACTIVITY_SEARCH_TOOL = {
  name: 'search_activities',
  description: 'Search for activities, tours, and experiences near the property. Use this when a guest asks about things to do, tours, activities, experiences, sightseeing, or excursions. Returns top-rated options with prices and booking links.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What the guest is looking for, e.g. "northern lights tour", "kayaking", "museum". Leave empty for general recommendations.',
      },
      date: {
        type: 'string',
        description: 'Preferred date in YYYY-MM-DD format, if the guest mentioned a specific date.',
      },
      participants: {
        type: 'number',
        description: 'Number of participants, if mentioned by the guest. Defaults to 2.',
      },
      max_price: {
        type: 'number',
        description: 'Maximum price per person in EUR, if the guest has a budget.',
      },
    },
    required: [],
  },
};

const ACTIVITY_DETAILS_TOOL = {
  name: 'get_activity_details',
  description: 'Get detailed information about a specific activity by its number from the previous search results. Use when a guest asks for more details about a specific option.',
  input_schema: {
    type: 'object',
    properties: {
      activity_number: {
        type: 'number',
        description: 'The number of the activity from the search results (1, 2, 3, etc.)',
      },
    },
    required: ['activity_number'],
  },
};

module.exports = {
  searchActivities,
  formatActivitiesForPrompt,
  logAffiliateClick,
  rankActivities,
  ACTIVITY_SEARCH_TOOL,
  ACTIVITY_DETAILS_TOOL,
};
