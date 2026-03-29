'use client'

import { useEffect, useState } from 'react'

interface GeoPriceData {
  country: string
  currency: string
  symbol: string
  price: string
  formattedPrice: string
  flag: string
}

interface GeoPriceProps {
  /** 'hero' = large serif number + small label underneath */
  variant?: 'hero' | 'inline'
  className?: string
}

const USD_DEFAULT: GeoPriceData = {
  country: 'US', currency: 'USD', symbol: '$',
  price: '12.99', formattedPrice: '$12.99', flag: '🇺🇸',
}

export function GeoPrice({ variant = 'inline', className }: GeoPriceProps) {
  // Start with USD so the price is always visible immediately — no skeleton
  const [data, setData] = useState<GeoPriceData>(USD_DEFAULT)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    fetch('/api/geo-price', { signal: controller.signal })
      .then(r => r.json())
      .then(d => { clearTimeout(timer); setData(d) })
      .catch(() => clearTimeout(timer)) // on failure keep showing USD default

    return () => { clearTimeout(timer); controller.abort() }
  }, [])

  if (variant === 'hero') {
    return (
      <span className={className}>
        <span title={`${data.currency} · detected country: ${data.country}`}>
          {data.formattedPrice}
        </span>
        {data.currency !== 'USD' && (
          <span className="text-xs text-earth-muted ml-1 font-sans font-normal align-middle">
            {data.flag}
          </span>
        )}
      </span>
    )
  }

  // inline variant — used in the CTA footer line
  return (
    <span className={className} title={`${data.currency} · detected country: ${data.country}`}>
      {data.formattedPrice} / property / month after trial
      {data.currency !== 'USD' && (
        <span className="ml-1">{data.flag}</span>
      )}
    </span>
  )
}
