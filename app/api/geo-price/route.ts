import { NextRequest, NextResponse } from 'next/server'

export interface GeoPriceResponse {
  country: string
  currency: string
  symbol: string
  flag: string
  // Current early-access price
  promoPrice: string
  formattedPromoPrice: string
  // Future / anchor price shown crossed-out
  regularPrice: string
  formattedRegularPrice: string
  // Legacy field — same as promoPrice, kept for GeoPrice component compat
  price: string
  formattedPrice: string
}

// ─── PRICING CONFIG ───────────────────────────────────────────────────────────
// Update these when prices change. regularPrice is the future anchor price shown
// crossed-out to create urgency. promoPrice is what the customer pays today.
const PRICE_MAP: Record<string, {
  currency: string
  symbol: string
  promoPrice: string
  regularPrice: string
  flag: string
}> = {
  USD: { currency: 'USD', symbol: '$',  promoPrice: '12.99', regularPrice: '19.99', flag: '🇺🇸' },
  NOK: { currency: 'NOK', symbol: 'kr', promoPrice: '129',   regularPrice: '199',   flag: '🇳🇴' },
  DKK: { currency: 'DKK', symbol: 'kr', promoPrice: '129',   regularPrice: '199',   flag: '🇩🇰' },
  EUR: { currency: 'EUR', symbol: '€',  promoPrice: '11.99', regularPrice: '17.99', flag: '🇪🇺' },
  GBP: { currency: 'GBP', symbol: '£',  promoPrice: '9.99',  regularPrice: '14.99', flag: '🇬🇧' },
}
// ─────────────────────────────────────────────────────────────────────────────

// Country → currency mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Scandinavia / Nordics
  NO: 'NOK',
  DK: 'DKK',
  SE: 'NOK',
  FI: 'EUR',
  // Eurozone
  DE: 'EUR', AT: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', PT: 'EUR', IE: 'EUR', GR: 'EUR', LU: 'EUR', MT: 'EUR',
  CY: 'EUR', SI: 'EUR', SK: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR',
  // UK
  GB: 'GBP',
  // US / rest of world → USD
}

function fmt(price: string, symbol: string, currency: string): string {
  if (currency === 'NOK' || currency === 'DKK') return `${price} ${symbol}`
  if (currency === 'EUR') return `${price} ${symbol}`
  return `${symbol}${price}`
}

export async function GET(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    process.env.NEXT_PUBLIC_DEV_COUNTRY ||
    'US'

  const currencyCode = COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? 'USD'
  const p = PRICE_MAP[currencyCode] ?? PRICE_MAP['USD']

  const response: GeoPriceResponse = {
    country:              country.toUpperCase(),
    currency:             p.currency,
    symbol:               p.symbol,
    flag:                 p.flag,
    promoPrice:           p.promoPrice,
    formattedPromoPrice:  fmt(p.promoPrice,   p.symbol, p.currency),
    regularPrice:         p.regularPrice,
    formattedRegularPrice: fmt(p.regularPrice, p.symbol, p.currency),
    // Legacy compat
    price:                p.promoPrice,
    formattedPrice:       fmt(p.promoPrice,   p.symbol, p.currency),
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, max-age=3600' },
  })
}
