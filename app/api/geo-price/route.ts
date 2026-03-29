import { NextRequest, NextResponse } from 'next/server'

interface GeoPriceResponse {
  country: string
  currency: string
  symbol: string
  price: string
  formattedPrice: string
  flag: string
}

// Hardcoded psychologically-clean price map
const PRICE_MAP: Record<string, { currency: string; symbol: string; price: string; flag: string }> = {
  USD: { currency: 'USD', symbol: '$',  price: '12.99', flag: '🇺🇸' },
  NOK: { currency: 'NOK', symbol: 'kr', price: '129',   flag: '🇳🇴' },
  DKK: { currency: 'DKK', symbol: 'kr', price: '129',   flag: '🇩🇰' },
  EUR: { currency: 'EUR', symbol: '€',  price: '11.99', flag: '🇪🇺' },
  GBP: { currency: 'GBP', symbol: '£',  price: '9.99',  flag: '🇬🇧' },
}

// Country → currency mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Scandinavia / Nordics
  NO: 'NOK',
  DK: 'DKK',
  SE: 'NOK', // Sweden uses SEK but we map to NOK as closest psychologically
  FI: 'EUR',
  // Eurozone
  DE: 'EUR', AT: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', PT: 'EUR', IE: 'EUR', GR: 'EUR', LU: 'EUR', MT: 'EUR',
  CY: 'EUR', SI: 'EUR', SK: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR',
  // UK
  GB: 'GBP',
  // US / rest of world → USD
}

function formatPrice(price: string, symbol: string, currency: string): string {
  if (currency === 'NOK' || currency === 'DKK') {
    return `${price} ${symbol}` // "129 kr"
  }
  if (currency === 'EUR') {
    return `${price} ${symbol}` // "11.99 €"
  }
  return `${symbol}${price}` // "$12.99" / "£9.99"
}

export async function GET(request: NextRequest) {
  // Read Vercel geo header (only available in production/preview)
  const country =
    request.headers.get('x-vercel-ip-country') ||
    // Local dev override: set NEXT_PUBLIC_DEV_COUNTRY=NO in .env.local
    process.env.NEXT_PUBLIC_DEV_COUNTRY ||
    'US'

  const currencyCode = COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? 'USD'
  const priceData = PRICE_MAP[currencyCode] ?? PRICE_MAP['USD']

  const response: GeoPriceResponse = {
    country: country.toUpperCase(),
    currency: priceData.currency,
    symbol: priceData.symbol,
    price: priceData.price,
    formattedPrice: formatPrice(priceData.price, priceData.symbol, priceData.currency),
    flag: priceData.flag,
  }

  return NextResponse.json(response, {
    headers: {
      // Private: each user's browser caches their own geo response.
      // Must NOT be public — Vercel's CDN would cache one country's price for all users.
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
