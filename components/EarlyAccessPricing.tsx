'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import type { GeoPriceResponse } from '@/app/api/geo-price/route'

const USD_FALLBACK: GeoPriceResponse = {
  country: 'US', currency: 'USD', symbol: '$', flag: '🇺🇸',
  promoPrice: '12.99',  formattedPromoPrice: '$12.99',
  regularPrice: '19.99', formattedRegularPrice: '$19.99',
  price: '12.99', formattedPrice: '$12.99',
}

export function EarlyAccessPricing() {
  const [data, setData] = useState<GeoPriceResponse>(USD_FALLBACK)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    fetch('/api/geo-price', { signal: controller.signal })
      .then(r => r.json())
      .then(d => { clearTimeout(timer); setData(d) })
      .catch(() => clearTimeout(timer))
    return () => { clearTimeout(timer); controller.abort() }
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Banner */}
      <div className="bg-grove text-white text-xs font-medium text-center py-2.5 px-4 rounded-t-2xl tracking-wide">
        Early access pricing — locks in for life. Price goes up at public launch.
      </div>

      {/* Card */}
      <div className="border border-grove/30 border-t-0 rounded-b-2xl p-8 bg-white">

        {/* Badge + currency */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 bg-grove-subtle text-grove text-xs font-semibold px-3 py-1 rounded-full">
            <Lock size={10} strokeWidth={2.5} /> Early Access
          </span>
          <span className="text-xs text-earth-muted">{data.currency} {data.flag}</span>
        </div>

        {/* Price display */}
        <div className="mb-2">
          <span className="text-sm text-earth-muted line-through mr-2">
            {data.formattedRegularPrice}
          </span>
          <span className="text-xs text-earth-muted">at public launch</span>
        </div>
        <div className="flex items-end gap-2 mb-1">
          <span className="font-serif text-5xl text-earth-dark leading-none">
            {data.formattedPromoPrice}
          </span>
        </div>
        <p className="text-sm text-earth-muted mb-1">per property / month</p>
        <div className="flex items-center gap-1.5 mb-8">
          <Lock size={11} className="text-grove" strokeWidth={2} />
          <p className="text-xs text-grove font-medium">
            Locks in for life as long as you stay subscribed
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 bg-grove hover:bg-grove-dark text-white w-full py-4 rounded-full font-medium text-sm no-underline transition-all mb-3"
        >
          Start 30-Day Free Trial <ArrowRight size={15} />
        </Link>
        <p className="text-center text-xs text-earth-light">
          Limited spots at this price. &nbsp;·&nbsp; No credit card required to start. &nbsp;·&nbsp; Cancel anytime.
        </p>

        {/* Feature list */}
        <div className="mt-8 pt-6 border-t border-earth-border space-y-3">
          {[
            '24/7 AI chat on WhatsApp, Telegram & SMS',
            'Responds in 50+ languages automatically',
            'Trained on your property — not generic answers',
            'Earn commission when guests book experiences',
            'Sync with Airbnb, VRBO & iCal calendars',
            'Cancel anytime — no lock-in',
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-grove-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-grove" />
              </div>
              <p className="text-sm text-earth-text">{f}</p>
            </div>
          ))}
        </div>

        {/* Enterprise footnote */}
        <p className="mt-6 text-center text-xs text-earth-light">
          10+ properties?{' '}
          <a href="mailto:hello@heyconcierge.io" className="text-grove hover:underline">
            Contact us for enterprise pricing
          </a>
        </p>
      </div>
    </div>
  )
}
