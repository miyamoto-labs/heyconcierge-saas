'use client'
import { Check, X as XIcon, Bot } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'

const tiers = [
  {
    name: 'Free', price: '$0', period: '/forever', highlighted: false, plan: 'free',
    desc: 'Perfect for getting started',
    features: [
      { text: '1 agent project', included: true },
      { text: '3 basic templates', included: true, note: 'Customer Support, Price Monitor, Content Creator' },
      { text: 'JSON export only', included: true },
      { text: '100 runs/month', included: true },
      { text: 'Community support', included: true },
      { text: 'All templates', included: false },
      { text: 'Python/Docker/OpenClaw export', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
    cta: 'Get Started Free', href: '/builder',
  },
  {
    name: 'Pro', price: '$29', period: '/mo', highlighted: true, plan: 'pro',
    desc: 'For serious builders',
    features: [
      { text: '10 agent projects', included: true },
      { text: 'ALL templates', included: true, note: 'Including Social Media Manager, Email Responder' },
      { text: 'Export: OpenClaw, Python, Docker, JSON', included: true },
      { text: 'Unlimited runs', included: true },
      { text: 'Priority support', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Custom triggers', included: true },
      { text: 'Team features', included: false },
    ],
    cta: 'Start Pro Trial', href: '#',
  },
  {
    name: 'Team', price: '$79', period: '/mo', highlighted: false, plan: 'team',
    desc: 'For teams and agencies',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'All Pro features', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'Custom templates', included: true },
      { text: 'White-label export', included: true },
      { text: 'SSO & audit logs', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom onboarding', included: true },
    ],
    cta: 'Contact Sales', href: '#',
  },
]

function PricingContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  async function handleCheckout(plan: string) {
    if (plan === 'free') {
      window.location.href = '/builder'
      return
    }
    if (!user) {
      window.location.href = '/auth/callback?next=/pricing'
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-5xl mx-auto pb-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="text-gray-500 text-lg">Start free. Upgrade when you need more power.</p>
        {success && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 max-w-md mx-auto">
            🎉 Welcome to Pro! Your subscription is active.
          </div>
        )}
        {canceled && (
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 max-w-md mx-auto">
            Checkout canceled. No charges were made.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div key={tier.name} className={`rounded-2xl border p-6 flex flex-col ${tier.highlighted ? 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10 relative' : 'border-white/10 bg-gray-900'}`}>
            {tier.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-purple-600 text-white">Most Popular</span>}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{tier.desc}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-500">{tier.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map(f => (
                <li key={f.text} className={`flex items-start gap-2 text-sm ${f.included ? 'text-gray-300' : 'text-gray-600'}`}>
                  {f.included ? (
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XIcon className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(tier.plan)}
              disabled={loading === tier.plan}
              className={`block w-full text-center px-4 py-3 rounded-xl font-medium transition ${tier.highlighted ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === tier.plan ? 'Redirecting...' : tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        {[
          { q: 'Can I upgrade later?', a: 'Yes! Start free and upgrade to Pro anytime. Your projects and data carry over.' },
          { q: 'What export formats are free?', a: 'Free tier includes JSON export. Pro unlocks Python, Docker, and OpenClaw config exports.' },
          { q: 'What templates are free?', a: 'Customer Support Bot, Price Monitor, and Content Creator are free. All other templates require Pro.' },
          { q: 'Is there a refund policy?', a: 'Yes, 14-day money-back guarantee on all paid plans. No questions asked.' },
        ].map(faq => (
          <div key={faq.q} className="mb-6 bg-gray-900/60 border border-white/[0.06] rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
            <p className="text-sm text-gray-400">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-white/[0.06] text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Bot className="w-4 h-4 text-purple-500" />
          <a href="https://miyamotolabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition">Powered by Miyamoto Labs</a>
        </div>
      </footer>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 px-6 max-w-5xl mx-auto pb-20 text-center">Loading...</div>}>
      <PricingContent />
    </Suspense>
  )
}
