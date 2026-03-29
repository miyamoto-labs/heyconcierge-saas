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

export function GeoPrice({ variant = 'inline', className }: GeoPriceProps) {
  const [data, setData] = useState<GeoPriceData | null>(null)

  useEffect(() => {
    fetch('/api/geo-price')
      .then(r => r.json())
      .then(setData)
      .catch(() => {
        // Fallback to USD on any error
        setData({
          country: 'US',
          currency: 'USD',
          symbol: '$',
          price: '12.99',
          formattedPrice: '$12.99',
          flag: '🇺🇸',
        })
      })
  }, [])

  if (!data) {
    // Skeleton — same width as default USD price so layout doesn't shift
    return variant === 'hero'
      ? <span className={`inline-block w-16 h-7 bg-earth-border/50 rounded animate-pulse ${className ?? ''}`} />
      : <span className={`inline-block w-14 h-4 bg-earth-border/50 rounded animate-pulse align-middle ${className ?? ''}`} />
  }

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
